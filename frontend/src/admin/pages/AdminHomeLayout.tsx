import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowUp, ArrowDown, Pin, Eye, EyeOff, RotateCcw, RefreshCw, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getImageUrl, getPhimImageUrl } from '@/utils/helpers';
import { phimTitle } from '@/utils/phimLocalization';
import { normalizeSearch } from '@/utils/search';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { movieErrorMessage } from '../services/managedMovieService';
import { homeLayoutService, HomeSectionPatch, HomeEditorItem } from '../services/homeLayoutService';

type Action = { type: 'section'; id: string; patch: HomeSectionPatch } | { type: 'order'; ids: string[] } |
  { type: 'reset' } | { type: 'visibility'; id: string; key: string; hidden: boolean };

export default function AdminHomeLayout() {
  const { t, i18n } = useTranslation();
  const vi = i18n.language.startsWith('vi');
  const client = useQueryClient();
  const queryKey = ['admin', 'home-layout', i18n.language];
  const query = useQuery({ queryKey, queryFn: homeLayoutService.get, refetchOnWindowFocus: false });
  const [selected, setSelected] = useState('top-rated');
  const [search, setSearch] = useState('');
  const [confirmation, setConfirmation] = useState<{ action: Action; title: string; message: string } | null>(null);
  const revision = query.data?.data.revision ?? 0;
  const sections = query.data?.data.sections || [];
  const current = sections.find(section => section.id === selected);
  const label = (section: typeof current) => section ? t(section.titleKey, { defaultValue: section.title[vi ? 'vi' : 'en'] }) : '';
  const change = useMutation({ mutationFn: (action: Action) => {
    if (action.type === 'section') return homeLayoutService.update(action.id, revision, action.patch);
    if (action.type === 'order') return homeLayoutService.order(revision, action.ids);
    if (action.type === 'visibility') return homeLayoutService.visibility(action.id, action.key, action.hidden);
    return homeLayoutService.reset(revision);
  }, onSuccess: response => {
    client.setQueryData(queryKey, response);
    void client.invalidateQueries({ predicate: candidate => candidate.queryKey[0] !== 'admin' });
    void client.invalidateQueries({ queryKey: ['admin', 'movies'] });
    void client.invalidateQueries({ queryKey: ['admin', 'movie-source'] });
    void client.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    setConfirmation(null); toast.success(t('admin.homeLayout.saved'));
  }, onError: error => {
    toast.error(movieErrorMessage(error));
    void query.refetch();
  } });
  const disabled = change.isPending || query.isFetching;
  const update = (patch: HomeSectionPatch) => { if (current) change.mutate({ type: 'section', id: current.id, patch }); };
  const moveSection = (index: number, direction: number) => {
    const ids = sections.map(section => section.id);
    const target = index + direction;
    if (index === 0 || target < 1 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    change.mutate({ type: 'order', ids });
  };
  const itemTitle = (item: HomeEditorItem) => item.key.startsWith('phim:')
    ? phimTitle(item.movie as any, i18n.language)
    : item.movie.siteOverrides?.titles?.[vi ? 'vi' : 'en'] || item.movie.title || item.movie.name || item.key;
  const toggle = (keys: string[], key: string) => keys.includes(key) ? keys.filter(value => value !== key) : [...keys, key];
  const group = (item: HomeEditorItem) => !current ? [] : item.pinned ? current.pinnedIds : current.items
    .filter(entry => entry.live && !entry.pinned && !entry.hidden && !entry.globallyHidden).map(entry => entry.key);
  const moveItem = (item: HomeEditorItem, direction: number) => {
    if (!current) return;
    const keys = [...group(item)];
    const index = keys.indexOf(item.key), target = index + direction;
    if (index < 0 || target < 0 || target >= keys.length) return;
    [keys[index], keys[target]] = [keys[target], keys[index]];
    if (item.pinned) update({ pinnedIds: keys });
    else update({ itemOrder: [...keys, ...current.itemOrder.filter(key => !keys.includes(key))] });
  };
  const confirm = (action: Action, title: string, message: string) => setConfirmation({ action, title, message });

  return <div className="space-y-5">
    <nav className="flex gap-2" aria-label={t('admin.homeLayout.movieManagement')}><Button asChild variant="outline"><Link to="/admin/movies">{t('admin.movies.catalog')}</Link></Button><Button variant="secondary">{t('admin.homeLayout.title')}</Button></nav>
    <AdminBreadcrumb items={[{ label: t('admin.common.admin'), href: '/admin' }, { label: t('admin.homeLayout.title') }]} />
    <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold text-white">{t('admin.homeLayout.title')}</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('admin.homeLayout.description')}</p></div>
      <div className="flex gap-2"><Button variant="outline" disabled={disabled} onClick={() => query.refetch()}><RefreshCw className="size-4" />{t('admin.homeLayout.reload')}</Button>
        <Button variant="outline" disabled={disabled || !query.data} onClick={() => confirm({ type: 'reset' }, t('admin.homeLayout.resetTitle'), t('admin.homeLayout.resetMessage'))}><RotateCcw className="size-4" />{t('admin.homeLayout.reset')}</Button></div>
    </div>
    {query.isError && <p role="alert" className="text-red-300">{movieErrorMessage(query.error)}</p>}
    {query.isLoading && <p className="py-6 text-muted-foreground">{t('admin.common.loading')}</p>}
    <div className="grid gap-5 xl:grid-cols-[320px,1fr]">
      <aside className="space-y-2" aria-label={t('admin.homeLayout.title')}>{sections.map((section, index) => <div key={section.id} data-section-control={section.id} className={`rounded-xl border p-3 ${section.id === selected ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
        <button className="w-full text-left" onClick={() => { setSelected(section.id); setSearch(''); }} aria-pressed={section.id === selected}>
          <span className="font-medium text-white">{label(section)}</span><span className="mt-1 block text-xs text-muted-foreground">{section.liveCount} {t('admin.homeLayout.sourceMovies')} · {section.enabled ? t('admin.homeLayout.shown') : t('admin.homeLayout.sectionHidden')}</span>
        </button>
        <div className="mt-3 flex gap-1"><Button size="sm" variant="outline" disabled={disabled} aria-label={section.enabled ? t('admin.homeLayout.hideSection') : t('admin.homeLayout.showSection')} onClick={() => change.mutate({ type: 'section', id: section.id, patch: { enabled: !section.enabled } })}>{section.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{section.enabled ? t('admin.homeLayout.hideSection') : t('admin.homeLayout.showSection')}</Button>
          <Button size="icon" variant="ghost" disabled={disabled || index <= 1} aria-label={t('admin.homeLayout.moveUp')} onClick={() => moveSection(index, -1)}><ArrowUp className="size-4" /></Button>
          <Button size="icon" variant="ghost" disabled={disabled || index === 0 || index === sections.length - 1} aria-label={t('admin.homeLayout.moveDown')} onClick={() => moveSection(index, 1)}><ArrowDown className="size-4" /></Button>
        </div>
      </div>)}</aside>
      {current && <section className="min-w-0 rounded-xl border border-border bg-card p-4" data-section-editor={current.id}>
        <h2 className="text-xl font-semibold text-white">{label(current)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('admin.homeLayout.limitDescription', { limit: current.limit })}</p>
        {current.id === 'hero' && <p className="mt-2 text-xs text-muted-foreground">{t('admin.homeLayout.heroDescription')}</p>}
        <div className="my-4 flex flex-wrap gap-2"><Input aria-label={t('admin.homeLayout.filterSectionMovies')} className="sm:max-w-xs" value={search} onChange={event => setSearch(event.target.value)} placeholder={t('admin.homeLayout.filterMovies')} />
          <Button variant="outline" disabled={disabled || !current.itemOrder.length} onClick={() => update({ itemOrder: [] })}>{t('admin.homeLayout.automaticOrder')}</Button>
          <Button variant="outline" disabled={disabled} onClick={() => confirm({ type: 'section', id: current.id, patch: { enabled: true, hiddenIds: [], pinnedIds: [], itemOrder: [] } }, t('admin.homeLayout.resetSectionTitle'), t('admin.homeLayout.resetSectionMessage'))}>{t('admin.homeLayout.resetSection')}</Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t('admin.homeLayout.visibilityHint')}</p>
        <div className="divide-y divide-border">{current.items.filter(item => normalizeSearch(itemTitle(item)).includes(normalizeSearch(search))).map(item => {
          const title = itemTitle(item);
          const poster = item.movie.siteOverrides?.posterUrl || (item.movie.thumb_url ? getPhimImageUrl(item.movie.thumb_url) : getImageUrl(item.movie.poster_path, 'poster'));
          const keys = group(item), position = keys.indexOf(item.key);
          const canMove = !item.hidden && !item.globallyHidden && (item.pinned || item.live);
          return <article key={item.key} data-home-item={item.key} className={`flex flex-wrap gap-3 py-4 ${item.hidden || item.globallyHidden ? 'opacity-65' : ''}`}>
            <img src={poster} alt="" className="h-20 w-14 rounded object-cover" />
            <div className="min-w-0 flex-1"><h3 className="font-medium text-white">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{item.key.startsWith('tmdb:') ? 'TMDB' : 'PhimAPI'} · {item.movie.year || String(item.movie.release_date || item.movie.first_air_date || '').slice(0, 4)}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">{item.pinned && <span className="text-yellow-300">{t('admin.homeLayout.pinned')}</span>}{item.hidden && <span>{t('admin.homeLayout.hiddenHere')}</span>}{item.globallyHidden && <span className="text-red-300">{t('admin.homeLayout.globallyHidden')}</span>}{!item.live && <span className="text-muted-foreground">{t('admin.homeLayout.outsideSourceResults')}</span>}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={disabled} aria-label={item.hidden ? t('admin.homeLayout.showHere') : t('admin.homeLayout.hideHere')} onClick={() => update({ hiddenIds: toggle(current.hiddenIds, item.key) })}>{item.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{item.hidden ? t('admin.homeLayout.showHere') : t('admin.homeLayout.hideHere')}</Button>
                <Button size="sm" variant="outline" disabled={disabled || (!item.pinned && current.pinnedIds.length >= current.limit)} aria-label={item.pinned ? t('admin.homeLayout.unpin') : t('admin.homeLayout.pinToTop')} onClick={() => update({ pinnedIds: toggle(current.pinnedIds, item.key) })}><Pin className={`size-4 ${item.pinned ? 'fill-yellow-400 text-yellow-400' : ''}`} />{item.pinned ? t('admin.homeLayout.unpin') : t('admin.homeLayout.pinToTop')}</Button>
                <Button size="icon" variant="ghost" disabled={disabled || !canMove || position <= 0} aria-label={t('admin.homeLayout.moveUp')} onClick={() => moveItem(item, -1)}><ArrowUp className="size-4" /></Button>
                <Button size="icon" variant="ghost" disabled={disabled || !canMove || position < 0 || position >= keys.length - 1} aria-label={t('admin.homeLayout.moveDown')} onClick={() => moveItem(item, 1)}><ArrowDown className="size-4" /></Button>
                <Button size="sm" variant="ghost" disabled={disabled} aria-label={t('admin.homeLayout.changeWebsiteVisibility')} onClick={() => confirm({ type: 'visibility', id: current.id, key: item.key, hidden: !item.globallyHidden }, t('admin.homeLayout.changeWebsiteVisibility'), item.globallyHidden ? t('admin.homeLayout.showWebsiteMessage') : t('admin.homeLayout.hideWebsiteMessage'))}><Globe className="size-4" />{item.globallyHidden ? t('admin.homeLayout.showOnWebsite') : t('admin.homeLayout.hideOnWebsite')}</Button>
              </div>
            </div>
          </article>;
        })}</div>
        {!current.items.length && <p className="py-8 text-center text-muted-foreground">{t('admin.homeLayout.noSourceMovies')}</p>}
      </section>}
    </div>
    <ConfirmDialog isOpen={Boolean(confirmation)} onClose={() => { if (!change.isPending) setConfirmation(null); }} onConfirm={() => { if (confirmation) change.mutate(confirmation.action); }} title={confirmation?.title || ''} message={confirmation?.message || ''} loading={change.isPending} variant="warning" />
  </div>;
}
