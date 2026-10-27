import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Film, Pencil, Plus, Star, Flame, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { getPhimImageUrl } from '@/utils/helpers';
import { Link } from 'react-router-dom';
import DataTable, { Column } from '../components/common/DataTable';
import SearchInput from '../components/common/SearchInput';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import ManagedMovieEditor from '../components/movies/ManagedMovieEditor';
import MovieSourcePicker from '../components/movies/MovieSourcePicker';
import { managedMovieService, ManagedMovie, MoviePatch, MovieListParams, BulkMovieAction, movieErrorMessage } from '../services/managedMovieService';

export default function AdminMovies() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [params, setParams] = useState<MovieListParams>({ page: 1, limit: 20, sortBy: 'updatedAt', sortOrder: 'desc' });
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<ManagedMovie | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ ids: string[]; title: string; action: BulkMovieAction } | null>(null);
  const catalog = useQuery({ queryKey: ['admin', 'movies', params], queryFn: () => managedMovieService.list(params) });
  const genres = useQuery({ queryKey: ['admin', 'managed-movie-genres'], queryFn: managedMovieService.genres });
  const refresh = () => { void client.invalidateQueries(); setSelected([]); };
  const update = useMutation({ mutationFn: ({ id, patch }: { id: string; patch: MoviePatch }) => managedMovieService.update(id, patch),
    onSuccess: () => { refresh(); toast.success(t('admin.movies.settingsSaved')); }, onError: error => toast.error(movieErrorMessage(error)),
  });
  const bulk = useMutation({ mutationFn: ({ ids, action }: { ids: string[]; action: BulkMovieAction }) => managedMovieService.bulk(action, ids),
    onSuccess: () => { setConfirmation(null); refresh(); toast.success(t('admin.movies.settingsUpdated')); }, onError: error => toast.error(movieErrorMessage(error)),
  });
  const ask = (ids: string[], action: BulkMovieAction, title: string) => setConfirmation({ ids, action, title });
  const columns: Column<ManagedMovie>[] = [
    { key: 'title', header: t('admin.movies.movie'), sortable: true, render: movie => <div className="flex items-center gap-3">
      {movie.poster_path ? <img src={getPhimImageUrl(movie.poster_path)} alt="" className="h-16 w-11 rounded object-cover" /> : <Film className="size-8 text-muted-foreground" />}
      <div className="min-w-0"><p className="font-medium text-white">{movie.title}</p><p className="text-xs text-muted-foreground">{movie.original_title}</p><p className="text-xs text-muted-foreground">{movie.slug}</p></div>
    </div> },
    { key: 'release_date', header: t('admin.movies.year'), sortable: true, render: movie => movie.snapshot.year || '—' },
    { key: 'status', header: t('admin.movies.visibility'), render: movie => <span className={movie.isHidden || movie.effectiveHidden ? 'text-red-300' : 'text-green-300'}>{movie.effectiveHidden && !movie.isHidden ? t('admin.movies.hiddenByRelatedRules') : movie.isHidden ? t('admin.movies.hidden') : t('admin.movies.visible')}</span> },
    { key: 'curated', header: t('admin.movies.homeSections'), render: movie => <div className="flex gap-2 text-xs"><span>{movie.isFeatured ? `★ ${t('admin.movies.featured')}` : ''}</span><span>{movie.isTrending ? t('admin.movies.trending') : ''}</span>{!movie.isFeatured && !movie.isTrending && '—'}</div> },
    { key: 'actions', header: t('admin.common.actions'), render: movie => <div className="flex flex-wrap gap-1">
      <Button size="icon" variant="ghost" title={t('admin.movies.edit')} aria-label={`${t('admin.movies.edit')}: ${movie.title}`} onClick={() => setEditor(movie)}><Pencil className="size-4" /></Button>
      <Button size="icon" variant="ghost" title={movie.effectiveHidden && !movie.isHidden ? t('admin.movies.updateRelatedVisibility') : movie.isHidden ? t('admin.movies.show') : t('admin.movies.hide')} aria-label={movie.isHidden ? t('admin.movies.show') : t('admin.movies.hide')} disabled={update.isPending || (movie.effectiveHidden && !movie.isHidden)}
        onClick={() => movie.isHidden ? update.mutate({ id: movie._id, patch: { isHidden: false } }) : ask([movie._id], 'hide', movie.title)}>{movie.isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</Button>
      <Button size="icon" variant="ghost" title={t('admin.movies.toggleFeatured')} aria-label={t('admin.movies.toggleFeatured')} disabled={update.isPending} onClick={() => update.mutate({ id: movie._id, patch: { isFeatured: !movie.isFeatured } })}><Star className={`size-4 ${movie.isFeatured ? 'fill-yellow-400 text-yellow-400' : ''}`} /></Button>
      <Button size="icon" variant="ghost" title={t('admin.movies.toggleTrending')} aria-label={t('admin.movies.toggleTrending')} disabled={update.isPending} onClick={() => update.mutate({ id: movie._id, patch: { isTrending: !movie.isTrending } })}><Flame className={`size-4 ${movie.isTrending ? 'text-orange-400' : ''}`} /></Button>
      <Button size="icon" variant="ghost" title={t('admin.movies.removeSettings')} aria-label={t('admin.movies.removeSettings')} onClick={() => ask([movie._id], 'remove', movie.title)}><Trash2 className="size-4 text-red-300" /></Button>
      {!movie.isHidden && !movie.effectiveHidden && <Button asChild size="sm" variant="outline"><a href={`/movie/${movie.tmdb_id || 0}?type=${movie.mediaType}${movie.source === 'tmdb' ? '' : `&phimSlug=${encodeURIComponent(movie.slug)}`}`} target="_blank" rel="noreferrer">{t('admin.movies.view')}</a></Button>}
    </div> },
  ];
  return <div className="space-y-5">
    <nav className="flex gap-2" aria-label={t('admin.movies.title')}><Button variant="secondary">{t('admin.movies.catalog')}</Button><Button asChild variant="outline"><Link to="/admin/home-layout">{t('admin.movies.homeSections')}</Link></Button></nav>
    <AdminBreadcrumb items={[{ label: t('admin.common.admin'), href: '/admin' }, { label: t('admin.movies.title') }]} />
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-white">{t('admin.movies.title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('admin.movies.description')}</p></div><Button onClick={() => setSourceOpen(true)}><Plus className="size-4" />{t('admin.movies.addFromPhimApi')}</Button></div>
    <p className="text-sm text-muted-foreground">{t('admin.movies.pageHint')}</p>
    <div className="flex flex-wrap gap-3">
      <SearchInput value={params.search || ''} onChange={search => { setParams({ ...params, search, page: 1 }); setSelected([]); }} placeholder={t('admin.movies.searchPlaceholder')} className="sm:w-80" />
      <SelectField className="sm:w-48" value={params.status || ''} onValueChange={status => { setParams({ ...params, status, page: 1 }); setSelected([]); }}>
        <option value="">{t('admin.movies.allMovies')}</option><option value="visible">{t('admin.movies.visible')}</option><option value="hidden">{t('admin.movies.hidden')}</option><option value="featured">{t('admin.movies.featured')}</option><option value="trending">{t('admin.movies.trending')}</option>
      </SelectField>
      <SelectField className="sm:w-48" value={params.genre || ''} onValueChange={genre => { setParams({ ...params, genre, page: 1 }); setSelected([]); }}>
        <option value="">{t('admin.movies.allGenres')}</option>
        {genres.data?.data.map(genre => <option key={genre._id} value={genre._id}>{genre._id} ({genre.count})</option>)}
      </SelectField>
      <Button variant="outline" onClick={() => catalog.refetch()} disabled={catalog.isFetching}>{t('admin.movies.refresh')}</Button>
    </div>
    {catalog.isError && <p role="alert" className="text-red-300">{movieErrorMessage(catalog.error)}</p>}
    {!!selected.length && <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-3">
      <span className="mr-2 text-sm">{t('admin.movies.selected', { count: selected.length })}</span>
      {(['hide', 'show', 'feature', 'unfeature', 'trending', 'untrending', 'remove'] as const).map(action => <Button key={action} size="sm" variant="outline" disabled={bulk.isPending} onClick={() => ask(selected, action, `${selected.length}`)}>{t(`admin.movies.actionLabels.${action}`)}</Button>)}
      <Button size="sm" variant="ghost" onClick={() => setSelected([])}>{t('admin.movies.clear')}</Button>
    </div>}
    <DataTable columns={columns} data={catalog.data?.data || []} loading={catalog.isLoading} pagination={catalog.data?.pagination}
      onPageChange={page => { setParams({ ...params, page }); setSelected([]); }}
      onSort={(sortBy, sortOrder) => { setParams({ ...params, sortBy, sortOrder, page: 1 }); setSelected([]); }} sortBy={params.sortBy} sortOrder={params.sortOrder}
      selectable selectedRows={selected} onSelectRows={setSelected} emptyMessage={t('admin.movies.noMovies')} />
    <ManagedMovieEditor movie={editor} onClose={() => setEditor(null)} onSaved={refresh} />
    <MovieSourcePicker open={sourceOpen} onClose={() => setSourceOpen(false)} onImported={movie => { refresh(); setEditor(movie); }} />
    <ConfirmDialog isOpen={Boolean(confirmation)} onClose={() => { if (!bulk.isPending) setConfirmation(null); }}
      onConfirm={() => { if (confirmation) bulk.mutate(confirmation); }} title={`${t(confirmation?.action === 'remove' ? 'admin.movies.removeSettings' : `admin.movies.actionLabels.${confirmation?.action || 'hide'}`)}: ${confirmation?.title || ''}`}
      message={t(confirmation?.action === 'remove' ? 'admin.movies.removeSettingsMessage' : confirmation?.action === 'hide' ? 'admin.movies.hideSelectedMessage' : 'admin.movies.applySelected')}
      loading={bulk.isPending} variant={confirmation?.action === 'remove' || confirmation?.action === 'hide' ? 'warning' : 'info'} />
  </div>;
}
