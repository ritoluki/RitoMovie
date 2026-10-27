import mongoose, { Schema } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'COMMENT_REPLY',
  'COMMENT_RESTRICTED',
  'COMMENT_RESTRICTION_LIFTED',
  'REPORT_RESOLVED',
  'REPORT_REJECTED',
  'ADMIN_REPORT',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export interface INotification {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  dedupeKey: string;
  target: string;
  data: {
    actorName?: string;
    preview?: string;
    reason?: string;
    restrictionExpiresAt?: Date;
    reportType?: string;
  };
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    dedupeKey: { type: String, required: true, unique: true },
    target: { type: String, required: true, maxlength: 600 },
    data: {
      actorName: { type: String, maxlength: 100 },
      preview: { type: String, maxlength: 200 },
      reason: { type: String, maxlength: 300 },
      restrictionExpiresAt: Date,
      reportType: String,
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);
schema.index({ recipient: 1, createdAt: -1, _id: -1 });
schema.index({ recipient: 1, readAt: 1 });
export default mongoose.model<INotification>('Notification', schema);
