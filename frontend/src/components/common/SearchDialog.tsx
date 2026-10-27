import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command } from 'cmdk';
import { ArrowUpRight, Clock3, Film, Loader2, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { normalizeKeyword, searchResultsPath } from '@/lib/searchPalette';
import { getImageUrl, getPhimImageUrl } from '@/utils/helpers';

function SearchContent({ close }: { close: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const keyword = normalizeKeyword(input);
  const [selected, setSelected] = useState('');
  const keyboardSelection = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = useSearchSuggestions(input, true);
  const history = useSearchHistory();
  const go = (path: string, term = keyword) => {
    if (term.length < 2) return;
    history.remember(term);
    close();
    navigate(path);
  };
  const searchAll = (term = keyword) => go(searchResultsPath(term), term);
  const changeInput = (value: string) => {
    keyboardSelection.current = false;
    setSelected('');
    setInput(value);
  };
  const optionValues = keyword.length >= 2 ? [...suggestions.items.map(item => item.id), 'all-results']
    : keyword ? [] : history.history.map(entry => `history:${entry}`);
  return <>
    <div className="border-b border-border px-5 pb-4 pt-5 pr-16 sm:px-6 sm:pr-16">
      <DialogTitle className="flex items-center gap-2 text-base"><Search className="size-4 text-red-400" />{t('searchPalette.title')}</DialogTitle>
      <DialogDescription className="mt-1 text-xs">{t('searchPalette.description')}</DialogDescription>
    </div>
    <Command shouldFilter={false} loop value={selected} onValueChange={setSelected} label={t('searchPalette.title')}
      className="flex min-h-0 flex-1 flex-col"
      onKeyDownCapture={event => {
        // Let auxiliary buttons handle their own Enter/arrow keys, rather than
        // also activating the currently highlighted search result.
        if ((event.target as HTMLElement).closest('button')) { event.stopPropagation(); return; }
        if (event.nativeEvent.isComposing || event.keyCode === 229 || event.target !== inputRef.current) return;
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !keyboardSelection.current && optionValues.length) {
          event.preventDefault(); event.stopPropagation(); keyboardSelection.current = true;
          setSelected(event.key === 'ArrowDown' ? optionValues[0] : optionValues[optionValues.length - 1]);
        } else if (event.key === 'Enter' && !keyboardSelection.current) {
          event.preventDefault(); event.stopPropagation();
          if (keyword.length >= 2) searchAll();
        }
      }}>
      <div className="m-4 flex shrink-0 items-center gap-3 rounded-xl border border-border bg-background/60 px-3 focus-within:border-red-400/50 focus-within:ring-2 focus-within:ring-red-500/10 sm:mx-5">
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <Command.Input ref={inputRef} value={input} onValueChange={changeInput} aria-label={t('searchPalette.inputLabel')}
          placeholder={t('searchPalette.placeholder')} maxLength={120} autoComplete="off" spellCheck={false} enterKeyHint="search"
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none" />
        {input && <button type="button" aria-label={t('searchPalette.clearInput')} onClick={() => { changeInput(''); inputRef.current?.focus(); }}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-white"><X className="size-4" /></button>}
      </div>
      {!keyword && history.history.length > 0 && <div className="flex items-center justify-between px-5 pb-2 text-xs text-muted-foreground">
        <span>{t('searchPalette.recent')}</span><button type="button" onClick={history.clear} className="rounded px-1 py-1 transition hover:text-red-300">{t('searchPalette.clearHistory')}</button>
      </div>}
      <Command.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 sm:px-4" aria-label={t('searchPalette.results')}>
        {!keyword && (history.history.length ? history.history.map(entry => <div key={entry} className="flex items-center gap-1">
          <Command.Item value={`history:${entry}`} onSelect={() => searchAll(entry)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-300 outline-none data-[selected=true]:bg-accent data-[selected=true]:text-white">
            <Clock3 className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{entry}</span>
          </Command.Item>
          <button type="button" aria-label={t('searchPalette.removeHistory', { keyword: entry })} onClick={() => history.remove(entry)}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-red-300"><X className="size-3.5" /></button>
        </div>) : <div className="grid min-h-40 place-content-center gap-3 p-6 text-center text-sm text-muted-foreground">
          <Search className="mx-auto size-9 text-gray-600" /><p>{t('searchPalette.startTyping')}</p><p className="text-xs text-gray-500">{t('searchPalette.historyHint')}</p>
        </div>)}
        {keyword && keyword.length < 2 && <p role="status" className="p-8 text-center text-sm text-muted-foreground">{t('searchPalette.minimum')}</p>}
        {keyword.length >= 2 && <>
          {suggestions.loading && <div role="status" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />{t('searchPalette.searching')}</div>}
          {suggestions.failed ? <div role="alert" className="space-y-3 px-3 py-6 text-center text-sm text-muted-foreground">
            <p>{t('searchPalette.failed')}</p><button type="button" onClick={suggestions.retry} className="text-red-300 hover:underline">{t('common.retry')}</button>
          </div> : !suggestions.loading && !suggestions.items.length ? <p role="status" className="px-3 py-8 text-center text-sm text-muted-foreground">{t('searchPalette.noResults', { keyword })}</p> : null}
          {suggestions.partial && <p role="status" className="px-3 py-2 text-xs text-amber-300/80">{t('searchPalette.partial')}</p>}
          {suggestions.items.map(item => <Command.Item key={item.id} value={item.id} onSelect={() => go(item.href)}
            className="group flex cursor-pointer items-center gap-3 rounded-xl p-3 text-left outline-none transition-colors data-[selected=true]:bg-accent">
            <span className="relative grid h-16 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/5 bg-white/5 text-gray-600">
              <Film className="absolute size-5" />
              {item.poster && <img src={item.source === 'phim' ? getPhimImageUrl(item.poster) : getImageUrl(item.poster, 'poster')}
                alt="" className="relative h-full w-full object-cover" loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-gray-100">{item.title}</span>
              {item.subtitle && item.subtitle !== item.title && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.subtitle}</span>}
              <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500">
                {item.year && <span>{item.year}</span>}<span>{t(`searchPalette.${item.type}`)}</span>{item.label && <span>{item.label}</span>}
              </span>
            </span><ArrowUpRight className="size-4 shrink-0 text-gray-600 group-data-[selected=true]:text-red-300" />
          </Command.Item>)}
          <Command.Item value="all-results" onSelect={() => searchAll()} className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[.025] px-3 py-3 text-sm text-red-300 outline-none data-[selected=true]:bg-accent">
            <span className="min-w-0 truncate">{t('searchPalette.viewAll', { keyword })}</span><ArrowUpRight className="size-4 shrink-0" />
          </Command.Item>
        </>}
      </Command.List>
    </Command>
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3 text-[11px] text-gray-500">
      <span className="hidden sm:inline">{t('searchPalette.keyboardHint')}</span><span>{t('searchPalette.escapeHint')}</span>
    </div>
  </>;
}

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label={t('common.search')}><Search className="size-4" /></Button></DialogTrigger>
    <DialogContent closeLabel={t('common.close')} className="flex h-[min(640px,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden p-0 max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:top-3 max-sm:h-auto max-sm:w-auto max-sm:translate-x-0 max-sm:translate-y-0">
      {open && <SearchContent close={() => setOpen(false)} />}
    </DialogContent>
  </Dialog>;
}
