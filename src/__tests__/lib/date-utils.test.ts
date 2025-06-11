import {
  normalizeToMidnight,
  normalizeToEndOfDay,
  parseISOLocalDate,
  formatToISOLocalDate,
  getPreviousDay,
  getNextDay,
  isToday,
  formatDateForDisplay,
  getWeekNumber,
  safeParseISO,
  compareDates,
  isDateInRange
} from '../../lib/date-utils';

describe('Date Utils', () => {
  describe('normalizeToMidnight', () => {
    it('should set time to 00:00:00.000', () => {
      // Setup
      const originalDate = new Date(2025, 5, 10, 14, 30, 45, 500); // 10 June 2025, 14:30:45.500
      const originalTimestamp = originalDate.getTime();
      
      // Execute
      const result = normalizeToMidnight(originalDate);
      
      // Assert
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
      expect(result.getDate()).toBe(10);
      
      // Check that original date is not mutated
      expect(originalDate.getTime()).toBe(originalTimestamp);
    });
    
    it('should handle DST transitions', () => {
      // Last Sunday of March 2025 - DST starts in Europe
      const beforeDST = new Date(2025, 2, 30, 1, 30); // March 30, 2025, 01:30
      const afterDST = new Date(2025, 2, 30, 3, 30); // March 30, 2025, 03:30 (after DST change)
      
      const normalizedBeforeDST = normalizeToMidnight(beforeDST);
      const normalizedAfterDST = normalizeToMidnight(afterDST);
      
      // Both should be normalized to the same date at midnight
      expect(normalizedBeforeDST.getDate()).toBe(30);
      expect(normalizedBeforeDST.getMonth()).toBe(2); // March
      expect(normalizedBeforeDST.getHours()).toBe(0);
      
      expect(normalizedAfterDST.getDate()).toBe(30);
      expect(normalizedAfterDST.getMonth()).toBe(2); // March
      expect(normalizedAfterDST.getHours()).toBe(0);
      
      expect(normalizedBeforeDST.getTime()).toBe(normalizedAfterDST.getTime());
    });
  });
  
  describe('normalizeToEndOfDay', () => {
    it('should set time to 23:59:59.999', () => {
      // Setup
      const originalDate = new Date(2025, 5, 10, 14, 30, 45, 500); // 10 June 2025, 14:30:45.500
      const originalTimestamp = originalDate.getTime();
      
      // Execute
      const result = normalizeToEndOfDay(originalDate);
      
      // Assert
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
      expect(result.getDate()).toBe(10);
      
      // Check that original date is not mutated
      expect(originalDate.getTime()).toBe(originalTimestamp);
    });
  });
  
  describe('parseISOLocalDate', () => {
    it('should parse ISO date string as local date', () => {
      const result = parseISOLocalDate('2025-06-10');
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
      expect(result.getDate()).toBe(10);
      expect(result.getHours()).toBe(0);
    });
    
    it('should handle leap year date', () => {
      const result = parseISOLocalDate('2024-02-29');
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });
    
    it('should handle year boundary', () => {
      const result = parseISOLocalDate('2024-12-31');
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(31);
    });
  });
  
  describe('formatToISOLocalDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date(2025, 5, 10); // 10 June 2025
      
      const result = formatToISOLocalDate(date);
      
      expect(result).toBe('2025-06-10');
    });
    
    it('should pad month and day with leading zero', () => {
      const date = new Date(2025, 0, 1); // 1 January 2025
      
      const result = formatToISOLocalDate(date);
      
      expect(result).toBe('2025-01-01');
    });
  });
  
  describe('getPreviousDay', () => {
    it('should return previous day', () => {
      const date = new Date(2025, 5, 10); // 10 June 2025
      const originalTimestamp = date.getTime();
      
      const result = getPreviousDay(date);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June
      expect(result.getDate()).toBe(9);
      
      // Check that original date is not mutated
      expect(date.getTime()).toBe(originalTimestamp);
    });
    
    it('should handle month boundary', () => {
      const date = new Date(2025, 6, 1); // 1 July 2025
      
      const result = getPreviousDay(date);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June
      expect(result.getDate()).toBe(30);
    });
    
    it('should handle year boundary', () => {
      const date = new Date(2025, 0, 1); // 1 January 2025
      
      const result = getPreviousDay(date);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(31);
    });
  });
  
  describe('getNextDay', () => {
    it('should return next day', () => {
      const date = new Date(2025, 5, 10); // 10 June 2025
      const originalTimestamp = date.getTime();
      
      const result = getNextDay(date);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June
      expect(result.getDate()).toBe(11);
      
      // Check that original date is not mutated
      expect(date.getTime()).toBe(originalTimestamp);
    });
    
    it('should handle month boundary', () => {
      const date = new Date(2025, 5, 30); // 30 June 2025
      
      const result = getNextDay(date);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(1);
    });
    
    it('should handle year boundary', () => {
      const date = new Date(2024, 11, 31); // 31 December 2024
      
      const result = getNextDay(date);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(1);
    });
    
    it('should handle leap year', () => {
      const date = new Date(2024, 1, 28); // 28 February 2024 (leap year)
      
      const result = getNextDay(date);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
      
      const date2 = new Date(2024, 1, 29); // 29 February 2024
      
      const result2 = getNextDay(date2);
      
      expect(result2.getFullYear()).toBe(2024);
      expect(result2.getMonth()).toBe(2); // March
      expect(result2.getDate()).toBe(1);
    });
  });
  
  describe('isToday', () => {
    it('should return true if date is today', () => {
      const today = new Date();
      
      const result = isToday(today);
      
      expect(result).toBe(true);
    });
    
    it('should return false if date is not today', () => {
      const yesterday = getPreviousDay(new Date());
      
      const result = isToday(yesterday);
      
      expect(result).toBe(false);
    });
    
    it('should ignore time component', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const result = isToday(today);
      
      expect(result).toBe(true);
    });
  });
  
  describe('safeParseISO', () => {
    it('should parse ISO date string as local date when useLocalTime=true', () => {
      const result = safeParseISO('2025-06-10', true);
      
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(5); // June (0-indexed)
      expect(result?.getDate()).toBe(10);
    });
    
    it('should handle full ISO date-time string with useLocalTime=true', () => {
      const originalDate = new Date(Date.UTC(2025, 5, 10, 12, 0, 0));
      const isoString = originalDate.toISOString(); // This will be in UTC
      
      const result = safeParseISO(isoString, true);
      
      // Should have same local time values as the original UTC time
      expect(result?.getDate()).toBe(originalDate.getUTCDate());
      expect(result?.getHours()).toBe(originalDate.getUTCHours());
    });
    
    it('should handle full ISO date-time string with useLocalTime=false (keep as UTC)', () => {
      const originalDate = new Date(Date.UTC(2025, 5, 10, 12, 0, 0));
      const isoString = originalDate.toISOString();
      
      const result = safeParseISO(isoString, false);
      
      // The local date values will differ from UTC by the timezone offset
      const tzOffset = originalDate.getTimezoneOffset();
      const expectedHours = (originalDate.getUTCHours() - tzOffset / 60) % 24;
      
      // This test is complicated by timezone differences, so we'll just check that
      // the UTC values match
      expect(result?.getUTCFullYear()).toBe(originalDate.getUTCFullYear());
      expect(result?.getUTCMonth()).toBe(originalDate.getUTCMonth());
      expect(result?.getUTCDate()).toBe(originalDate.getUTCDate());
      expect(result?.getUTCHours()).toBe(originalDate.getUTCHours());
    });
    
    it('should return null for invalid date strings', () => {
      const result = safeParseISO('invalid-date');
      
      expect(result).toBeNull();
    });
  });
  
  describe('isDateInRange', () => {
    it('should return true when date is within range', () => {
      const date = new Date(2025, 5, 10); // 10 June 2025
      const startDate = new Date(2025, 5, 5); // 5 June 2025
      const endDate = new Date(2025, 5, 15); // 15 June 2025
      
      const result = isDateInRange(date, startDate, endDate);
      
      expect(result).toBe(true);
    });
    
    it('should return true when date is at start of range', () => {
      const date = new Date(2025, 5, 5, 12, 30); // 5 June 2025, 12:30
      const startDate = new Date(2025, 5, 5); // 5 June 2025
      const endDate = new Date(2025, 5, 15); // 15 June 2025
      
      const result = isDateInRange(date, startDate, endDate);
      
      expect(result).toBe(true);
    });
    
    it('should return true when date is at end of range', () => {
      const date = new Date(2025, 5, 15, 23, 59); // 15 June 2025, 23:59
      const startDate = new Date(2025, 5, 5); // 5 June 2025
      const endDate = new Date(2025, 5, 15); // 15 June 2025
      
      const result = isDateInRange(date, startDate, endDate);
      
      expect(result).toBe(true);
    });
    
    it('should return false when date is before range', () => {
      const date = new Date(2025, 5, 4); // 4 June 2025
      const startDate = new Date(2025, 5, 5); // 5 June 2025
      const endDate = new Date(2025, 5, 15); // 15 June 2025
      
      const result = isDateInRange(date, startDate, endDate);
      
      expect(result).toBe(false);
    });
    
    it('should return false when date is after range', () => {
      const date = new Date(2025, 5, 16); // 16 June 2025
      const startDate = new Date(2025, 5, 5); // 5 June 2025
      const endDate = new Date(2025, 5, 15); // 15 June 2025
      
      const result = isDateInRange(date, startDate, endDate);
      
      expect(result).toBe(false);
    });
    
    it('should ignore time component when checking range', () => {
      const date = new Date(2025, 5, 5, 23, 59); // 5 June 2025, 23:59
      const startDate = new Date(2025, 5, 5, 0, 0); // 5 June 2025, 00:00
      const endDate = new Date(2025, 5, 5, 12, 0); // 5 June 2025, 12:00
      
      const result = isDateInRange(date, startDate, endDate);
      
      expect(result).toBe(true);
    });
  });
});