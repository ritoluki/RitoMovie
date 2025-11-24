import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiFacebook, FiInstagram } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { LogoLink } from '@/components/common/Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  const footerLinks = {
    company: [
      { name: t('footer.aboutUs'), path: '/about' },
      { name: t('footer.contact'), path: '/contact' },
      { name: t('footer.careers'), path: '/careers' },
    ],
    support: [
      { name: t('footer.helpCenter'), path: '/help' },
      { name: t('footer.termsOfService'), path: '/terms' },
      { name: t('footer.privacyPolicy'), path: '/privacy' },
    ],
    social: [
      { name: 'Facebook', icon: FiFacebook, url: '#' },
      { name: 'Twitter', icon: FiTwitter, url: '#' },
      { name: 'Instagram', icon: FiInstagram, url: '#' },
      { name: 'GitHub', icon: FiGithub, url: '#' },
    ],
  };

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Hoàng Sa & Trường Sa message for mobile */}
        <div className="mb-6 md:hidden flex justify-center">
          <span className="flex items-center bg-red-800 text-white px-4 py-2 rounded-full text-sm font-medium">
            <img src="https://www.rophim.li/images/vn_flag.svg" alt="Vietnam flag" className="w-5 h-5 mr-2" />
            {t('footer.saMessage')}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <LogoLink to="/" size="md" animated={false} className="mb-4" />
            <p className="text-gray-400 text-sm mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              {footerLinks.social.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.company')}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
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
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
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
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.stayUpdated')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('footer.newsletterText')}
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                className="flex-1 px-4 py-2 bg-gray-800 text-white text-sm rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-r-lg transition-colors duration-200"
              >
                {t('footer.subscribe')}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} RitoMovie. {t('footer.allRightsReserved')}
            </p>
            {/* Desktop only message */}
            <div className="hidden md:flex items-center mx-4">
              <span className="flex items-center bg-red-800 text-white px-4 py-2 rounded-full text-sm font-medium">
                <img src="https://www.rophim.li/images/vn_flag.svg" alt="Vietnam flag" className="w-5 h-5 mr-2" />
                {t('footer.saMessage')}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              {t('footer.builtWith')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

