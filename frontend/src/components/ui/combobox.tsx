import { useId, useState } from 'react';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/utils/helpers';
import { normalizeSearch } from '@/utils/search';

interface Option {
  value: string;
  label: string;
}
interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label: string;
  placeholder?: string;
  disabled?: boolean;
}
export const Combobox = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  disabled,
}: Props) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const { t } = useTranslation();
  const selected = options.find((option) => option.value === value);
  return (
    <div className="space-y-2">
      <label
        id={`${id}-label`}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-labelledby={`${id}-label`}
            disabled={disabled}
            className="w-full justify-between bg-background/60 font-normal"
          >
            <span className="truncate">
              {selected?.label || placeholder || t('common.selectOption')}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command
            label={label}
            filter={(value, search) => {
              return normalizeSearch(value).includes(normalizeSearch(search))
                ? 1
                : 0;
            }}
            className="overflow-hidden rounded-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Command.Input
                aria-label={`${t('common.search')} ${label}`}
                placeholder={t('common.search')}
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-60 overflow-y-auto overscroll-contain p-1.5">
              <Command.Empty className="p-5 text-center text-sm text-muted-foreground">
                {t('common.noData')}
              </Command.Empty>
              {options.map((option) => (
                <Command.Item
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="flex cursor-default items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm outline-none data-[selected=true]:bg-accent"
                >
                  {option.label}
                  <Check
                    className={cn(
                      'h-4 w-4 text-brand',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
