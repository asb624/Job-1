import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useColorPalette, ColorPalette } from '@/lib/color-palette-context';
import { useTheme } from '@/lib/theme-context';

// Predefined color palettes that users can choose from
const predefinedPalettes = [
  { name: 'Teal (Default)', color: 'hsl(170 82% 39%)' },
  { name: 'Ocean Blue', color: 'hsl(210 100% 50%)' },
  { name: 'Forest Green', color: 'hsl(130 75% 35%)' },
  { name: 'Autumn Orange', color: 'hsl(25 100% 55%)' },
  { name: 'Lavender Purple', color: 'hsl(270 70% 60%)' },
  { name: 'Cherry Red', color: 'hsl(0 85% 55%)' },
  { name: 'Sunshine Yellow', color: 'hsl(45 95% 50%)' },
  { name: 'Coral Pink', color: 'hsl(350 85% 70%)' },
];

export function ColorPaletteGenerator() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { 
    palette, 
    updatePrimaryColor, 
    updateVariant, 
    updateRadius, 
    resetToDefault 
  } = useColorPalette();
  
  // Local state for color selection
  const [selectedColor, setSelectedColor] = useState<string>(palette.primary);
  const [customColor, setCustomColor] = useState<string>(palette.primary);
  
  // Update the local state when the palette changes
  useEffect(() => {
    setSelectedColor(palette.primary);
    setCustomColor(palette.primary);
  }, [palette.primary]);
  
  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    updatePrimaryColor(color);
  };
  
  // Handle custom color input
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
  };
  
  const handleCustomColorApply = () => {
    updatePrimaryColor(customColor);
  };
  
  // Handle variant selection
  const handleVariantChange = (variant: 'professional' | 'tint' | 'vibrant') => {
    updateVariant(variant);
  };
  
  // Handle radius change
  const handleRadiusChange = (value: number[]) => {
    updateRadius(value[0]);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('Color Palette Generator')}</CardTitle>
        <CardDescription>
          {t('Customize your experience with personalized colors and styles')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="predefined">
          <TabsList className="mb-4">
            <TabsTrigger value="predefined">{t('Predefined Palettes')}</TabsTrigger>
            <TabsTrigger value="custom">{t('Custom Color')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('Advanced Options')}</TabsTrigger>
          </TabsList>
          
          {/* Predefined Palettes Tab */}
          <TabsContent value="predefined" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {predefinedPalettes.map((palette) => (
                <div 
                  key={palette.name}
                  className={`flex flex-col items-center p-3 rounded-md cursor-pointer transition-all ${
                    selectedColor === palette.color ? 'ring-2 ring-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleColorSelect(palette.color)}
                >
                  <div 
                    className="w-12 h-12 rounded-full mb-2" 
                    style={{ backgroundColor: palette.color }}
                  />
                  <span className="text-sm text-center">{t(palette.name)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Custom Color Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder="Enter color value (hex, rgb, hsl)"
                />
              </div>
              <div className="w-full h-20 rounded-md" style={{ backgroundColor: customColor }} />
              <Button onClick={handleCustomColorApply}>{t('Apply Custom Color')}</Button>
            </div>
          </TabsContent>
          
          {/* Advanced Options Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('Style Variant')}</h3>
              <RadioGroup
                value={palette.variant}
                onValueChange={(value) => handleVariantChange(value as any)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="professional" id="professional" />
                  <Label htmlFor="professional">{t('Professional')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tint" id="tint" />
                  <Label htmlFor="tint">{t('Tint')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vibrant" id="vibrant" />
                  <Label htmlFor="vibrant">{t('Vibrant')}</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t('Border Radius')}</h3>
                <span className="text-sm text-muted-foreground">{palette.radius}rem</span>
              </div>
              <Slider
                value={[palette.radius]}
                min={0}
                max={2}
                step={0.125}
                onValueChange={handleRadiusChange}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('Square')}</span>
                <span>{t('Rounded')}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('Theme Mode')}</h3>
              <Button variant="outline" onClick={toggleTheme} className="w-full">
                {theme === 'light' ? t('Switch to Dark Mode') : t('Switch to Light Mode')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={resetToDefault}>{t('Reset to Default')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}