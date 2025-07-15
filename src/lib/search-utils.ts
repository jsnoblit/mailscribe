/**
 * Utility functions for building Gmail search queries with time support
 */

/**
 * Convert Date and time string to Unix timestamp
 * @param date - The date object
 * @param timeString - Time in HH:MM format (24-hour), optional
 * @param isEndOfDay - If true and no time specified, use 23:59:59
 * @returns Unix timestamp in seconds
 */
export function dateTimeToUnixTimestamp(
  date: Date, 
  timeString?: string, 
  isEndOfDay: boolean = false
): number {
  const dateTime = new Date(date);
  
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    dateTime.setHours(hours, minutes, 0, 0);
  } else if (isEndOfDay) {
    // Set to end of day (23:59:59)
    dateTime.setHours(23, 59, 59, 999);
  } else {
    // Set to start of day (00:00:00)
    dateTime.setHours(0, 0, 0, 0);
  }
  
  return Math.floor(dateTime.getTime() / 1000);
}

/**
 * Build Gmail search query with enhanced date/time support
 */
export function buildGmailSearchQuery(criteria: {
  brand?: string;
  subject?: string;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
}): string {
  const queryParts: string[] = [];

  // Brand filter (sender)
  if (criteria.brand && criteria.brand !== 'All' && criteria.brand.trim()) {
    if (criteria.brand.includes('@')) {
      queryParts.push(`from:${criteria.brand}`);
    } else {
      queryParts.push(`from:*${criteria.brand}*`);
    }
  }

  // Subject filter
  if (criteria.subject && criteria.subject !== 'All' && criteria.subject.trim()) {
    queryParts.push(`subject:"${criteria.subject}"`);
  }

  // Date/time range filters
  if (criteria.startDate) {
    if (criteria.startTime) {
      // Use precise timestamp when time is specified
      const timestamp = dateTimeToUnixTimestamp(criteria.startDate, criteria.startTime);
      queryParts.push(`after:${timestamp}`);
    } else {
      // Use date format for backward compatibility
      const startDateStr = criteria.startDate.toISOString().split('T')[0].replace(/-/g, '/');
      queryParts.push(`after:${startDateStr}`);
    }
  }

  if (criteria.endDate) {
    if (criteria.endTime) {
      // Use precise timestamp when time is specified
      const timestamp = dateTimeToUnixTimestamp(criteria.endDate, criteria.endTime);
      queryParts.push(`before:${timestamp}`);
    } else {
      // Use end of day timestamp to include all emails on the end date
      const timestamp = dateTimeToUnixTimestamp(criteria.endDate, undefined, true);
      queryParts.push(`before:${timestamp}`);
    }
  }

  return queryParts.length > 0 ? queryParts.join(' ') : 'in:inbox';
} 