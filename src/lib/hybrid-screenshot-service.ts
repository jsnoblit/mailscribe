import { EmailMessage } from '@/types';
import { preprocessHtmlForScreenshotWithImages, preprocessHtmlWithImageHandling } from './enhanced-image-utils';

interface HybridScreenshotResult {
  success: string[];
  failed: string[];
  warnings: string[];
}

export class HybridScreenshotService {
  private static FIREBASE_FUNCTIONS_URL = 'https://us-central1-mailscribe-ae722.cloudfunctions.net';

  /**
   * Attempts multiple screenshot methods in order of preference
   */
  static async generateScreenshotWithFallback(
    email: EmailMessage,
    accessToken: string
  ): Promise<{ success: boolean; screenshot?: string; filename?: string; error?: string }> {
    // For now, skip server methods and focus on reliable client-side processing
    const methods = [
      () => this.tryEnhancedClientScreenshot(email, accessToken),
      () => this.tryBasicClientScreenshot(email),
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`Attempting screenshot method ${i + 1} for email ${email.id}`);
        const result = await methods[i]();
        if (result.success) {
          console.log(`Screenshot method ${i + 1} succeeded for email ${email.id}`);
          return result;
        }
      } catch (error) {
        console.warn(`Screenshot method ${i + 1} failed for email ${email.id}:`, error);
        if (i === methods.length - 1) {
          return {
            success: false,
            error: `All screenshot methods failed. Last error: ${error.message}`,
          };
        }
      }
    }

    return {
      success: false,
      error: 'All screenshot methods failed',
    };
  }

  /**
   * Method 1: Try the reliable server screenshot (returns HTML for client processing)
   */
  private static async tryReliableServerScreenshot(
    email: EmailMessage,
    accessToken: string
  ): Promise<{ success: boolean; screenshot?: string; filename?: string; error?: string }> {
    try {
      const response = await fetch('/api/server-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          messageId: email.id,
          brand: email.brand || 'unknown',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server screenshot API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        throw new Error(`Server screenshot failed: ${response.status} - ${errorData.error || errorText || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Reliable server screenshot response:', data);
      
      if (data.htmlContent) {
        // Process the HTML content client-side
        const screenshot = await this.htmlToScreenshot(data.htmlContent);
        return {
          success: true,
          screenshot,
          filename: data.filename,
        };
      }

      throw new Error(`No HTML content returned from server. Response: ${JSON.stringify(data)}`);
    } catch (error) {
      console.warn('Reliable server screenshot failed:', error.message);
      throw error;
    }
  }

  /**
   * Method 2: Enhanced client-side screenshot with server-processed HTML
   */
  private static async tryEnhancedClientScreenshot(
    email: EmailMessage,
    accessToken: string
  ): Promise<{ success: boolean; screenshot?: string; filename?: string; error?: string }> {
    try {
      // Get enhanced HTML from server via our API route
      const response = await fetch('/api/hybrid-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          messageIds: [email.id],
          brand: email.brand || 'unknown',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Enhanced client screenshot failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Enhanced client screenshot response:', data);
      
      if (data.emails && data.emails.length > 0) {
        const emailData = data.emails[0];
        const screenshot = await this.htmlToScreenshot(emailData.htmlContent);
        return {
          success: true,
          screenshot,
          filename: emailData.filename,
        };
      }

      throw new Error(`No email data returned from enhanced client method. Response: ${JSON.stringify(data)}`);
    } catch (error) {
      console.warn('Enhanced client screenshot failed:', error.message);
      throw error;
    }
  }

  /**
   * Method 3: Basic client-side screenshot using existing email content
   */
  private static async tryBasicClientScreenshot(
    email: EmailMessage
  ): Promise<{ success: boolean; screenshot?: string; filename?: string; error?: string }> {
    if (!email.htmlContent) {
      throw new Error('No HTML content available for basic screenshot');
    }

    const screenshot = await this.htmlToScreenshot(email.htmlContent);
    const filename = `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`;
    
    return {
      success: true,
      screenshot,
      filename,
    };
  }

  /**
   * Convert HTML content to screenshot using html2canvas
   */
  private static async htmlToScreenshot(htmlContent: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      // Create a temporary iframe to render the email
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '800px';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      iframe.onload = async () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            throw new Error('Could not access iframe document');
          }

          // Enhanced preprocessing to handle images properly
          let processedHtml;
          try {
            // Try the advanced image handling first
            processedHtml = await preprocessHtmlWithImageHandling(htmlContent);
            console.log('Used advanced image processing');
          } catch (error) {
            console.warn('Advanced image processing failed, using simple method:', error);
            // Fallback to simpler image optimization
            processedHtml = preprocessHtmlForScreenshotWithImages(htmlContent);
          }
          
          // Write the processed HTML content
          iframeDoc.open();
          iframeDoc.write(processedHtml);
          iframeDoc.close();

          // Wait for all content to load and settle
          console.log('Waiting for content to load and stabilize...');
          await new Promise(resolve => setTimeout(resolve, 4000));
          
          // Make sure all async operations are complete before screenshot
          console.log('Starting screenshot capture...');

          // Dynamically import html2canvas
          const html2canvas = (await import('html2canvas')).default;
          
          // Capture screenshot with stable, safe settings
          const canvas = await html2canvas(iframeDoc.body, {
            allowTaint: true,
            useCORS: false, // Disable CORS to avoid conflicts
            scale: 1.5,
            width: 1200,
            height: Math.max(800, iframeDoc.body.scrollHeight),
            logging: false,
            // Shorter timeout to avoid conflicts
            imageTimeout: 2000,
            removeContainer: true,
            backgroundColor: '#ffffff',
            // Ignore problematic elements that cause parsing errors
            ignoreElements: (element) => {
              // Skip elements that commonly cause CSS parsing issues
              if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
                return true;
              }
              // Skip elements with complex CSS that might cause parsing errors
              const style = getComputedStyle(element);
              if (style.position === 'fixed' || style.position === 'sticky') {
                return true;
              }
              return false;
            }
          });

          // Convert to base64
          const screenshot = canvas.toDataURL('image/png');
          
          // Clean up
          document.body.removeChild(iframe);
          
          console.log('Screenshot captured successfully');
          resolve(screenshot);
        } catch (error) {
          document.body.removeChild(iframe);
          console.error('Screenshot generation error:', error);
          reject(error);
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Failed to load iframe'));
      };

      // Start loading
      iframe.src = 'about:blank';
    });
  }

  /**
   * Batch screenshot generation with hybrid approach
   */
  static async batchHybridScreenshots(
    emails: EmailMessage[],
    accessToken: string,
    onProgress?: (progress: number, current: string) => void
  ): Promise<HybridScreenshotResult> {
    const result: HybridScreenshotResult = {
      success: [],
      failed: [],
      warnings: [],
    };

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      if (onProgress) {
        onProgress((i / emails.length) * 100, `Processing: ${email.subject || email.id}`);
      }

      try {
        const screenshotResult = await this.generateScreenshotWithFallback(email, accessToken);
        
        if (screenshotResult.success && screenshotResult.screenshot && screenshotResult.filename) {
          // Download the screenshot
          await this.downloadScreenshot(screenshotResult.screenshot, screenshotResult.filename);
          result.success.push(email.id);
        } else {
          result.failed.push(email.id);
          if (screenshotResult.error) {
            result.warnings.push(`${email.id}: ${screenshotResult.error}`);
          }
        }
      } catch (error) {
        result.failed.push(email.id);
        result.warnings.push(`${email.id}: ${error.message}`);
      }
    }

    if (onProgress) {
      onProgress(100, 'Complete!');
    }

    return result;
  }

  /**
   * Download a screenshot
   */
  private static async downloadScreenshot(dataUrl: string, filename: string): Promise<void> {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Create ZIP file with hybrid screenshots
   */
  static async createHybridScreenshotZip(
    emails: EmailMessage[],
    accessToken: string,
    zipFilename: string,
    onProgress?: (progress: number, current: string) => void
  ): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    let successCount = 0;
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      if (onProgress) {
        onProgress((i / emails.length) * 90, `Processing: ${email.subject || email.id}`);
      }

      try {
        const screenshotResult = await this.generateScreenshotWithFallback(email, accessToken);
        
        if (screenshotResult.success && screenshotResult.screenshot && screenshotResult.filename) {
          // Convert data URL to blob
          const response = await fetch(screenshotResult.screenshot);
          const blob = await response.blob();
          
          zip.file(screenshotResult.filename, blob);
          successCount++;
        }
      } catch (error) {
        console.warn(`Failed to add ${email.id} to ZIP:`, error);
      }
    }

    if (onProgress) {
      onProgress(95, 'Creating ZIP file...');
    }

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Download ZIP
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onProgress) {
      onProgress(100, `Complete! Downloaded ${successCount} screenshots`);
    }
  }
}
