import React from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Store the language preference in localStorage
    localStorage.setItem('preferredLanguage', lng);
  };

  const languages = [
    { code: 'en', label: t('language.en') },
    { code: 'hi', label: t('language.hi') },
    { code: 'ta', label: t('language.ta') },
    { code: 'bn', label: t('language.bn') },
    { code: 'te', label: t('language.te') },
    { code: 'pa', label: t('language.pa') },
    { code: 'hr', label: t('language.hr') },
    { code: 'mr', label: t('language.mr') }
  ];

  const getCurrentLanguageLabel = () => {
    const currentLang = i18n.language;
    const language = languages.find(lang => lang.code === currentLang);
    return language ? language.label : languages[0].label;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">{getCurrentLanguageLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-muted' : ''}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}