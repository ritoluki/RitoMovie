import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/helpers';
import { normalizeSearch } from '@/utils/search';

interface Props {
  title: string;
  items: { slug: string; name: string }[];
  param: 'phimGenre' | 'phimCountry';
  loading?: boolean;
}
const TaxonomyMenu = ({ title, items, param, loading }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { t } = useTranslation();
  const location = useLocation();
  const selected = new URLSearchParams(location.search).get(param);
  const filtered = useMemo(
    () =>
      items.filter((item) =>
        normalizeSearch(item.name).includes(normalizeSearch(query))
      ),
    [items, query]
  );
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-10 px-2.5 text-sm',
            (open || selected) && 'bg-accent text-white'
          )}
        >
          {title}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              open && 'rotate-180'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-taxonomy={param}
        align="end"
        className="w-[440px] p-0"
        aria-label={title}
      >
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">{title}</p>
            <span className="text-xs text-muted-foreground">
              {items.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={`${t('common.search')} ${title}`}
              placeholder={`${t('common.search')} ${title.toLowerCase()}…`}
              className="pl-9"
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  event.currentTarget
                    .closest('[data-taxonomy]')
                    ?.querySelector<HTMLAnchorElement>('a')
                    ?.focus();
                }
              }}
            />
          </div>
        </div>
        <div className="grid max-h-[min(360px,60dvh)] grid-cols-2 gap-1 overflow-y-auto overscroll-contain p-2">
          {filtered.map((item) => (
            <Link
              key={item.slug}
              to={`/browse?${param}=${encodeURIComponent(item.slug)}`}
              onClick={() => {
                setOpen(false);
                setQuery('');
              }}
              className={cn(
                'rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-white focus:bg-accent focus:text-white focus:outline-none',
                selected === item.slug && 'bg-brand/10 text-brand'
              )}
            >
              {item.name}
            </Link>
          ))}
          {!filtered.length && (
            <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
              {loading ? t('common.loading') : t('common.noData')}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
export default TaxonomyMenu;
