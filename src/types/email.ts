export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  brand?: string;
  htmlContent?: string;
}

export interface SearchFilters {
  brand: string;
  subject: string;
  startDate?: Date;
  endDate?: Date;
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
}

export interface EmailContentResponse {
  htmlContent: string;
  messageId: string;
}
