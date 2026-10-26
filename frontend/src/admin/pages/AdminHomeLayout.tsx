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
  const text = (vietnamese: string, english: string) => vi ? vietnamese : english;
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
    setConfirmation(null); toast.success(text('Đã lưu cấu hình trang chủ', 'Home settings saved'));
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
    <nav className="flex gap-2" aria-label="Movie management"><Button asChild variant="outline"><Link to="/admin/movies">Movie catalog</Link></Button><Button variant="secondary">Home sections</Button></nav>
    <AdminBreadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: text('Quản lý trang chủ', 'Home sections') }]} />
    <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold text-white">{text('Quản lý trang chủ', 'Home sections')}</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{text('Các mục và phim được lấy sẵn từ nguồn hiện tại. Chỉ lưu lựa chọn ẩn, ghim và thứ tự của bạn; dữ liệu API vẫn tiếp tục cập nhật.', 'Sections and movies are loaded from their existing sources. Your visibility, pins and order are saved while API content keeps updating.')}</p></div>
      <div className="flex gap-2"><Button variant="outline" disabled={disabled} onClick={() => query.refetch()}><RefreshCw className="size-4" />{text('Tải lại', 'Reload')}</Button>
        <Button variant="outline" disabled={disabled || !query.data} onClick={() => confirm({ type: 'reset' }, text('Khôi phục trang chủ?', 'Reset home layout?'), text('Khôi phục thứ tự mục, ghim và ẩn riêng về mặc định. Phim bị ẩn toàn website vẫn giữ nguyên.', 'Restore default section order, pins and section visibility. Globally hidden movies remain hidden.'))}><RotateCcw className="size-4" />{text('Khôi phục mặc định', 'Restore defaults')}</Button></div>
    </div>
    {query.isError && <p role="alert" className="text-red-300">{movieErrorMessage(query.error)}</p>}
    {query.isLoading && <p className="py-6 text-muted-foreground">{t('common.loading')}</p>}
    <div className="grid gap-5 xl:grid-cols-[320px,1fr]">
      <aside className="space-y-2" aria-label="Home section list">{sections.map((section, index) => <div key={section.id} data-section-control={section.id} className={`rounded-xl border p-3 ${section.id === selected ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
        <button className="w-full text-left" onClick={() => { setSelected(section.id); setSearch(''); }} aria-pressed={section.id === selected}>
          <span className="font-medium text-white">{label(section)}</span><span className="mt-1 block text-xs text-muted-foreground">{section.liveCount} {text('phim từ nguồn', 'source movies')} · {section.enabled ? text('Đang hiện', 'Shown') : text('Đã ẩn mục', 'Section hidden')}</span>
        </button>
        <div className="mt-3 flex gap-1"><Button size="sm" variant="outline" disabled={disabled} aria-label={`Toggle section ${section.id}`} onClick={() => change.mutate({ type: 'section', id: section.id, patch: { enabled: !section.enabled } })}>{section.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{section.enabled ? text('Ẩn mục', 'Hide section') : text('Hiện mục', 'Show section')}</Button>
          <Button size="icon" variant="ghost" disabled={disabled || index <= 1} aria-label={`Move section ${section.id} up`} onClick={() => moveSection(index, -1)}><ArrowUp className="size-4" /></Button>
          <Button size="icon" variant="ghost" disabled={disabled || index === 0 || index === sections.length - 1} aria-label={`Move section ${section.id} down`} onClick={() => moveSection(index, 1)}><ArrowDown className="size-4" /></Button>
        </div>
      </div>)}</aside>
      {current && <section className="min-w-0 rounded-xl border border-border bg-card p-4" data-section-editor={current.id}>
        <h2 className="text-xl font-semibold text-white">{label(current)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{text(`Hiển thị tối đa ${current.limit} phim. Phim ghim đứng đầu; phim mới từ nguồn theo sau thứ tự bạn đã chọn.`, `Shows up to ${current.limit} movies. Pins lead; new source results follow your chosen order.`)}</p>
        {current.id === 'hero' && <p className="mt-2 text-xs text-muted-foreground">{text('Banner luôn ở đầu trang và có thể bật/tắt.', 'The hero stays at the top and can be enabled or disabled.')}</p>}
        <div className="my-4 flex flex-wrap gap-2"><Input aria-label="Filter section movies" className="sm:max-w-xs" value={search} onChange={event => setSearch(event.target.value)} placeholder={text('Lọc phim trong mục...', 'Filter these movies...')} />
          <Button variant="outline" disabled={disabled || !current.itemOrder.length} onClick={() => update({ itemOrder: [] })}>{text('Thứ tự tự động', 'Automatic order')}</Button>
          <Button variant="outline" disabled={disabled} onClick={() => confirm({ type: 'section', id: current.id, patch: { enabled: true, hiddenIds: [], pinnedIds: [], itemOrder: [] } }, text('Khôi phục mục này?', 'Reset this section?'), text('Hiện lại mục, bỏ ghim và các lựa chọn ẩn/sắp xếp riêng. Ẩn toàn website không thay đổi.', 'Show this section and clear its pins, hidden items and custom order. Global visibility is preserved.'))}>{text('Khôi phục mục', 'Reset section')}</Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{text('“Ẩn trong mục” chỉ ảnh hưởng mục này. “Ẩn toàn website” áp dụng cả tìm kiếm, chi tiết và nguồn phát mới.', '“Hide here” affects only this section. “Hide on website” also affects search, details and new playback requests.')}</p>
        <div className="divide-y divide-border">{current.items.filter(item => normalizeSearch(itemTitle(item)).includes(normalizeSearch(search))).map(item => {
          const title = itemTitle(item);
          const poster = item.movie.siteOverrides?.posterUrl || (item.movie.thumb_url ? getPhimImageUrl(item.movie.thumb_url) : getImageUrl(item.movie.poster_path, 'poster'));
          const keys = group(item), position = keys.indexOf(item.key);
          const canMove = !item.hidden && !item.globallyHidden && (item.pinned || item.live);
          return <article key={item.key} data-home-item={item.key} className={`flex flex-wrap gap-3 py-4 ${item.hidden || item.globallyHidden ? 'opacity-65' : ''}`}>
            <img src={poster} alt="" className="h-20 w-14 rounded object-cover" />
            <div className="min-w-0 flex-1"><h3 className="font-medium text-white">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{item.key.startsWith('tmdb:') ? 'TMDB' : 'PhimAPI'} · {item.movie.year || String(item.movie.release_date || item.movie.first_air_date || '').slice(0, 4)}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">{item.pinned && <span className="text-yellow-300">{text('Đã ghim', 'Pinned')}</span>}{item.hidden && <span>{text('Ẩn trong mục', 'Hidden here')}</span>}{item.globallyHidden && <span className="text-red-300">{text('Ẩn toàn website', 'Globally hidden')}</span>}{!item.live && <span className="text-muted-foreground">{text('Không còn trong danh sách nguồn hiện tại', 'Outside the current source results')}</span>}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={disabled} aria-label={`Toggle item ${item.key}`} onClick={() => update({ hiddenIds: toggle(current.hiddenIds, item.key) })}>{item.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{item.hidden ? text('Hiện trong mục', 'Show here') : text('Ẩn trong mục', 'Hide here')}</Button>
                <Button size="sm" variant="outline" disabled={disabled || (!item.pinned && current.pinnedIds.length >= current.limit)} aria-label={`Pin item ${item.key}`} onClick={() => update({ pinnedIds: toggle(current.pinnedIds, item.key) })}><Pin className={`size-4 ${item.pinned ? 'fill-yellow-400 text-yellow-400' : ''}`} />{item.pinned ? text('Bỏ ghim', 'Unpin') : text('Ghim đầu', 'Pin to top')}</Button>
                <Button size="icon" variant="ghost" disabled={disabled || !canMove || position <= 0} aria-label={`Move item ${item.key} up`} onClick={() => moveItem(item, -1)}><ArrowUp className="size-4" /></Button>
                <Button size="icon" variant="ghost" disabled={disabled || !canMove || position < 0 || position >= keys.length - 1} aria-label={`Move item ${item.key} down`} onClick={() => moveItem(item, 1)}><ArrowDown className="size-4" /></Button>
                <Button size="sm" variant="ghost" disabled={disabled} aria-label={`Global visibility ${item.key}`} onClick={() => confirm({ type: 'visibility', id: current.id, key: item.key, hidden: !item.globallyHidden }, text('Đổi hiển thị toàn website?', 'Change website visibility?'), item.globallyHidden ? text('Hiện lại phim này trên website. Cấu hình ẩn riêng từng mục vẫn được giữ.', 'Show this movie on the website. Per-section hidden settings are preserved.') : text('Ẩn phim khỏi mọi mục, tìm kiếm, chi tiết và lượt mở nguồn phát mới. Nếu là series TMDB, áp dụng cho các nguồn/mùa cùng ID.', 'Hide this movie from all sections, search, details and new playback requests. A TMDB series rule covers its sources/seasons sharing that ID.'))}><Globe className="size-4" />{item.globallyHidden ? text('Hiện toàn website', 'Show on website') : text('Ẩn toàn website', 'Hide on website')}</Button>
              </div>
            </div>
          </article>;
        })}</div>
        {!current.items.length && <p className="py-8 text-center text-muted-foreground">{text('Nguồn hiện chưa trả phim cho mục này. Bạn vẫn có thể bật/tắt hoặc sắp xếp mục.', 'No movies are currently returned for this section. You can still control its visibility and position.')}</p>}
      </section>}
    </div>
    <ConfirmDialog isOpen={Boolean(confirmation)} onClose={() => { if (!change.isPending) setConfirmation(null); }} onConfirm={() => { if (confirmation) change.mutate(confirmation.action); }} title={confirmation?.title || ''} message={confirmation?.message || ''} loading={change.isPending} variant="warning" />
  </div>;
}
