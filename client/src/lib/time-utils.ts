import { isWeekend, getMonth, getDate, getYear } from 'date-fns';
import * as JapaneseHolidays from 'japanese-holidays';

export interface ParsedTimeResult {
  startTime: string;
  endTime: string;
  actualMinutes: number;
  surplusDeficitMinutes: number;
}

/**
 * Parses full-width and half-width time strings and calculates working minutes.
 * Accepts formats like: 10:00-19:00, １０：００～１９：００
 */
export function parseWorkTime(input: string): ParsedTimeResult | null {
  if (!input) return null;

  // 1. Convert full-width characters to half-width
  let normalized = input.replace(/[！-～]/g, (r) => 
    String.fromCharCode(r.charCodeAt(0) - 0xFEE0)
  );
  
  // Convert various dash/tilde symbols to standard hyphen
  normalized = normalized.replace(/[ー〜~－]/g, '-').replace(/\s+/g, '');

  // 2. Extract times using regex (HH:MM-HH:MM)
  const regex = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
  const match = normalized.match(regex);

  if (!match) return null;

  const startH = parseInt(match[1], 10);
  const startM = parseInt(match[2], 10);
  const endH = parseInt(match[3], 10);
  const endM = parseInt(match[4], 10);

  // Validate limits
  if (startH >= 30 || startM >= 60 || endH >= 30 || endM >= 60) return null;

  // Validate 5-minute increments
  if (startM % 5 !== 0 || endM % 5 !== 0) return null;

  let startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;

  // Handle crossing midnight (e.g., 22:00-02:00)
  if (endTotal < startTotal) {
    endTotal += 24 * 60; 
  }

  // 1 hour fixed break time
  const BREAK_MINUTES = 60;
  let actualMinutes = (endTotal - startTotal) - BREAK_MINUTES;
  
  // Prevent negative work time if logged less than 1 hour
  if (actualMinutes < 0) actualMinutes = 0; 

  // Standard work time is 8 hours (480 minutes)
  const STANDARD_MINUTES = 8 * 60;
  const surplusDeficitMinutes = actualMinutes - STANDARD_MINUTES;

  const formatTime = (h: number, m: number) => {
    // Keep > 24 hours format if entered that way (e.g. 25:00)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return {
    startTime: formatTime(startH, startM),
    endTime: formatTime(endH, endM),
    actualMinutes,
    surplusDeficitMinutes
  };
}

/**
 * Format minutes into readable string (e.g. 150 -> "2時間30分", -30 -> "-0時間30分")
 */
export function formatMinutes(minutes: number, showSign = false): string {
  const isNegative = minutes < 0;
  const absMin = Math.abs(minutes);
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  
  let result = `${h}時間`;
  if (m > 0) result += `${m}分`;
  else result += `00分`;

  if (isNegative) return `-${result}`;
  if (showSign && minutes > 0) return `+${result}`;
  return result;
}

/**
 * Check if a date is a holiday (Weekends, Japanese Public Holidays, Dec 30 - Jan 4)
 */
export function isHoliday(date: Date): boolean {
  if (isWeekend(date)) return true;

  const month = getMonth(date) + 1; // 0-indexed to 1-indexed
  const day = getDate(date);

  // Year-end and New Year holidays (Dec 30 to Jan 4)
  if ((month === 12 && day >= 30) || (month === 1 && day <= 4)) {
    return true;
  }

  // Japanese Public Holidays
  if (JapaneseHolidays.isHoliday(date)) {
    return true;
  }

  return false;
}

/**
 * Get total standard working minutes for a given year and month
 */
export function getStandardWorkingMinutes(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    if (!isHoliday(date)) {
      workingDays++;
    }
  }
  
  return workingDays * 8 * 60; // 8 hours per working day
}
