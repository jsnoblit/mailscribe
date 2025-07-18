export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  brand?: string;
  htmlContent?: string;
}

export interface SearchCriteria {
  brand: string; // Sender domain or email
  subject: string; // Keywords or "All"
  startDate?: Date;
  endDate?: Date;
  startTime?: string; // HH:MM format (24-hour)
  endTime?: string; // HH:MM format (24-hour)
  maxResults?: number;
}

export interface SearchFilters {
  brand: string;
  subject: string;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  maxResults?: number;
}

export interface ScreenshotOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

export interface BatchScreenshotResult {
  success: string[];
  failed: string[];
}

export interface GmailSearchResponse {
  messages: EmailMessage[];
  totalResults: number;
  totalFound: number;
  processedCount: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export interface EmailContentResponse {
  htmlContent: string;
  messageId: string;
}

export interface GeneratedScreenshot {
  emailId: string;
  fileName: string;
  dataUrl: string; // Base64 encoded PNG or a URL to the stored image
  renderedHtml?: string; // Optional: HTML content for download
}
