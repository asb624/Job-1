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
    { code: 'gu', label: t('language.gu') },
    { code: 'ml', label: t('language.ml') },
    { code: 'kn', label: t('language.kn') },
    { code: 'or', label: t('language.or') },
    { code: 'as', label: t('language.as') },
    { code: 'kok', label: t('language.kok') },
    { code: 'ks', label: t('language.ks') },
    { code: 'sd', label: t('language.sd') },
    { code: 'mni', label: t('language.mni') },
    { code: 'brx', label: t('language.brx') }
  ];

  const getCurrentLanguageLabel = () => {
    const currentLang = i18n.language;
    const language = languages.find(lang => lang.code === currentLang);
    return language ? language.label : languages[0].label;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1.5 text-white hover:bg-teal-500/50 rounded-full px-3 transition-all duration-400 ease-in-out transform hover:scale-105"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline text-sm font-medium">{getCurrentLanguageLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="border-teal-100 shadow-lg rounded-xl overflow-hidden w-48"
      >
        <div className="bg-gradient-to-r from-teal-600 to-emerald-500 py-2 px-3 text-white text-sm font-medium">
          {t('language.select')}
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`${
                i18n.language === lang.code 
                  ? 'bg-teal-50 text-teal-700 font-medium border-l-4 border-teal-500' 
                  : 'hover:bg-teal-50 hover:text-teal-600 border-l-4 border-transparent'
              } cursor-pointer transition-all duration-300 ease-in-out px-4 hover:translate-x-1`}
            >
              {lang.label}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}