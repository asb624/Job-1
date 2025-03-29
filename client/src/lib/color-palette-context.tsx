import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type definitions for the color palette
export type ColorPalette = {
  primary: string;
  variant: 'professional' | 'tint' | 'vibrant';
  appearance: 'light' | 'dark' | 'system';
  radius: number;
};

// Initial default palette
const defaultPalette: ColorPalette = {
  primary: 'hsl(170 82% 39%)',
  variant: 'vibrant',
  appearance: 'light',
  radius: 0.75
};

// Define the context type
interface ColorPaletteContextType {
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
  updatePrimaryColor: (color: string) => void;
  updateVariant: (variant: 'professional' | 'tint' | 'vibrant') => void;
  updateAppearance: (appearance: 'light' | 'dark' | 'system') => void;
  updateRadius: (radius: number) => void;
  resetToDefault: () => void;
}

// Create the context
const ColorPaletteContext = createContext<ColorPaletteContextType | undefined>(undefined);

// Color palette provider component
export function ColorPaletteProvider({ children }: { children: ReactNode }) {
  // Initialize the state with the stored palette or the default
  const [palette, setPalette] = useState<ColorPalette>(defaultPalette);

  // Load saved palette on component mount
  useEffect(() => {
    try {
      const savedPalette = localStorage.getItem('colorPalette');
      if (savedPalette) {
        setPalette(JSON.parse(savedPalette));
      }
    } catch (error) {
      console.error('Error loading color palette from localStorage:', error);
    }
  }, []);

  // Update theme.json and localStorage when palette changes
  useEffect(() => {
    try {
      localStorage.setItem('colorPalette', JSON.stringify(palette));
      
      // Update CSS variables based on the palette
      updateCssVariables(palette);
      
      // In a real application, we might want to make an API call to save the user's preference to their profile
      // For now, we'll just use localStorage
    } catch (error) {
      console.error('Error saving color palette to localStorage:', error);
    }
  }, [palette]);

  // Function to update CSS variables based on the palette
  const updateCssVariables = (newPalette: ColorPalette) => {
    // Extract the HSL values from the primary color string
    const hslMatch = newPalette.primary.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (hslMatch) {
      const [_, h, s, l] = hslMatch;
      
      document.documentElement.style.setProperty('--primary-teal', `${h} ${s}% ${l}%`);
      document.documentElement.style.setProperty('--primary-light', `${h} 70% 94%`);
      document.documentElement.style.setProperty('--primary-dark', `${h} ${s}% ${parseInt(l) - 7}%`);
      
      // Update ring color
      document.documentElement.style.setProperty('--ring-color', `${h} ${s}% ${l}%`);
      
      // Update scrollbar colors
      document.documentElement.style.setProperty('--scrollbar-thumb', `${h} 60% 70%`);
      document.documentElement.style.setProperty('--scrollbar-thumb-hover', `${h} 60% 60%`);
      
      // Update heading color
      document.documentElement.style.setProperty('--heading-color', `${h} ${s}% ${parseInt(l) - 7}%`);
    }
    
    // Update border radius
    document.documentElement.style.setProperty('--radius', `${newPalette.radius}rem`);
  };

  // Helper functions to update individual palette properties
  const updatePrimaryColor = (color: string) => {
    setPalette(prev => ({ ...prev, primary: color }));
  };

  const updateVariant = (variant: 'professional' | 'tint' | 'vibrant') => {
    setPalette(prev => ({ ...prev, variant }));
  };

  const updateAppearance = (appearance: 'light' | 'dark' | 'system') => {
    setPalette(prev => ({ ...prev, appearance }));
  };

  const updateRadius = (radius: number) => {
    setPalette(prev => ({ ...prev, radius }));
  };

  const resetToDefault = () => {
    setPalette(defaultPalette);
  };

  return (
    <ColorPaletteContext.Provider
      value={{
        palette,
        setPalette,
        updatePrimaryColor,
        updateVariant,
        updateAppearance,
        updateRadius,
        resetToDefault
      }}
    >
      {children}
    </ColorPaletteContext.Provider>
  );
}

// Custom hook to use the color palette context
export function useColorPalette() {
  const context = useContext(ColorPaletteContext);
  if (context === undefined) {
    throw new Error('useColorPalette must be used within a ColorPaletteProvider');
  }
  return context;
}