import { EmailMessage, SearchFilters, GmailSearchResponse, EmailContentResponse } from '@/types/email';
import type { AuthUser } from '@/hooks/useAuth';

export class GmailService {
  /**
   * Build Gmail search query from filters
   */
  private static buildSearchQuery(filters: SearchFilters): string {
    const queryParts: string[] = [];

    // Brand filter (sender)
    if (filters.brand && filters.brand !== 'All') {
      // If it's an email address, search by exact from:
      if (filters.brand.includes('@')) {
        queryParts.push(`from:${filters.brand}`);
      } else {
        // If it's a domain or brand name, search more broadly
        queryParts.push(`from:*${filters.brand}*`);
      }
    }

    // Subject filter
    if (filters.subject && filters.subject !== 'All') {
      queryParts.push(`subject:"${filters.subject}"`);
    }

    // Date range filters
    if (filters.startDate) {
      const startDateStr = filters.startDate.toISOString().split('T')[0].replace(/-/g, '/');
      queryParts.push(`after:${startDateStr}`);
    }

    if (filters.endDate) {
      const endDateStr = filters.endDate.toISOString().split('T')[0].replace(/-/g, '/');
      queryParts.push(`before:${endDateStr}`);
    }

    return queryParts.join(' ');
  }

  /**
   * Search Gmail messages using authenticated user
   */
  static async searchEmails(
    user: AuthUser,
    filters: SearchFilters
  ): Promise<GmailSearchResponse> {
    if (!user.gmailAccessToken) {
      throw new Error('User is not authenticated or Gmail access token is missing');
    }
    const query = this.buildSearchQuery(filters);
    
    console.log('Gmail Service: Making search request with:', {
      hasAccessToken: !!user.gmailAccessToken,
      tokenLength: user.gmailAccessToken.length,
      query,
      filters
    });
    
    const response = await fetch('/api/gmail/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.gmailAccessToken}`,
      },
      body: JSON.stringify({
        accessToken: user.gmailAccessToken,
        query,
        maxResults: filters.maxResults || 50,
        userId: user.uid,
      }),
    });

    console.log('Gmail Service: Response status:', response.status);
    console.log('Gmail Service: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail Service: Error response:', errorText);
      
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.details || response.statusText;
      } catch {
        errorMessage = errorText || response.statusText;
      }
      
      throw new Error(`Failed to search emails (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    console.log('Gmail Service: Success response:', data);
    return data;
  }

  /**
   * Get email HTML content using authenticated user
   */
  static async getEmailContent(
    user: AuthUser,
    messageId: string
  ): Promise<EmailContentResponse> {
    if (!user.gmailAccessToken) {
      throw new Error('User is not authenticated or Gmail access token is missing');
    }
    const response = await fetch('/api/gmail/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.gmailAccessToken}`,
      },
      body: JSON.stringify({
        accessToken: user.gmailAccessToken,
        messageId,
        userId: user.uid,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get email content: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get email content for multiple messages (batch)
   */
  static async getBatchEmailContent(
    user: AuthUser,
    messages: EmailMessage[]
  ): Promise<EmailMessage[]> {
    const emailsWithContent: EmailMessage[] = [];

    for (const message of messages) {
      try {
        const { htmlContent } = await this.getEmailContent(user, message.id);
        emailsWithContent.push({
          ...message,
          htmlContent,
        });
      } catch (error) {
        console.error(`Failed to get content for email ${message.id}:`, error);
        // Still add the message without content so user knows it failed
        emailsWithContent.push({
          ...message,
          htmlContent: `<html><body><p>Failed to load email content</p></body></html>`,
        });
      }
    }

    return emailsWithContent;
  }

  /**
   * Extract brand from email sender
   */
  static extractBrandFromSender(fromAddress: string): string {
    try {
      // Extract email from "Name <email@domain.com>" format
      const emailMatch = fromAddress.match(/<([^>]+)>/);
      const email = emailMatch ? emailMatch[1] : fromAddress;
      
      // Extract domain
      const domain = email.split('@')[1];
      
      // Extract brand name (remove common TLDs and subdomains)
      const brandMatch = domain.match(/([^.]+)\.(com|org|net|edu|gov|io|co\.uk|co|app)$/);
      
      if (brandMatch) {
        return brandMatch[1];
      }
      
      // Fallback to first part of domain
      return domain.split('.')[0];
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Add brand information to search results
   */
  static addBrandInfo(messages: EmailMessage[]): EmailMessage[] {
    return messages.map(message => ({
      ...message,
      brand: this.extractBrandFromSender(message.from),
    }));
  }
}
