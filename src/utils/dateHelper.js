// dateHelper.js - Date Utility Functions
import {
  format,
  parseISO,
  isAfter,
  isBefore,
  addDays,
  differenceInDays,
} from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format date to display string
 * @param {string|Date} date
 * @param {string} formatString
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatString = 'dd/MM/yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString, { locale: vi });
  } catch (error) {
    return '';
  }
};

/**
 * Format date to display with time
 * @param {string|Date} date
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Format date to relative time (e.g. "2 ngày trước")
 * @param {string|Date} date
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const daysDiff = differenceInDays(now, dateObj);

    if (daysDiff === 0) return 'Hôm nay';
    if (daysDiff === 1) return 'Hôm qua';
    if (daysDiff < 7) return `${daysDiff} ngày trước`;
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} tuần trước`;
    if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} tháng trước`;
    return `${Math.floor(daysDiff / 365)} năm trước`;
  } catch (error) {
    return '';
  }
};

/**
 * Check if date is overdue
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isOverdue = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(dateObj, new Date());
  } catch (error) {
    return false;
  }
};

/**
 * Get days until due date
 * @param {string|Date} date
 * @returns {number} Days until due
 */
export const getDaysUntilDue = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return differenceInDays(dateObj, new Date());
  } catch (error) {
    return 0;
  }
};

/**
 * Add days to current date
 * @param {number} days
 * @returns {Date}
 */
export const addDaysToNow = (days) => {
  return addDays(new Date(), days);
};
