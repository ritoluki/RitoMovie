import { useState } from 'react';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  rating?: number;
  likes: number;
  isVerified?: boolean;
}

interface CommentsProps {
  movieId: number;
}

// Mock comments data
const mockComments: Comment[] = [
  {
    id: '1',
    user: {
      name: 'nhtanf',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    text: 'Thiết sự đẹn doạn Ah Jin sống trong hạnh phúc 1 năm đỗ tói ko dám xem tiếp các đông phim a',
    timestamp: '26 phút trước',
    likes: 0,
    isVerified: true,
  },
  {
    id: '2',
    user: {
      name: 'tỉu bíu',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    text: 'ở chỗ ai có 1 , thảu sử đối mà sẽm hầu đủ nhất của lần huấn',
    timestamp: '1 giờ trước',
    rating: 10,
    likes: 4,
  },
  {
    id: '3',
    user: {
      name: 'nhâu nhâu',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    text: 'Phim hay quá, diễn xuất tuyệt vời. Mong có thêm nhiều phim hay như thế này!',
    timestamp: '2 giờ trước',
    rating: 9,
    likes: 12,
  },
];

const Comments = ({ movieId }: CommentsProps) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'ratings'>('comments');
  const [commentText, setCommentText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement comment submission
    console.log('Submit comment:', { movieId, commentText, isSpoiler });
    setCommentText('');
    setIsSpoiler(false);
  };

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-bold text-white">
          Bình luận ({mockComments.length})
        </h3>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'comments'
                ? 'bg-white text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            Bình luận
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ratings'
                ? 'bg-white text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            Đánh giá
          </button>
        </div>
      </div>

      {/* Comment Input */}
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-400 text-sm mb-3">
          Vui lòng <span className="text-red-600 font-semibold">đăng nhập</span> để tham gia bình luận.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Viết bình luận"
            className="w-full bg-gray-900 text-white rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[100px]"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
              </label>
              <span className="text-xs text-gray-500">
                {commentText.length} / 1000
              </span>
            </div>
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-8 py-2 rounded-lg transition-colors"
            >
              Gửi
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {mockComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-gray-800 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <img
                src={comment.user.avatar}
                alt={comment.user.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-semibold text-sm">
                    {comment.user.name}
                  </h4>
                  {comment.isVerified && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-400 rounded-full text-gray-900 text-xs">
                      ∞
                    </span>
                  )}
                  {comment.rating && (
                    <span className="text-xs text-gray-400 ml-2">
                      P {comment.rating} - Tập 7
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-2">{comment.timestamp}</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {comment.text}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <button className="flex items-center gap-1 hover:text-white transition-colors">
                    <span>👍</span>
                    <span>{comment.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-white transition-colors">
                    <span>👎</span>
                  </button>
                  <button className="hover:text-white transition-colors">
                    Trả lời
                  </button>
                  <button className="hover:text-white transition-colors">
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;

