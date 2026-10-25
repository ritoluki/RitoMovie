import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
interface Props {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: ReactNode }[];
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}
const EMPTY = '__ritomovie_all__';
const Dropdown = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  className,
  disabled,
  id,
}: Props) => {
  const generatedId = useId();
  const controlId = id || generatedId;
  const { t } = useTranslation();
  const hasEmpty = options.some((option) => option.value === '');
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={controlId}
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <Select
        value={value || (hasEmpty ? EMPTY : '')}
        onValueChange={(next) => onChange(next === EMPTY ? '' : next)}
        disabled={disabled}
      >
        <SelectTrigger
          id={controlId}
          aria-label={label || placeholder || t('common.selectOption')}
        >
          <SelectValue placeholder={placeholder || t('common.selectOption')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value || EMPTY}>
              <span className="inline-flex items-center gap-2">
                {option.icon}
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
export default Dropdown;
