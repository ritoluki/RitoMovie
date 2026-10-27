import { Check, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
const languages = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English' },
];
const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const current = i18n.language.split('-')[0];
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 px-2.5"
          aria-label={t('common.language')}
        >
          <Globe2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs uppercase">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onSelect={() => i18n.changeLanguage(language.code)}
          >
            <span className="flex-1">{language.name}</span>
            {language.code === current && <Check className="text-brand" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default LanguageSwitcher;
