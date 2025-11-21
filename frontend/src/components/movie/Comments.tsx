import { useState, useRef, useEffect } from 'react';
import { AiOutlineLike, AiFillLike, AiOutlineDislike, AiFillDislike } from 'react-icons/ai';
import { useAuthStore } from '../../store/authStore';
import Dropdown from '../common/Dropdown';
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
    <div className="flex gap-3">
      {/* Reply Avatar */}
      <img
        src={
          reply.user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            reply.user.name
          )}&background=dc2626&color=fff`
        }
        alt={reply.user.name}
        className="w-10 h-10 rounded-full flex-shrink-0"
      />

      {/* Reply Content */}
      <div className="flex-1 min-w-0">
        {/* Reply Header */}
        <div className="flex items-center gap-2 mb-1">
          <h5 className="text-white font-semibold text-sm">{reply.user.name}</h5>
          <span className="text-gray-500 text-xs">{timeAgoText}</span>
        </div>

        {/* Reply Text */}
        <p className="text-gray-300 text-sm leading-relaxed mb-2">{reply.text}</p>

        {/* Reply Actions */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => onLike(reply._id)}
            className={`flex items-center gap-1.5 transition-colors ${currentUserId && reply.likes.includes(currentUserId)
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            {currentUserId && reply.likes.includes(currentUserId) ? (
              <AiFillLike className="text-base" />
            ) : (
              <AiOutlineLike className="text-base" />
            )}
            {reply.likesCount > 0 && <span className="font-medium">{reply.likesCount}</span>}
          </button>

          <button
            onClick={() => onDislike(reply._id)}
            className={`flex items-center gap-1.5 transition-colors ${currentUserId && reply.dislikes.includes(currentUserId)
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            {currentUserId && reply.dislikes.includes(currentUserId) ? (
              <AiFillDislike className="text-base" />
            ) : (
              <AiOutlineDislike className="text-base" />
            )}
            {reply.dislikesCount > 0 && <span className="font-medium">{reply.dislikesCount}</span>}
          </button>

          <button
            onClick={() => {
              onFormToggle(reply._id);
              if (!isFormActive) {
                setReplyText(`@${reply.user.name} `);
              }
            }}
            className="text-gray-400 hover:text-white transition-colors font-medium"
          >
            {t('comments.reply')}
          </button>
        </div>

        {/* Reply Form */}
        {isFormActive && user && (
          <div className="mt-3">
            <form onSubmit={handleReplySubmit}>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('comments.writeComment')}
                  className="w-full bg-transparent text-white p-3 resize-none focus:outline-none min-h-[60px] placeholder-gray-500 text-sm"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800/80 border-t border-gray-700">
                  <span className="text-xs text-gray-500">
                    {replyText.length} / 1000
                  </span>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold px-4 py-1.5 rounded transition-colors flex items-center gap-2 text-sm"
                  >
                    <span>{t('comments.submit')}</span>
                    <span>▶</span>
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
    <div className="flex gap-3 py-4">
      {/* Avatar */}
      <img
        src={
          comment.user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            comment.user.name
          )}&background=dc2626&color=fff`
        }
        alt={comment.user.name}
        className="w-12 h-12 rounded-full flex-shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Name + Badge + Time */}
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-white font-semibold text-base">{comment.user.name}</h4>
          {comment.rating && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 rounded-full text-gray-900 text-xs font-bold">
              ∞
            </span>
          )}
          <span className="text-gray-500 text-sm">{timeAgoText}</span>
        </div>

        {/* Comment Text */}
        <p className="text-gray-300 text-base leading-relaxed mb-3">{comment.text}</p>

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => onLike(comment._id)}
            className={`flex items-center gap-1.5 transition-colors ${hasLiked ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            {hasLiked ? (
              <AiFillLike className="text-lg" />
            ) : (
              <AiOutlineLike className="text-lg" />
            )}
            {comment.likesCount > 0 && <span className="font-medium">{comment.likesCount}</span>}
          </button>

          <button
            onClick={() => onDislike(comment._id)}
            className={`flex items-center gap-1.5 transition-colors ${hasDisliked ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            {hasDisliked ? (
              <AiFillDislike className="text-lg" />
            ) : (
              <AiOutlineDislike className="text-lg" />
            )}
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
            className="text-gray-400 hover:text-white transition-colors font-medium"
          >
            {t('comments.reply')}
          </button>
        </div>

        {/* Reply Form */}
        {showReplyForm && user && (
          <div className="mt-4">
            <form onSubmit={handleReplySubmit}>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('comments.writeComment')}
                  className="w-full bg-transparent text-white p-4 resize-none focus:outline-none min-h-[80px] placeholder-gray-500"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-t border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {replyText.length} / 1000
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold px-6 py-2 rounded transition-colors flex items-center gap-2"
                  >
                    <span>{t('comments.submit')}</span>
                    <span>▶</span>
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
              className="flex items-center gap-2 text-yellow-500 text-sm font-medium hover:text-yellow-400 transition-colors"
            >
              <span className={`transform transition-transform ${showReplies ? 'rotate-90' : ''}`}>
                ▶
              </span>
              {comment.repliesCount === 1
                ? t('comments.oneReply')
                : t('comments.replies', { count: comment.repliesCount })}
            </button>

            {/* Display Replies */}
            {showReplies && replies.length > 0 && (
              <div className="mt-4 space-y-4">
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
  );
};

const Comments = ({ movieId }: CommentsProps) => {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
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

  const comments = data?.data?.comments || [];
  const pagination = data?.data?.pagination;

  // Prepare sort options
  const sortOptions = [
    { value: 'recent', label: t('comments.newest') },
    { value: 'popular', label: t('comments.topRated') },
    { value: 'oldest', label: t('comments.oldest') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">
          {t('comments.commentCount', { count: pagination?.total || 0 })}
        </h3>

        {/* Sort Options */}
        <div className="w-40">
          <Dropdown
            value={sort}
            onChange={(value) => setSort(value as any)}
            options={sortOptions}
          />
        </div>
      </div>

      {/* Comment Input */}
      <div className="mb-6">
        {!user ? (
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0" />
            <div className="flex-1">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  {t('common.signIn')}{' '}
                  <a href="/login" className="text-yellow-500 font-semibold hover:text-yellow-400">
                    {t('header.signIn')}
                  </a>{' '}
                  {t('comments.signInToComment')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            {/* Avatar */}
            <img
              src={
                user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name
                )}&background=dc2626&color=fff`
              }
              alt={user.name}
              className="w-12 h-12 rounded-full flex-shrink-0"
            />

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t('comments.writeComment')}
                  className="w-full bg-transparent text-white p-4 resize-none focus:outline-none min-h-[100px] placeholder-gray-500"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-t border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {commentText.length} / 1000
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold px-6 py-2 rounded transition-colors flex items-center gap-2"
                  >
                    <span>{createCommentMutation.isPending ? t('comments.submitting') : t('comments.submit')}</span>
                    <span>▶</span>
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
        <div className="py-12 text-center">
          <p className="text-gray-400">
            {t('comments.noComments')}. {t('comments.beFirstToComment')}
          </p>
        </div>
      )}

      {!isLoading && !error && comments.length > 0 && (
        <div>
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
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.previous', 'Trước')}
          </button>
          <span className="px-4 py-2 text-gray-300">
            {t('common.page', 'Trang')} {page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.pages}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next', 'Sau')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Comments;

