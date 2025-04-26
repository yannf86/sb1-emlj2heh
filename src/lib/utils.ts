import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting options
export const DATE_FORMATS = {
  default: {
    day: '2-digit' as const,
    month: '2-digit' as const,
    year: 'numeric' as const
  },
  withTime: {
    day: '2-digit' as const,
    month: '2-digit' as const,
    year: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const
  },
  shortMonth: {
    day: '2-digit' as const,
    month: 'short' as const,
    year: 'numeric' as const
  },
  longMonth: {
    day: '2-digit' as const,
    month: 'long' as const,
    year: 'numeric' as const
  }
};

// Format a date using the specified format
export function formatDate(date: Date | string | null | undefined, format: keyof typeof DATE_FORMATS = 'default'): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date);
      return '-';
    }
    
    return dateObj.toLocaleDateString('fr-FR', DATE_FORMATS[format]);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

// Format a time string (HH:mm)
export function formatTime(time: string | null | undefined): string {
  if (!time) return '-';
  
  try {
    // Try to parse the time string
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
}

// Format a date and time together
export function formatDateTime(date: Date | string | null | undefined, time?: string): string {
  if (!date) return '-';
  
  try {
    const dateStr = formatDate(date);
    const timeStr = time ? formatTime(time) : '';
    
    return timeStr ? `${dateStr} à ${timeStr}` : dateStr;
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return '-';
  }
}

// Parse a date string into a Date object
export function parseDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

// Get current date in YYYY-MM-DD format (for input[type="date"])
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get current time in HH:mm format (for input[type="time"])
export function getCurrentTime(): string {
  return new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Validate a date string
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Format a date range
export function formatDateRange(startDate: Date | string | null | undefined, endDate: Date | string | null | undefined): string {
  if (!startDate || !endDate) return '-';
  
  try {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return '-';
  }
}

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper function to convert a data URL to a File object
export async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File | null> {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      console.warn('Invalid data URL format');
      return null;
    }
    
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const mimeType = blob.type || 'image/jpeg'; // Default to JPEG if type is missing
    
    return new File([blob], fileName, { type: mimeType });
  } catch (error) {
    console.error('Error converting data URL to File:', error);
    return null;
  }
}

// Helper function to check if a value is a valid Data URL
export function isDataUrl(value: any): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('data:');
}