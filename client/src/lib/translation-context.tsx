import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { preloadTranslations, setGlobalProgressCallback } from './translation-utils';

interface TranslationContextType {
  isLoading: boolean;
  progress: number;
  totalItems: number;
  translatedItems: number;
}

const TranslationContext = createContext<TranslationContextType>({
  isLoading: false,
  progress: 0,
  totalItems: 0,
  translatedItems: 0
});

export const useTranslationProgress = () => useContext(TranslationContext);

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [translatedItems, setTranslatedItems] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Set up the global progress callback
  useEffect(() => {
    // Register our progress callback with the translation utility
    setGlobalProgressCallback((progress, total) => {
      setTotalItems(total);
      setTranslatedItems(progress);
    });
    
    // Clean up when unmounted
    return () => {
      setGlobalProgressCallback(() => {});
    };
  }, []);
  
  // Monitor language changes and preload translations for all visible text
  useEffect(() => {
    if (i18n.language === 'en') {
      // No translation needed for English
      setIsLoading(false);
      setProgress(100);
      return;
    }
    
    // We'll set up a global loading state when language changes
    setIsLoading(true);
    setProgress(0);
    setTranslatedItems(0);
    
    // Force a minimum loading time for better UX
    // This gives time for the UI to update even if translations are cached
    const minLoadingTime = setTimeout(() => {
      // Only auto-close if no active translations are in progress
      if (translatedItems >= totalItems || totalItems === 0) {
        setIsLoading(false);
        setProgress(100);
      }
    }, 800);
    
    return () => {
      clearTimeout(minLoadingTime);
    };
  }, [i18n.language]);
  
  // Update progress based on translation events
  useEffect(() => {
    if (totalItems > 0) {
      const calculatedProgress = Math.round((translatedItems / totalItems) * 100);
      setProgress(calculatedProgress);
      
      if (translatedItems >= totalItems) {
        // Add a small delay before hiding the loading indicator
        // This makes the animation smoother
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }
  }, [translatedItems, totalItems]);
  
  const contextValue = {
    isLoading,
    progress,
    totalItems,
    translatedItems
  };
  
  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}