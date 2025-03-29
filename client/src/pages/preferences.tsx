import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPaletteGenerator } from '@/components/color-palette-generator';
import { PalettePreview } from '@/components/palette-preview';
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ColorPaletteGenerator />
            </div>
            <div>
              <PalettePreview />
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-md mt-6">
            <h3 className="text-lg font-medium mb-2">{t('About Color Themes')}</h3>
            <p className="text-muted-foreground">
              {t('Your color preferences will be saved to your browser and applied across the entire application. Changes are applied instantly, allowing you to see the effects in real-time.')}
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