// Utility functions for date formatting with GMT+8 (Kuala Lumpur timezone)

/**
 * Convert date string to GMT+8 and format as locale string
 * Assumes the input date is already in GMT+8 from the backend
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted date string in GMT+8
 */
export const toGMT8LocaleString = (dateStr) => {
  if (!dateStr) return '';
  
  // Parse the date string as if it's already in GMT+8
  // The backend now stores all dates in GMT+8 timezone
  const date = new Date(dateStr);
  
  // Format in GMT+8 timezone
  return date.toLocaleString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');
};

/**
 * Convert date string to GMT+8 and format as date only
 * Assumes the input date is already in GMT+8 from the backend
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted date string in GMT+8
 */
export const toGMT8LocaleDateString = (dateStr) => {
  if (!dateStr) return '';
  
  // Parse the date string as if it's already in GMT+8
  const date = new Date(dateStr);
  
  // Format in GMT+8 timezone
  return date.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format date for relative time display (e.g., "5m ago", "2h ago")
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  
  const diff = Math.floor((now - date) / 1000); // difference in seconds
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  
  return toGMT8LocaleDateString(dateStr);
};

/**
 * Get current date/time in GMT+8 as ISO string
 * @returns {string} ISO string in GMT+8
 */
export const getCurrentGMT8 = () => {
  return new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour12: false
  });
};
