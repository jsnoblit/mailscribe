export interface Email {
  id: string;
  sender: string;
  subject: string;
  date: string; // ISO date string
  bodyHtml?: string; // Full HTML content of the email
}

export interface SearchCriteria {
  brand: string; // Sender domain or email
  subject: string; // Keywords or "All"
  startDate?: Date;
  endDate?: Date;
}

export interface GeneratedScreenshot {
  emailId: string;
  fileName: string;
  dataUrl: string; // Base64 encoded PNG or a URL to the stored image
}
