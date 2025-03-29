import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useColorPalette } from '@/lib/color-palette-context';

export function PalettePreview() {
  const { t } = useTranslation();
  const { palette } = useColorPalette();
  
  // Extract the HSL values from the primary color
  const hslMatch = palette.primary.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  let h = 170, s = 82, l = 39;
  
  if (hslMatch) {
    const [, hStr, sStr, lStr] = hslMatch;
    h = parseInt(hStr);
    s = parseInt(sStr);
    l = parseInt(lStr);
  }
  
  // Generate derived colors for the preview
  const primaryColor = palette.primary;
  const primaryLight = `hsl(${h} 70% 94%)`;
  const primaryDark = `hsl(${h} ${s}% ${l - 7}%)`;
  const secondaryColor = `hsl(${(h + 30) % 360} ${s}% ${l}%)`;
  const accentColor = `hsl(${(h + 60) % 360} ${s}% ${l}%)`;
  const warningColor = `hsl(45 95% 50%)`;
  const destructiveColor = `hsl(0 85% 55%)`;
  
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">{t('Palette Preview')}</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ColorSwatch color={primaryColor} name={t('Primary')} />
          <ColorSwatch color={primaryLight} name={t('Primary Light')} />
          <ColorSwatch color={primaryDark} name={t('Primary Dark')} />
          <ColorSwatch color={secondaryColor} name={t('Secondary')} />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ColorSwatch color={accentColor} name={t('Accent')} />
          <ColorSwatch color={warningColor} name={t('Warning')} />
          <ColorSwatch color={destructiveColor} name={t('Destructive')} />
          <ColorSwatch color={'hsl(220 14% 96%)'} name={t('Background')} />
        </div>
        
        <div className="space-y-4 mt-8">
          <h4 className="text-md font-medium">{t('UI Elements Preview')}</h4>
          
          <div className="flex flex-wrap gap-2">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          
          <div className="p-4 rounded-md" style={{ 
            backgroundColor: primaryLight,
            borderRadius: `${palette.radius}rem`
          }}>
            <p className="text-sm">{t('Card with primary background')}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div 
              style={{ 
                width: '2rem', 
                height: '2rem', 
                backgroundColor: primaryColor,
                borderRadius: '50%'
              }} 
            />
            <div 
              style={{ 
                width: '6rem', 
                height: '0.5rem', 
                backgroundColor: primaryLight,
                borderRadius: `${palette.radius}rem`
              }} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for displaying a color swatch
function ColorSwatch({ color, name }: { color: string, name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-12 h-12 rounded-full mb-2" 
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-center">{name}</span>
      <span className="text-xs text-muted-foreground">{color}</span>
    </div>
  );
}