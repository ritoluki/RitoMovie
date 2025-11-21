import { IoPlay } from 'react-icons/io5';
import Logo from '@/components/common/Logo';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner = ({ fullScreen = false, size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className={`${sizeClasses[size]} border-primary-600 border-t-transparent rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060b] text-center px-6 animate-fade-in">
        <div className="flex flex-col items-center space-y-8 animate-slide-up">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative flex flex-col items-center space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 blur-[60px] bg-red-500/30" />
                <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full bg-[#080c18] border border-red-500/50 shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex items-center justify-center">
                  <div className="absolute inset-3 rounded-full border border-white/10" />
                  <div className="relative w-16 h-16 rounded-full bg-white text-red-600 flex items-center justify-center shadow-lg">
                    <IoPlay className="translate-x-0.5" size={28} />
                  </div>
                </div>
              </div>
              <Logo size="lg" animated={false} />
            </div>

            <p className="text-gray-300 text-base md:text-xl font-medium tracking-wide max-w-2xl">
              Xem phim miễn phí nhanh chóng, chất lượng cao và cập nhật liên tục
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 text-sm">
            <div className="flex items-center space-x-3 text-red-400 font-semibold tracking-[0.4em] uppercase">
              <div className="w-8 h-8 border-4 border-red-500/60 border-t-transparent rounded-full animate-spin" />
              <span className="tracking-normal text-gray-400 uppercase">Đang tải</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
};

export default LoadingSpinner;

