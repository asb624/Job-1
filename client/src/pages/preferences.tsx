import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function PreferencesPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{t('Preferences')}</h1>
      
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="appearance">{t('Appearance')}</TabsTrigger>
          <TabsTrigger value="language">{t('Language')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('Notifications')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">{t('Theme Settings')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('The application uses a consistent theme across all pages. Theme customization is not available in this version.')}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="language">
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">{t('Choose Your Language')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('Select your preferred language from the options below. All content will be displayed in the selected language.')}
              </p>
              
              <div className="max-w-md">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">{t('Notification Settings')}</h2>
            <p className="text-muted-foreground">
              {t('Notification preferences will be available in a future update.')}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}