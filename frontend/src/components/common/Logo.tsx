import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

const Logo = ({ size = 'md', showIcon = true, animated = true, className = '' }: LogoProps) => {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const siteName = settings.site_name || 'RitoMovie';

  // Split site name for gradient effect (e.g., "RitoMovie" -> "Rito" + "Movie")
  const midPoint = Math.ceil(siteName.length / 2);
  const firstHalf = siteName.slice(0, midPoint);
  const secondHalf = siteName.slice(midPoint);

  const sizeClasses = {
    sm: 'text-xl md:text-2xl',
    md: 'text-2xl md:text-3xl',
    lg: 'text-3xl md:text-4xl',
  };

  const LogoContent = (
    <div className={`flex flex-col group ${className}`}>
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} font-bold font-display relative`}
          whileHover={animated ? { scale: 1.05 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {/* Glow effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-400 to-white bg-clip-text text-transparent blur-sm opacity-50">
            {siteName}
          </span>

          {/* Main text with gradient */}
          <span className="relative bg-gradient-to-r from-red-600 via-red-400 to-white bg-clip-text text-transparent group-hover:from-red-500 group-hover:via-red-300 group-hover:to-gray-100 transition-all duration-300">
            {firstHalf}
          </span>
          <span className="relative bg-gradient-to-r from-white via-red-300 to-red-600 bg-clip-text text-transparent group-hover:from-gray-100 group-hover:via-red-200 group-hover:to-red-500 transition-all duration-300">
            {secondHalf}
          </span>
        </motion.div>

        {/* Animated underline */}
        <motion.div
          className="h-0.5 bg-gradient-to-r from-red-600 via-red-400 to-white rounded-full"
          initial={{ width: 0 }}
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <span className="mt-0 text-[10px] uppercase tracking-[0.2em] text-gray-300">
        {t('header.tagline')}
      </span>
    </div>
  );

  return LogoContent;
};

interface LogoLinkProps extends LogoProps {
  to?: string;
  className?: string;
}

export const LogoLink = ({ to = '/', className = '', ...props }: LogoLinkProps) => {
  return (
    <Link to={to} className={`inline-block ${className}`}>
      <Logo {...props} />
    </Link>
  );
};

export default Logo;

