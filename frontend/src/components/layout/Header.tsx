import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  UserRound,
  Menu,
  LogOut,
  ListVideo,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { usePhim } from '@/hooks/usePhim';
import { LogoLink } from '@/components/common/Logo';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import NotificationBell from '@/components/common/NotificationBell';
import TaxonomyMenu from './TaxonomyMenu';
import { getTranslatedGenre, getTranslatedCountry } from '@/utils/translations';
import { cn } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { useGenres, useCountries } = usePhim();
  const { data: genreData = [], isLoading: genresLoading } = useGenres();
  const { data: countryData = [], isLoading: countriesLoading } =
    useCountries();
  const genres = genreData.map((item) => ({
    ...item,
    name: getTranslatedGenre(item.name, i18n.language),
  }));
  const countries = countryData.map((item) => ({
    ...item,
    name: getTranslatedCountry(item.name, i18n.language),
  }));
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const navLinks = [
    { name: t('header.home'), path: '/' },
    { name: t('header.singleMovies'), path: '/browse?catalog=phim-le' },
    { name: t('header.seriesMovies'), path: '/browse?catalog=phim-bo' },
    { name: t('header.hoatHinh'), path: '/browse?catalog=hoat-hinh' },
    { name: t('header.phimChieuRap'), path: '/browse?catalog=phim-chieu-rap' },
  ];
  const accountLinks = [
    { name: t('header.myList'), path: '/my-list', icon: ListVideo },
    { name: t('header.profile'), path: '/profile', icon: UserRound },
    ...(user &&
    ['super_admin', 'admin', 'moderator', 'analyst'].includes(user.role)
      ? [
          {
            name: t('header.adminDashboard'),
            path: '/admin',
            icon: ShieldCheck,
          },
        ]
      : []),
  ];
  const search = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
      setQuery('');
    }
  };
  const signOut = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };
  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200',
          scrolled
            ? 'border-border/70 bg-background/95 backdrop-blur-xl'
            : 'border-transparent bg-gradient-to-b from-background/95 to-background/50'
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between gap-3 px-4 md:h-20 lg:px-8">
          <div className="shrink-0">
            <LogoLink to="/" size="md" animated={false} />
          </div>
          <nav
            aria-label={t('common.mainNavigation')}
            className="hidden items-center gap-0.5 xl:flex"
          >
            {navLinks.map((link) => (
              <Button
                key={link.path}
                asChild
                variant="ghost"
                className={cn(
                  'h-10 px-2.5',
                  `${location.pathname}${location.search}` === link.path &&
                    'text-white bg-accent'
                )}
              >
                <Link to={link.path}>{link.name}</Link>
              </Button>
            ))}
            <TaxonomyMenu
              title={t('header.genres')}
              items={genres}
              param="phimGenre"
              loading={genresLoading}
            />
            <TaxonomyMenu
              title={t('header.countries')}
              items={countries}
              param="phimCountry"
              loading={countriesLoading}
            />
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('common.search')}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-4">
                <form onSubmit={search} className="space-y-3">
                  <label
                    htmlFor="header-search"
                    className="text-sm font-medium"
                  >
                    {t('common.search')}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="header-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t('header.searchPlaceholder')}
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      aria-label={t('common.search')}
                      className="h-11 w-11"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('header.searchHint')}
                  </p>
                </form>
              </PopoverContent>
            </Popover>
            <LanguageSwitcher />
            <NotificationBell />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 gap-2 px-1.5"
                    aria-label={t('header.profile')}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-foreground">
                      {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                    </span>
                    <ChevronDown className="hidden h-3 w-3 sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {user?.name}
                    </span>
                    <span className="mt-1 block truncate text-xs">
                      {user?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accountLinks.map((link) => (
                    <DropdownMenuItem asChild key={link.path}>
                      <Link to={link.path}>
                        <link.icon />
                        {link.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={signOut}
                    className="text-red-400 focus:text-red-300"
                  >
                    <LogOut />
                    {t('header.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                className="hidden h-10 px-4 text-xs sm:inline-flex"
              >
                <Link to="/login">{t('header.signIn')}</Link>
              </Button>
            )}
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
        </div>
        <SheetContent closeLabel={t('common.close')} className="max-w-sm">
          <div className="border-b border-border px-6 py-6">
            <SheetTitle>{t('common.mainNavigation')}</SheetTitle>
            <SheetDescription className="mt-2">
              {t('header.navigationHint')}
            </SheetDescription>
          </div>
          <nav
            aria-label={t('common.mainNavigation')}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                {link.name}
              </Link>
            ))}
            {[
              {
                title: t('header.genres'),
                items: genres,
                param: 'phimGenre',
                loading: genresLoading,
              },
              {
                title: t('header.countries'),
                items: countries,
                param: 'phimCountry',
                loading: countriesLoading,
              },
            ].map((section) => (
              <details
                key={section.param}
                className="group rounded-xl border border-border bg-background/40"
              >
                <summary className="cursor-pointer px-3 py-3 text-sm font-medium">
                  {section.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {section.items.length}
                  </span>
                </summary>
                <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto p-2 pt-0">
                  {section.items.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/browse?${section.param}=${encodeURIComponent(item.slug)}`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-white"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {!section.items.length && (
                    <p className="col-span-2 p-3 text-sm text-muted-foreground">
                      {section.loading
                        ? t('common.loading')
                        : t('common.noData')}
                    </p>
                  )}
                </div>
              </details>
            ))}
            {isAuthenticated && (
              <div className="space-y-1 border-t border-border pt-3">
                {accountLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-accent"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
          <div className="border-t border-border p-4">
            {isAuthenticated ? (
              <Button variant="outline" className="w-full" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                {t('header.logout')}
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  {t('header.signIn')}
                </Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </header>
    </Sheet>
  );
};
export default Header;
