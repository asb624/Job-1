import React from 'react';
import { useTranslationProgress } from '@/lib/translation-context';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

export function TranslationLoader() {
  const { isLoading, progress, totalItems, translatedItems } = useTranslationProgress();
  const { t } = useTranslation();
  
  // Hide the component if not loading
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm p-3 shadow-md transition-all duration-300 ease-in-out animate-in fade-in-50 slide-in-from-top-5">
      <div className="flex items-center gap-3 mb-1.5">
        <Loader2 className="h-5 w-5 text-teal-600 animate-spin" />
        <div className="flex items-center">
          <span className="text-sm font-medium text-teal-700">
            {t('common.translating', 'Translating content...')}
          </span>
          {totalItems > 0 && (
            <span className="text-xs text-teal-600 ml-2 bg-teal-50 px-2 py-0.5 rounded-full">
              {translatedItems}/{totalItems}
            </span>
          )}
        </div>
      </div>
      <div className="w-full max-w-xs">
        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  );
}