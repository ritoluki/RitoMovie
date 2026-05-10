import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiFacebook, FiInstagram, FiCode, FiBookOpen } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { LogoLink } from '@/components/common/Logo';
import { useSettingsStore } from '@/store/settingsStore';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  const { settings } = useSettingsStore();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: FiGithub,
      url: settings.social_github_url || '#',
      show: !!settings.social_github_url && settings.social_github_url !== '#',
    },
    {
      name: 'Facebook',
      icon: FiFacebook,
      url: settings.social_facebook_url || '#',
      show: !!settings.social_facebook_url && settings.social_facebook_url !== '#',
    },
    {
      name: 'Twitter',
      icon: FiTwitter,
      url: settings.social_twitter_url || '#',
      show: !!settings.social_twitter_url && settings.social_twitter_url !== '#',
    },
    {
      name: 'Instagram',
      icon: FiInstagram,
      url: settings.social_instagram_url || '#',
      show: !!settings.social_instagram_url && settings.social_instagram_url !== '#',
    },
  ].filter((s) => s.show);

  const supportLinks = [
    { name: t('footer.helpCenter'), path: '/help' },
    { name: t('footer.termsOfService'), path: '/terms' },
    { name: t('footer.privacyPolicy'), path: '/privacy' },
  ];

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-12">

        {/* Vietnam flag message — mobile */}
        {settings.show_vietnam_flag_message && (
          <div className="mb-6 md:hidden flex justify-center">
            <span className="flex items-center gap-2 bg-red-700/80 text-white px-4 py-2 rounded-full text-sm font-medium">
              🇻🇳 {t('footer.saMessage')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <LogoLink to="/" size="md" animated={false} />
            <p className="text-gray-400 text-sm leading-relaxed">
              {settings.footer_text || t('footer.tagline')}
            </p>

            {/* Non-commercial badge */}
            <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">
              <FiBookOpen size={14} className="text-yellow-400 flex-shrink-0" />
              <span className="text-xs text-gray-300">{t('footer.nonCommercialBadge')}</span>
            </div>

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-4 pt-1">
                {socialLinks.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                      aria-label={s.name}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* About Project */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">{t('footer.aboutProject')}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer.projectDescription')}
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <FiCode size={14} className="text-red-400 flex-shrink-0" />
                React · TypeScript · Node.js · MongoDB
              </li>
              {settings.social_github_url && settings.social_github_url !== '#' && (
                <li>
                  <a
                    href={settings.social_github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <FiGithub size={14} />
                    {t('footer.viewSourceCode')}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Support + Newsletter */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">{t('footer.support')}</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {settings.enable_newsletter && (
              <div className="pt-2">
                <h3 className="text-white font-semibold mb-3">{t('footer.stayUpdated')}</h3>
                <p className="text-gray-400 text-sm mb-3">{t('footer.newsletterText')}</p>
                <form className="flex">
                  <input
                    type="email"
                    placeholder={t('footer.emailPlaceholder')}
                    className="flex-1 px-3 py-2 bg-gray-800 text-white text-sm rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-r-lg transition-colors"
                  >
                    {t('footer.subscribe')}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-500">
            <p>
              {settings.footer_copyright || `© ${currentYear} RitoMovie. ${t('footer.allRightsReserved')}`}
            </p>

            {/* Vietnam message — desktop */}
            {settings.show_vietnam_flag_message && (
              <span className="hidden md:flex items-center gap-2 bg-red-700/80 text-white px-4 py-1.5 rounded-full text-xs font-medium">
                🇻🇳 {t('footer.saMessage')}
              </span>
            )}

            <p className="text-center md:text-right">
              <span className="text-gray-600">{t('footer.nonCommercialDisclaimer')} · </span>
              {settings.footer_built_with_text || t('footer.builtWith')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
