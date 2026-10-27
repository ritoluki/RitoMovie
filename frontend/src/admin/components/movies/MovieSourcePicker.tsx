import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPhimImageUrl } from '@/utils/helpers';
import { managedMovieService, ManagedMovie, movieErrorMessage } from '../../services/managedMovieService';

export default function MovieSourcePicker({ open, onClose, onImported }: {
  open: boolean; onClose: () => void; onImported: (movie: ManagedMovie) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [slug, setSlug] = useState('');
  const [page, setPage] = useState(1);
  const source = useQuery({ queryKey: ['admin', 'movie-source', keyword, page],
    queryFn: () => managedMovieService.source(keyword, page), enabled: open, staleTime: 30000 });
  const add = useMutation({ mutationFn: managedMovieService.import,
    onSuccess: response => { toast.success(t('admin.moviesSource.added')); onImported(response.data); onClose(); },
    onError: error => toast.error(movieErrorMessage(error)),
  });
  return <Dialog open={open} onOpenChange={value => { if (!value && !add.isPending) onClose(); }}>
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogTitle>{t('admin.moviesSource.addTitle')}</DialogTitle>
      <DialogDescription className="mt-2">{t('admin.moviesSource.description')}</DialogDescription>
      <form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); setKeyword(query.trim()); setPage(1); }}>
        <Input aria-label={t('admin.moviesSource.searchPhimApi')} value={query} onChange={event => setQuery(event.target.value)} placeholder={t('admin.moviesSource.movieName')} maxLength={200} /><Button type="submit">{t('admin.moviesSource.search')}</Button>
      </form>
      <form className="mt-3 flex gap-2" onSubmit={event => { event.preventDefault(); add.mutate(slug.trim()); }}>
        <Input aria-label={t('admin.moviesSource.slug')} value={slug} onChange={event => setSlug(event.target.value)} placeholder={t('admin.moviesSource.orEnterSlug')} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} />
        <Button type="submit" variant="outline" disabled={add.isPending}>{t('admin.moviesSource.addSlug')}</Button>
      </form>
      {source.isError && <div role="alert" className="mt-4 text-sm text-red-300">{movieErrorMessage(source.error)} <button onClick={() => source.refetch()} className="underline">{t('admin.moviesSource.retry')}</button></div>}
      {source.isLoading && <p className="py-6 text-muted-foreground">{t('admin.moviesSource.loading')}</p>}
      {!source.isLoading && !source.isError && !source.data?.data.length && <p className="py-6 text-muted-foreground">{t('admin.moviesSource.noneFound')}</p>}
      <div className="mt-4 divide-y divide-border">{source.data?.data.map(movie => <div key={movie.slug} className="flex items-center gap-3 py-3">
        <img src={getPhimImageUrl(movie.thumb_url || movie.poster_url)} alt="" className="h-16 w-11 rounded object-cover" />
        <div className="min-w-0 flex-1"><p className="font-medium">{movie.name}</p><p className="text-xs text-muted-foreground">{movie.origin_name} · {movie.year}</p><p className="text-xs text-muted-foreground">{movie.slug}</p></div>
        <Button size="sm" disabled={add.isPending} variant={movie.managedId ? 'outline' : 'default'} onClick={() => add.mutate(movie.slug)}>{movie.managedId ? t('admin.moviesSource.syncEdit') : t('admin.moviesSource.add')}</Button>
      </div>)}</div>
      {source.data?.pagination && <div className="mt-4 flex items-center justify-between gap-3">
        <Button size="sm" variant="outline" disabled={page <= 1 || source.isFetching} onClick={() => setPage(page - 1)}>{t('admin.moviesSource.previous')}</Button>
        <span className="text-sm text-muted-foreground">{t('admin.moviesSource.page', { page, pages: source.data.pagination.pages })}</span>
        <Button size="sm" variant="outline" disabled={page >= source.data.pagination.pages || source.isFetching} onClick={() => setPage(page + 1)}>{t('admin.moviesSource.next')}</Button>
      </div>}
    </DialogContent>
  </Dialog>;
}
