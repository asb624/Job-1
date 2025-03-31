import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  
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
    <div className="relative">
      <Select
        value={i18n.language}
        onValueChange={changeLanguage}
      >
        <SelectTrigger 
          className={`flex items-center gap-1.5 text-white hover:bg-teal-500/50 rounded-full px-3 transition-all duration-300 ease-in-out h-8 border-0 focus:ring-1 focus:ring-teal-400 ${isMobile ? 'w-8 pl-1 pr-0 justify-center' : 'min-w-[110px]'}`}
        >
          <Globe className="h-4 w-4 flex-shrink-0" />
          {!isMobile && (
            <>
              <SelectValue placeholder={getCurrentLanguageLabel()} className="text-sm font-medium" />
              <ChevronDown className="h-3 w-3 opacity-70 text-white ml-auto" />
            </>
          )}
        </SelectTrigger>
        <SelectContent className="border-teal-100 shadow-lg rounded-xl overflow-hidden max-h-60">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 py-2 px-3 text-white text-sm font-medium mb-1">
            {t('language.select')}
          </div>
          {languages.map((lang, index) => (
            <SelectItem 
              key={lang.code} 
              value={lang.code}
              className={`cursor-pointer transition-all duration-200 ease-in-out ${
                i18n.language === lang.code 
                  ? 'bg-teal-50 text-teal-700 font-medium border-l-4 border-teal-500' 
                  : 'hover:bg-teal-50 hover:text-teal-600 border-l-4 border-transparent'
              }`}
            >
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}