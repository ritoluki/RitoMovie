import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { managedMovieService, ManagedMovie, MovieOverrides, movieErrorMessage } from '../../services/managedMovieService';

export default function ManagedMovieEditor({ movie, onClose, onSaved }: {
  movie: ManagedMovie | null; onClose: () => void; onSaved: () => void;
}) {
  const [overrides, setOverrides] = useState<MovieOverrides>({ titles: {}, overviews: {} });
  const [flags, setFlags] = useState({ isHidden: false, isFeatured: false, isTrending: false });
  useEffect(() => {
    if (!movie) return;
    setOverrides({ titles: { ...movie.overrides?.titles }, overviews: { ...movie.overrides?.overviews },
      posterUrl: movie.overrides?.posterUrl || '', backdropUrl: movie.overrides?.backdropUrl || '' });
    setFlags({ isHidden: movie.isHidden, isFeatured: movie.isFeatured, isTrending: movie.isTrending });
  }, [movie]);
  const save = useMutation({ mutationFn: () => managedMovieService.update(movie!._id, { ...flags, overrides }),
    onSuccess: () => { toast.success('Movie settings saved'); onSaved(); onClose(); },
    onError: error => toast.error(movieErrorMessage(error)),
  });
  return <Dialog open={Boolean(movie)} onOpenChange={open => { if (!open && !save.isPending) onClose(); }}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogTitle>Edit movie</DialogTitle>
      <DialogDescription className="mt-2">{movie?.snapshot.name} · {movie?.slug}. Empty fields use the original source. These changes apply only to this website.</DialogDescription>
      {movie?.effectiveHidden && !movie.isHidden && <p className="mt-3 text-sm text-amber-300">Another title/source rule hides this movie. Update website visibility in Home sections to make it available.</p>}
      <form className="mt-5 space-y-5" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
        <fieldset disabled={save.isPending} className="space-y-5 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            {(['vi', 'en'] as const).map(language => <div key={language} className="space-y-3">
              <label className="block text-sm">Title ({language.toUpperCase()})
                <Input name={`title-${language}`} maxLength={200} value={overrides.titles[language] || ''}
                  placeholder={language === 'vi' ? movie?.snapshot.name : movie?.snapshot.origin_name}
                  onChange={event => setOverrides({ ...overrides, titles: { ...overrides.titles, [language]: event.target.value } })} />
              </label>
              <label className="block text-sm">Description ({language.toUpperCase()})
                <textarea name={`overview-${language}`} maxLength={10000} rows={6}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={overrides.overviews[language] || ''}
                  onChange={event => setOverrides({ ...overrides, overviews: { ...overrides.overviews, [language]: event.target.value } })} />
              </label>
            </div>)}
          </div>
          {(['posterUrl', 'backdropUrl'] as const).map(key => <label key={key} className="block text-sm">{key === 'posterUrl' ? 'Poster image URL' : 'Backdrop image URL'}
            <Input name={key} type="url" maxLength={2000} placeholder="https://..." value={overrides[key] || ''}
              onChange={event => setOverrides({ ...overrides, [key]: event.target.value })} />
          </label>)}
          <div className="flex flex-wrap gap-5">{(['isHidden', 'isFeatured', 'isTrending'] as const).map(key => <label key={key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={key} className="size-4 accent-red-500" checked={flags[key]} onChange={event => setFlags({ ...flags, [key]: event.target.checked })} />
            {key === 'isHidden' ? 'Hidden on website' : key === 'isFeatured' ? 'Featured' : 'Trending'}
          </label>)}</div>
          <p className="text-xs text-muted-foreground">Featured and trending movies appear in dedicated home sections. Hidden movies are excluded from both.</p>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save changes'}</Button></div>
        </fieldset>
      </form>
    </DialogContent>
  </Dialog>;
}
