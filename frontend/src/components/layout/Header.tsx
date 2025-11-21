import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiMenu, FiX, FiLogOut, FiList, FiSettings } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { LogoLink } from '@/components/common/Logo';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // Increased threshold for better transition
    };

    // Set initial state
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { name: t('header.home'), path: '/' },
    { name: t('header.movies'), path: '/browse' },
    { name: t('header.myList'), path: '/my-list' },
  ];

  return (
    <>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.button
            key="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Close menu overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-gray-900/70 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen
          ? 'bg-gray-900/95 backdrop-blur-md shadow-lg'
          : 'bg-gradient-to-b from-gray-900/80 to-transparent'
          }`}
      >
        <div className="container mx-auto px-2 md:px-1">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <LogoLink to="/" size="md" animated={true} />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Search */}
              <div className="relative w-10 h-10">
                <AnimatePresence mode="wait">
                  {isSearchOpen ? (
                    <motion.form
                      key="search-form"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleSearch}
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center overflow-hidden"
                    >
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('header.searchPlaceholder')}
                        className="w-48 md:w-64 px-4 py-2 pr-12 bg-gray-800 text-white rounded-full border border-gray-600 focus:outline-none focus:border-gray-500 placeholder:text-gray-400"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="absolute right-2 p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                      >
                        <FiX size={18} />
                      </button>
                    </motion.form>
                  ) : (
                    <motion.button
                      key="search-button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSearchOpen(true)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-white transition-colors duration-200"
                      aria-label="Search"
                    >
                      <FiSearch size={22} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FiUser size={18} />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-700">
                          <p className="text-white font-medium whitespace-nowrap">{user?.name}</p>
                          <p className="text-gray-400 text-sm whitespace-nowrap">{user?.email}</p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          <FiSettings size={18} />
                          <span>{t('header.profile')}</span>
                        </Link>

                        <Link
                          to="/my-list"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          <FiList size={18} />
                          <span>{t('header.myList')}</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          <FiLogOut size={18} />
                          <span>{t('header.logout')}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:block btn-primary text-sm"
                >
                  {t('header.signIn')}
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden py-4 border-t border-gray-800"
              >
                <nav className="flex flex-col space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                    >
                      {link.name}
                    </Link>
                  ))}
                  {!isAuthenticated && (
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-primary-600 hover:text-primary-500 transition-colors duration-200 font-medium"
                    >
                      {t('header.signIn')}
                    </Link>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
};

export default Header;

