import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Store the language preference in localStorage
    localStorage.setItem('preferredLanguage', lng);
    setIsOpen(false);
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

  // Group languages into rows for grid display
  const languageRows = [];
  for (let i = 0; i < languages.length; i += 3) {
    languageRows.push(languages.slice(i, i + 3));
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1.5 text-white hover:bg-teal-500/50 rounded-full px-3 h-8"
        onClick={() => setIsOpen(true)}
      >
        <Globe className="h-4 w-4" />
        {!isMobile && (
          <span className="text-sm font-medium">{getCurrentLanguageLabel()}</span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md border-teal-100 p-0 max-h-[90vh] overflow-auto">
          <DialogHeader className="bg-gradient-to-r from-teal-600 to-emerald-500 px-4 py-3 sticky top-0 z-10">
            <DialogTitle className="text-white text-lg font-medium">{t('language.select')}</DialogTitle>
          </DialogHeader>
          
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={i18n.language === lang.code ? "default" : "outline"}
                  className={`justify-start h-10 relative transition-all duration-200 ${
                    i18n.language === lang.code 
                      ? 'bg-teal-500 hover:bg-teal-600 text-white font-medium' 
                      : 'hover:border-teal-500 hover:text-teal-700'
                  }`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <span className="text-left truncate">{lang.label}</span>
                  {i18n.language === lang.code && (
                    <span className="absolute right-2 w-2 h-2 rounded-full bg-white" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}