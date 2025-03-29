import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import i18next from "i18next"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined, format: 'short' | 'long' = 'short'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const language = i18next.language || navigator.language || 'en';
    
    if (format === 'long') {
      return dateObj.toLocaleDateString(language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    
    return dateObj.toLocaleDateString(language);
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof date === 'string' ? date : String(date);
  }
}
