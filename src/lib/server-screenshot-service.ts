import { EmailMessage, ScreenshotOptions, BatchScreenshotResult } from '@/types/email';

export class ServerScreenshotService {
  /**
   * Generate screenshot using server-side rendering (no CORS issues)
   */
  static async captureServerScreenshot(
    messageId: string,
    accessToken: string,
    brand?: string,
    filename?: string
  ): Promise<string> {
    try {
      const response = await fetch('/api/server-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          messageId,
          brand: brand || 'unknown',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server screenshot failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.screenshot) {
        throw new Error('Invalid response from server screenshot service');
      }

      // Convert base64 to blob and download
      const binaryString = atob(data.screenshot);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      
      // Auto-download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return url;
    } catch (error) {
      console.error('Server screenshot error:', error);
      throw error;
    }
  }

  /**
   * Batch generate screenshots using server-side rendering
   */
  static async batchServerScreenshots(
    emails: EmailMessage[],
    accessToken: string
  ): Promise<BatchScreenshotResult> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const email of emails) {
      try {
        await this.captureServerScreenshot(
          email.id,
          accessToken,
          email.brand,
          `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_')}_${email.id}.png`
        );
        success.push(email.id);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Server screenshot failed for email ${email.id}:`, error);
        failed.push(email.id);
      }
    }

    return { success, failed };
  }

  /**
   * Create ZIP of server-generated screenshots
   */
  static async createServerScreenshotZip(
    emails: EmailMessage[],
    accessToken: string,
    zipFilename?: string
  ): Promise<void> {
    try {
      // Dynamic import JSZip
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      for (const email of emails) {
        try {
          // Get screenshot from server
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

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.screenshot) {
              // Convert base64 to blob
              const binaryString = atob(data.screenshot);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'image/png' });
              
              // Add to ZIP
              const safeSubject = email.subject?.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50) || 'untitled';
              const filename = `${email.brand || 'unknown'}_${safeSubject.replace(/\s+/g, '_')}_${email.id}.png`;
              zip.file(filename, blob);
              
              console.log(`Added ${filename} to ZIP`);
            }
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to add ${email.id} to ZIP:`, error);
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename || `server_screenshots_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating server screenshot ZIP:', error);
      throw new Error('Failed to create ZIP file');
    }
  }
}
