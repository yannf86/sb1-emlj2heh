import { useState, useCallback } from 'react';
import { 
  formatDate, 
  formatTime, 
  formatDateTime, 
  parseDate, 
  isValidDate,
  getCurrentDate,
  getCurrentTime
} from '@/lib/utils';

interface UseDateOptions {
  defaultDate?: string;
  defaultTime?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

export function useDate(options: UseDateOptions = {}) {
  const [date, setDate] = useState(options.defaultDate || getCurrentDate());
  const [time, setTime] = useState(options.defaultTime || getCurrentTime());
  const [error, setError] = useState<string | null>(null);

  // Validate date
  const validateDate = useCallback((value: string) => {
    if (!value && options.required) {
      return "La date est requise";
    }
    
    if (value && !isValidDate(value)) {
      return "Date invalide";
    }
    
    if (value && options.minDate && value < options.minDate) {
      return `La date doit être après le ${formatDate(options.minDate)}`;
    }
    
    if (value && options.maxDate && value > options.maxDate) {
      return `La date doit être avant le ${formatDate(options.maxDate)}`;
    }
    
    return null;
  }, [options.required, options.minDate, options.maxDate]);

  // Handle date change
  const handleDateChange = useCallback((value: string) => {
    const error = validateDate(value);
    setError(error);
    setDate(value);
    return !error;
  }, [validateDate]);

  // Handle time change
  const handleTimeChange = useCallback((value: string) => {
    setTime(value);
    return true;
  }, []);

  // Get formatted values
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const formattedDateTime = formatDateTime(date, time);

  return {
    date,
    time,
    error,
    setDate: handleDateChange,
    setTime: handleTimeChange,
    formattedDate,
    formattedTime,
    formattedDateTime,
    isValid: !error
  };
}