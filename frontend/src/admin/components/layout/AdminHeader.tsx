import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, PanelLeftClose, PanelLeftOpen, ArrowUpRight, LogOut, UserRound, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/common/NotificationBell';
import type { AdminRealtimeStatus } from '@/lib/adminRealtime';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
interface Props { onMenuClick: () => void; onToggleSidebar: () => void; sidebarOpen: boolean; realtimeStatus: AdminRealtimeStatus }
const AdminHeader = ({ onMenuClick, onToggleSidebar, sidebarOpen, realtimeStatus }: Props) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  return <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-6">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('admin.common.openNavigation')} onClick={onMenuClick}><Menu className="h-5 w-5" /></Button>
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label={t('admin.common.toggleSidebar')} onClick={onToggleSidebar}>{sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</Button>
      <span className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">RitoMovie <span className="ml-1 text-foreground">Admin</span></span>
    </div>
    <div className="flex items-center gap-3">
      <span role="status" title={t(realtimeStatus === 'live' ? 'admin.realtime.liveHint' : 'admin.realtime.fallbackHint')} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`size-2 rounded-full ${realtimeStatus === 'live' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className="hidden md:inline">{t(`admin.realtime.${realtimeStatus}`)}</span>
        <span className="sr-only md:hidden">{t(`admin.realtime.${realtimeStatus}`)}</span>
      </span>
      <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link to="/">{t('admin.nav.website')}<ArrowUpRight className="h-3.5 w-3.5" /></Link></Button>
      <NotificationBell />
      <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" className="h-10 gap-2 px-2" aria-label={t('admin.common.adminAccount')}><span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs">{user?.name?.charAt(0).toUpperCase() || 'A'}</span><ChevronDown className="h-3 w-3" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end"><DropdownMenuLabel>{user?.name || t('admin.common.admin')}<span className="mt-1 block text-xs capitalize">{user?.role ? t(`admin.roles.${user.role}`, { defaultValue: user.role.replace('_', ' ') }) : ''}</span></DropdownMenuLabel><DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/profile"><UserRound />{t('admin.nav.profile')}</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/"><ArrowUpRight />{t('admin.nav.website')}</Link></DropdownMenuItem><DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-400 focus:text-red-300" onSelect={() => { logout(); navigate('/login'); }}><LogOut />{t('admin.nav.logout')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>;
};
export default AdminHeader;
