import mongoose from 'mongoose';
import Notification, { INotification } from '../models/Notification';
import User from '../models/User';
import type { IComment } from '../models/Comment';
import type { IReport } from '../models/Report';
import { notificationEvents } from './notificationEvents';
import { isReportPath } from '../utils/reportPolicy';

export async function createNotification(
  input: Pick<
    INotification,
    'recipient' | 'type' | 'dedupeKey' | 'target' | 'data'
  >
) {
  try {
    const result = await Notification.updateOne(
      { dedupeKey: input.dedupeKey },
      { $setOnInsert: input },
      { upsert: true, runValidators: true }
    );
    if (result.upsertedId)
      notificationEvents.publish(String(input.recipient), {
        kind: 'created',
        id: String(result.upsertedId),
      });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000)
      console.warn(
        '[Notifications] Could not persist notification:',
        (error as Error).name
      );
  }
}

// Notifications are a side effect: failures must not make a successful comment or
// moderation action look unsuccessful and encourage users to submit it twice.
async function deliver(task: () => Promise<void>) {
  try {
    await task();
  } catch (error) {
    console.warn('[Notifications] Delivery failed:', (error as Error).name);
  }
}

export const notifyReply = (comment: IComment & { sourcePath?: string }) =>
  deliver(async () => {
    if (
      !comment.parentComment ||
      comment.isDeleted ||
      comment.isHidden ||
      !comment.isApproved
    )
      return;
    const key = `reply:${comment.id}`;
    if (await Notification.exists({ dedupeKey: key })) return;
    const Comment = mongoose.model<IComment & { sourcePath?: string }>(
      'Comment'
    );
    const parent = await Comment.findOne({
      _id: comment.parentComment,
      movie: comment.movie,
      isDeleted: false,
      isHidden: { $ne: true },
      isApproved: true,
    });
    const actorId = String((comment.user as any)?._id || comment.user);
    if (!parent || String(parent.user) === actorId) return;
    const actor = await User.findById(actorId).select('name');
    const source =
      [comment.sourcePath, parent.sourcePath].find(
        (path) => isReportPath(path) && /^\/(movie|watch)\//.test(path!)
      ) || `/movie/${comment.movie}`;
    await createNotification({
      recipient: parent.user,
      type: 'COMMENT_REPLY',
      dedupeKey: key,
      target: `${source.split('#')[0]}#comment-${parent.id}`,
      data: {
        actorName: actor?.name || '',
        preview: comment.isSpoiler ? '' : comment.text.slice(0, 200),
      },
    });
  });

export const notifyVisibleReplies = (ids: unknown[]) =>
  deliver(async () => {
    const Comment = mongoose.model<IComment>('Comment');
    const replies = await Comment.find({
      _id: { $in: ids },
      parentComment: { $ne: null },
      isDeleted: false,
      isHidden: { $ne: true },
      isApproved: true,
    });
    for (const reply of replies) await notifyReply(reply);
  });

export const notifyRestriction = (user: any, lifted = false) =>
  deliver(async () => {
    await createNotification({
      recipient: user._id,
      type: lifted ? 'COMMENT_RESTRICTION_LIFTED' : 'COMMENT_RESTRICTED',
      dedupeKey: `${lifted ? 'lifted' : 'restricted'}:${user.id}:${user.updatedAt?.getTime() || Date.now()}`,
      target: '/profile',
      data: lifted
        ? {}
        : {
            reason: user.commentRestrictionReason,
            restrictionExpiresAt: user.commentRestrictionExpiresAt,
          },
    });
  });

export const notifyNewReport = (report: IReport) =>
  deliver(async () => {
    const staff = await User.find({
      role: { $in: ['super_admin', 'admin', 'moderator'] },
      isBanned: { $ne: true },
      _id: { $ne: report.reporter },
    }).select('_id');
    await Promise.all(
      staff.map((user) =>
        createNotification({
          recipient: user._id as mongoose.Types.ObjectId,
          type: 'ADMIN_REPORT',
          dedupeKey: `new-report:${report.id}:${user.id}`,
          target: `/admin/reports?report=${report.id}`,
          data: { reportType: report.type },
        })
      )
    );
  });

export const notifyReportOutcome = (report: IReport) =>
  deliver(async () => {
    if (!['RESOLVED', 'REJECTED'].includes(report.status)) return;
    const source = report.context?.pagePath;
    await createNotification({
      recipient: report.reporter,
      type:
        report.status === 'RESOLVED' ? 'REPORT_RESOLVED' : 'REPORT_REJECTED',
      dedupeKey: `report-outcome:${report.id}:${report.status}`,
      target: isReportPath(source) ? source : '/profile',
      // Moderators' internal notes are intentionally not included in user notifications.
      data: { reportType: report.type },
    });
  });
