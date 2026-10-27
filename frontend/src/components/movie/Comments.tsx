import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Clapperboard, ChevronDown, MessageCircle, Send, SmilePlus, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useAuthStore } from '../../store/authStore';
import Dropdown from '../common/Dropdown';
import Pagination from '../common/Pagination';
import {
  useMovieComments,
  useCreateComment,
  useLikeComment,
  useDislikeComment,
  useCommentReplies,
} from '../../hooks/useComments';
import LoadingSpinner from '../common/LoadingSpinner';
import { Comment } from '../../services/commentService';
import { useTranslation } from 'react-i18next';
import ReportButton from '../common/ReportButton';

const insertEmoji = (
  value: string,
  setValue: (value: string) => void,
  textarea: React.RefObject<HTMLTextAreaElement>,
  emoji: string,
) => {
  const element = textarea.current;
  const start = element?.selectionStart ?? value.length;
  const end = element?.selectionEnd ?? value.length;
  setValue(`${value.slice(0, start)}${emoji}${value.slice(end)}`);
  requestAnimationFrame(() => {
    element?.focus();
    element?.setSelectionRange(start + emoji.length, start + emoji.length);
  });
};

const LazyEmojiPicker = lazy(() => import('emoji-picker-react'));

const EmojiPickerButton = ({ onSelect, t }: { onSelect: (emoji: string) => void; t: any }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={t('comments.openEmojiPicker')} title={t('comments.openEmojiPicker')}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
          <SmilePlus className="size-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-[min(352px,calc(100vw-2rem))] overflow-hidden p-0">
        <Suspense fallback={<div className="grid h-[420px] place-items-center text-sm text-muted-foreground">{t('common.loading', 'Loading...')}</div>}>
          {open && <LazyEmojiPicker theme="dark" emojiStyle="native" width="100%" height={420} searchPlaceholder={t('comments.searchEmoji')} onEmojiClick={item => { onSelect(item.emoji); setOpen(false); }} />}
        </Suspense>
      </PopoverContent>
    </Popover>
  );
};

interface CommentsProps {
  movieId: number;
}

// Format time ago - will use translation in component
const getTimeAgoValues = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return { key: 'justNow', count: 0 };
  if (seconds < 3600) {
    const count = Math.floor(seconds / 60);
    return { key: count === 1 ? 'oneMinuteAgo' : 'minutesAgo', count };
  }
  if (seconds < 86400) {
    const count = Math.floor(seconds / 3600);
    return { key: count === 1 ? 'oneHourAgo' : 'hoursAgo', count };
  }
  if (seconds < 2592000) {
    const count = Math.floor(seconds / 86400);
    return { key: count === 1 ? 'oneDayAgo' : 'daysAgo', count };
  }
  if (seconds < 31536000) {
    const count = Math.floor(seconds / 2592000);
    return { key: count === 1 ? 'oneMonthAgo' : 'monthsAgo', count };
  }
  const count = Math.floor(seconds / 31536000);
  return { key: count === 1 ? 'oneYearAgo' : 'yearsAgo', count };
};

// Reply Item Component
const ReplyItem = ({
  reply,
  onLike,
  onDislike,
  currentUserId,
  onReplySubmit,
  isFormActive,
  onFormToggle,
  t,
}: {
  reply: Comment;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  currentUserId?: string;
  onReplySubmit: (parentId: string, text: string) => void;
  isFormActive: boolean;
  onFormToggle: (replyId: string) => void;
  t: any;
}) => {
  const [replyText, setReplyText] = useState('');
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();

  // Set cursor position after textarea value changes
  useEffect(() => {
    if (isFormActive && textareaRef.current && replyText) {
      const length = replyText.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isFormActive, replyText]);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReplySubmit(reply.parentComment || reply._id, replyText.trim());
      setReplyText('');
      onFormToggle(reply._id); // Đóng form
    }
  };

  const timeAgo = getTimeAgoValues(reply.createdAt);
  const timeAgoText = timeAgo.key === 'justNow'
    ? t(`comments.${timeAgo.key}`)
    : t(`comments.${timeAgo.key}`, { count: timeAgo.count });

  return (
    <div className="flex gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-3 sm:p-4">
      {/* Reply Avatar */}
      <img
        src={
          reply.user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            reply.user.name
          )}&background=dc2626&color=fff`
        }
        alt={reply.user.name}
        className="size-10 rounded-full flex-shrink-0 object-cover ring-2 ring-white/10"
      />

      {/* Reply Content */}
      <div className="flex-1 min-w-0">
        {/* Reply Header */}
        <div className="flex items-center gap-2 mb-1">
          <h5 className="text-white font-semibold text-sm">{reply.user.name}</h5>
          {reply.isSpoiler && (
            <span className="inline-flex items-center rounded-full border border-orange-400/20 bg-orange-400/10 px-2 py-0.5 text-[11px] font-medium text-orange-200">
              <Sparkles className="mr-1 size-3" />{t('comments.spoiler', 'Spoiler')}
            </span>
          )}
          <span className="text-gray-500 text-xs">{timeAgoText}</span>
        </div>

        {/* Reply Text - with spoiler blur */}
        <div className="mb-2">
          <p className={`text-gray-300 text-sm leading-relaxed ${reply.isSpoiler && !spoilerRevealed ? 'blur-sm select-none' : ''}`}>
            {reply.text}
          </p>
          {reply.isSpoiler && (
            <button
              onClick={() => setSpoilerRevealed(!spoilerRevealed)}
              className="mt-1 text-orange-400 hover:text-orange-300 transition-colors text-xs"
            >
              {spoilerRevealed ? t('comments.hide', 'Hide') : t('comments.reveal', 'Show')}
            </button>
          )}
        </div>

        {/* Reply Actions */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => onLike(reply._id)}
            className={`flex items-center gap-1.5 transition-colors ${currentUserId && reply.likes.includes(currentUserId)
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <ThumbsUp className={`size-4 ${currentUserId && reply.likes.includes(currentUserId) ? 'fill-current' : ''}`} />
            {reply.likesCount > 0 && <span className="font-medium">{reply.likesCount}</span>}
          </button>

          <button
            onClick={() => onDislike(reply._id)}
            className={`flex items-center gap-1.5 transition-colors ${currentUserId && reply.dislikes.includes(currentUserId)
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <ThumbsDown className={`size-4 ${currentUserId && reply.dislikes.includes(currentUserId) ? 'fill-current' : ''}`} />
            {reply.dislikesCount > 0 && <span className="font-medium">{reply.dislikesCount}</span>}
          </button>

          <button
            onClick={() => {
              onFormToggle(reply._id);
              if (!isFormActive) {
                setReplyText(`@${reply.user.name} `);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-gray-400 transition hover:bg-white/[.06] hover:text-white"
          >
            {t('comments.reply')}
          </button>
          <ReportButton compact target={{ type: 'COMMENT', targetId: reply._id, authorId: reply.user._id,
            label: `${reply.user.name}: ${reply.text.slice(0, 160)}`, context: { movieId: reply.movie } }} />
        </div>

        {/* Reply Form */}
        {isFormActive && user && (
          <div className="mt-3">
            <form onSubmit={handleReplySubmit}>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20 focus-within:border-red-400/50 focus-within:ring-2 focus-within:ring-red-500/10">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('comments.writeComment')}
                  className="min-h-[72px] w-full resize-y bg-transparent p-3 text-sm leading-relaxed text-white placeholder:text-gray-500 focus:outline-none"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between gap-3 border-t border-white/[.06] bg-white/[.025] px-3 py-2">
                  <div className="flex items-center gap-2"><EmojiPickerButton onSelect={emoji => insertEmoji(replyText, setReplyText, textareaRef, emoji)} t={t} /><span className="text-xs tabular-nums text-gray-500">
                    {replyText.length} / 1000
                  </span></div>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
                  >
                    <span>{t('comments.submit')}</span>
                    <Send className="size-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Comment Item Component
const CommentItem = ({
  comment,
  onLike,
  onDislike,
  currentUserId,
  onReplySubmit,
  t,
}: {
  comment: Comment;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  currentUserId?: string;
  onReplySubmit: (parentId: string, text: string) => void;
  t: any;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [activeReplyFormId, setActiveReplyFormId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasLiked = currentUserId ? comment.likes.includes(currentUserId) : false;
  const hasDisliked = currentUserId ? comment.dislikes.includes(currentUserId) : false;
  const { user } = useAuthStore();

  // Load replies when showReplies is true
  const { data: repliesData } = useCommentReplies(showReplies ? comment._id : null);
  const replies = repliesData?.data || [];

  // Set cursor position after textarea value changes
  useEffect(() => {
    if (showReplyForm && textareaRef.current && replyText) {
      const length = replyText.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [showReplyForm, replyText]);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReplySubmit(comment._id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  const timeAgo = getTimeAgoValues(comment.createdAt);
  const timeAgoText = timeAgo.key === 'justNow'
    ? t(`comments.${timeAgo.key}`)
    : t(`comments.${timeAgo.key}`, { count: timeAgo.count });

  return (
    <article className="group rounded-2xl border border-white/[.07] bg-gradient-to-br from-[#191b21] to-[#131419] p-4 shadow-lg shadow-black/10 transition hover:border-white/[.12] sm:p-5">
      <div className="flex gap-3">
      {/* Avatar */}
      <img
        src={
          comment.user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            comment.user.name
          )}&background=dc2626&color=fff`
        }
        alt={comment.user.name}
        className="size-10 rounded-full flex-shrink-0 object-cover ring-2 ring-red-500/25 sm:size-11"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header: Name + Badge + Time */}
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="text-sm font-semibold text-white sm:text-base">{comment.user.name}</h4>
          {comment.isSpoiler && (
            <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-2 py-0.5 text-[11px] font-medium text-orange-200">
              {t('comments.spoiler', 'Spoiler')}
            </span>
          )}
          <span className="text-xs text-gray-500">{timeAgoText}</span>
        </div>

        {/* Comment Text - with spoiler blur */}
        <div className="mb-3 rounded-xl bg-black/15 px-3.5 py-3 sm:px-4">
          <p className={`whitespace-pre-wrap break-words text-sm leading-7 text-gray-200 sm:text-[15px] ${comment.isSpoiler && !spoilerRevealed ? 'blur-sm select-none' : ''}`}>
            {comment.text}
          </p>
          {comment.isSpoiler && (
            <button
              onClick={() => setSpoilerRevealed(!spoilerRevealed)}
              className="mt-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-200 transition hover:bg-orange-400/20"
            >
              {spoilerRevealed ? t('comments.hideSpoiler', 'Hide') : t('comments.revealSpoiler', 'Show')}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-2.5">
          <button
            onClick={() => onLike(comment._id)}
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/[.07] px-3 py-1.5 transition ${hasLiked ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'text-gray-400 hover:bg-white/[.06] hover:text-white'
              }`}
          >
            <ThumbsUp className={`size-3.5 ${hasLiked ? 'fill-current' : ''}`} />
            {comment.likesCount > 0 && <span className="font-medium">{comment.likesCount}</span>}
          </button>

          <button
            onClick={() => onDislike(comment._id)}
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/[.07] px-3 py-1.5 transition ${hasDisliked ? 'border-blue-400/30 bg-blue-400/10 text-blue-300' : 'text-gray-400 hover:bg-white/[.06] hover:text-white'
              }`}
          >
            <ThumbsDown className={`size-3.5 ${hasDisliked ? 'fill-current' : ''}`} />
            {comment.dislikesCount > 0 && <span className="font-medium">{comment.dislikesCount}</span>}
          </button>

          <button
            onClick={() => {
              setShowReplyForm(!showReplyForm);
              setActiveReplyFormId(null); // Đóng tất cả form của replies
              if (!showReplyForm) {
                setReplyText(`@${comment.user.name} `);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-gray-400 transition hover:bg-white/[.06] hover:text-white"
          >
            <MessageCircle className="size-3.5" />{t('comments.reply')}
          </button>
          <ReportButton compact target={{ type: 'COMMENT', targetId: comment._id, authorId: comment.user._id,
            label: `${comment.user.name}: ${comment.text.slice(0, 160)}`, context: { movieId: comment.movie } }} />
        </div>

        {/* Reply Form */}
        {showReplyForm && user && (
          <div className="mt-4">
            <form onSubmit={handleReplySubmit}>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20 focus-within:border-red-400/50 focus-within:ring-2 focus-within:ring-red-500/10">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('comments.writeComment')}
                  className="min-h-[82px] w-full resize-y bg-transparent p-3.5 text-sm leading-relaxed text-white placeholder:text-gray-500 focus:outline-none"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between gap-3 border-t border-white/[.06] bg-white/[.025] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <EmojiPickerButton onSelect={emoji => insertEmoji(replyText, setReplyText, textareaRef, emoji)} t={t} />
                    <span className="text-xs tabular-nums text-gray-500">
                      {replyText.length} / 1000
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
                  >
                    <span>{t('comments.submit')}</span>
                    <Send className="size-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Replies Section */}
        {comment.repliesCount > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[.07] px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-400/10 hover:text-red-200"
            >
              <ChevronDown className={`size-3.5 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
              {comment.repliesCount === 1
                ? t('comments.oneReply')
                : t('comments.replies', { count: comment.repliesCount })}
            </button>

            {/* Display Replies */}
            {showReplies && replies.length > 0 && (
              <div className="mt-3 space-y-3 border-l border-white/10 pl-3 sm:pl-4">
                {replies.map((reply) => (
                  <ReplyItem
                    key={reply._id}
                    reply={reply}
                    onLike={onLike}
                    onDislike={onDislike}
                    currentUserId={currentUserId}
                    onReplySubmit={onReplySubmit}
                    isFormActive={activeReplyFormId === reply._id}
                    onFormToggle={(replyId: string) => {
                      if (activeReplyFormId === replyId) {
                        setActiveReplyFormId(null);
                      } else {
                        setActiveReplyFormId(replyId);
                        setShowReplyForm(false); // Đóng form của comment cha
                      }
                    }}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </article>
  );
};

const Comments = ({ movieId }: CommentsProps) => {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'recent' | 'popular' | 'oldest'>('recent');

  const { user } = useAuthStore();

  // Queries & Mutations
  const { data, isLoading, error } = useMovieComments(movieId, page, 10, sort);
  const createCommentMutation = useCreateComment(movieId);
  const likeMutation = useLikeComment();
  const dislikeMutation = useDislikeComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    createCommentMutation.mutate(
      {
        movie: movieId,
        text: commentText.trim(),
      },
      {
        onSuccess: () => {
          setCommentText('');
        },
      }
    );
  };

  const handleLike = (commentId: string) => {
    if (!user) return;
    likeMutation.mutate(commentId);
  };

  const handleDislike = (commentId: string) => {
    if (!user) return;
    dislikeMutation.mutate(commentId);
  };

  const handleReplySubmit = (parentId: string, text: string) => {
    if (!user) return;
    createCommentMutation.mutate({
      movie: movieId,
      text,
      parentComment: parentId,
    });
  };

  const handlePageChange = (newPage: number) => {
    // Scroll to comments section or top
    const commentsSection = document.querySelector('.space-y-6');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setPage(newPage);
  };

  const comments = data?.data?.comments || [];
  const pagination = data?.data?.pagination;

  // Prepare sort options
  const sortOptions = [
    { value: 'recent', label: t('comments.newest') },
    { value: 'popular', label: t('comments.topRated') },
    { value: 'oldest', label: t('comments.oldest') },
  ];

  return (
    <section className="space-y-5 sm:space-y-6" aria-label={t('comments.title', 'Comments')}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.08] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-red-500/10 text-red-300"><MessageCircle className="size-[18px]" /></span>
          <h3 className="text-lg font-bold text-white sm:text-xl">
            {t('comments.commentCount', { count: pagination?.total || 0 })}
          </h3>
        </div>

        {/* Sort Options */}
        <div className="w-40 rounded-xl border border-white/10 bg-white/[.04] p-1">
          <Dropdown
            value={sort}
            onChange={(value) => setSort(value as any)}
            options={sortOptions}
          />
        </div>
      </div>

      {/* Comment Input */}
      <div className="mb-1">
        {!user ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/[.08] bg-gradient-to-r from-[#191b21] to-[#15161b] p-4 sm:p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[.06] text-gray-400"><MessageCircle className="size-5" /></span>
            <p className="flex-1 text-sm leading-relaxed text-gray-400">
              <Link to="/login" className="font-semibold text-red-300 transition hover:text-red-200">
                {t('header.signIn')}
              </Link>{' '}
              {t('comments.signInToComment')}
            </p>
            <Sparkles className="hidden size-5 text-amber-300/80 sm:block" />
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-white/[.08] bg-gradient-to-br from-[#191b21] to-[#14151a] p-3.5 shadow-lg shadow-black/10 sm:gap-4 sm:p-5">
            {/* Avatar */}
            <img
              src={
                user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name
                )}&background=dc2626&color=fff`
              }
              alt={user.name}
              className="size-10 shrink-0 rounded-full object-cover ring-2 ring-red-500/25 sm:size-11"
            />

            {/* Form */}
            <form onSubmit={handleSubmit} className="min-w-0 flex-1">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20 transition focus-within:border-red-400/50 focus-within:ring-2 focus-within:ring-red-500/10">
                <div className="flex items-center justify-end px-3.5 pt-3 sm:px-4">
                  <span className="text-[11px] text-gray-600">{t('comments.emojiHint')}</span>
                </div>
                <textarea
                  ref={composerRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t('comments.writeComment')}
                  className="min-h-[100px] w-full resize-y bg-transparent px-3.5 py-3 text-sm leading-relaxed text-white placeholder:text-gray-500 focus:outline-none sm:px-4"
                  maxLength={1000}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[.06] bg-white/[.025] px-2.5 py-2 sm:px-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <EmojiPickerButton onSelect={emoji => insertEmoji(commentText, setCommentText, composerRef, emoji)} t={t} />
                    <span className={`text-xs tabular-nums ${commentText.length > 900 ? 'text-amber-300' : 'text-gray-500'}`}>
                      {commentText.length} / 1000
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:-translate-y-0.5 hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none"
                  >
                    <span>{createCommentMutation.isPending ? t('comments.submitting') : t('comments.submit')}</span>
                    <Send className="size-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Comments List */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-center">
          <p className="text-red-500">
            {t('comments.loadError')}
          </p>
        </div>
      )}

      {!isLoading && !error && comments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] px-4 py-10 text-center sm:py-12">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-white/[.05] text-gray-400"><Clapperboard className="size-6" /></span>
          <p className="font-medium text-gray-200">{t('comments.noComments')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('comments.beFirstToComment')}</p>
        </div>
      )}

      {!isLoading && !error && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onLike={handleLike}
              onDislike={handleDislike}
              onReplySubmit={handleReplySubmit}
              currentUserId={user?._id}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  );
};

export default Comments;

