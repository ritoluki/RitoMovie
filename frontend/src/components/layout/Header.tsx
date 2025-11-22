import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiMenu, FiX, FiLogOut, FiList, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { LogoLink } from '@/components/common/Logo';
import { movieService } from '@/services/movieService';
import { Genre } from '@/types';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const genreMenuRef = useRef<HTMLDivElement>(null);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch genres from API
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await movieService.getGenres();
        setGenres(data.genres);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };
    fetchGenres();
  }, []);

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
      if (genreMenuRef.current && !genreMenuRef.current.contains(event.target as Node) &&
        countryMenuRef.current && !countryMenuRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (isUserMenuOpen || activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, activeDropdown]);

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
  ];

  // Popular countries based on TMDB production_countries
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'KR', name: 'South Korea' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TH', name: 'Thailand' },
    { code: 'IN', name: 'India' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'MX', name: 'Mexico' },
    { code: 'BR', name: 'Brazil' },
    { code: 'AR', name: 'Argentina' },
    { code: 'RU', name: 'Russia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'PL', name: 'Poland' },
    { code: 'IE', name: 'Ireland' },
    { code: 'PH', name: 'Philippines' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'VN', name: 'Vietnam' },
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
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between gap-3 h-16 md:h-20 relative">
            {/* Left Side: Logo + Search */}
            <div className="flex items-center gap-5">
              {/* Logo */}
              <LogoLink to="/" size="md" animated={true} />

              {/* Desktop Search - Always visible next to logo */}
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center relative"
              >
                <div className="relative">
                  <FiSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('header.searchPlaceholder')}
                    className="w-72 pl-10 pr-4 py-2 bg-gray-700/50 text-white rounded-md border border-gray-600/50 focus:outline-none focus:border-gray-500 focus:bg-gray-700 placeholder:text-gray-400 transition-all text-sm"
                  />
                </div>
              </form>
            </div>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex items-center gap-6 absolute"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-white hover:text-gray-200 transition-colors duration-200 font-medium text-sm"
                >
                  {link.name}
                </Link>
              ))}

              {/* Thể loại Dropdown */}
              <div className="relative" ref={genreMenuRef}>
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'genre' ? null : 'genre')}
                  className="flex items-center gap-1 text-white hover:text-gray-200 transition-colors duration-200 font-medium text-sm"
                >
                  {t('header.genres')}
                  <FiChevronDown className={`transition-transform duration-200 ${activeDropdown === 'genre' ? 'rotate-180' : ''}`} size={14} />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'genre' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-[600px] bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl py-4 px-6 z-50 border border-gray-800"
                    >
                      <div className="grid grid-cols-4 gap-x-6 gap-y-2">
                        {genres.map((genre) => (
                          <Link
                            key={genre.id}
                            to={`/browse?genre=${genre.id}`}
                            onClick={() => setActiveDropdown(null)}
                            className="text-gray-300 hover:text-white transition-colors duration-200 text-sm py-1"
                          >
                            {genre.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quốc gia Dropdown */}
              <div className="relative" ref={countryMenuRef}>
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'country' ? null : 'country')}
                  className="flex items-center gap-1 text-white hover:text-gray-200 transition-colors duration-200 font-medium text-sm"
                >
                  {t('header.countries')}
                  <FiChevronDown className={`transition-transform duration-200 ${activeDropdown === 'country' ? 'rotate-180' : ''}`} size={14} />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'country' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-[600px] bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl py-4 px-6 z-50 border border-gray-800"
                    >
                      <div className="grid grid-cols-4 gap-x-6 gap-y-2">
                        {countries.map((country) => (
                          <Link
                            key={country.code}
                            to={`/browse?country=${country.code}`}
                            onClick={() => setActiveDropdown(null)}
                            className="text-gray-300 hover:text-white transition-colors duration-200 text-sm py-1"
                          >
                            {country.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Xem Chung Link temporarily hidden */}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Mobile Search - Icon button */}
              <div className="md:hidden relative w-10 h-10">
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
                        className="w-48 px-4 py-2 pr-12 bg-gray-800 text-white rounded-full border border-gray-600 focus:outline-none focus:border-gray-500 placeholder:text-gray-400"
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

