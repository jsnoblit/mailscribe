import { EmailMessage } from '@/types';

// Ultra-simplified screenshot service that removes ALL problematic content
export class UltraStableScreenshotService {
  static async captureUltraStableScreenshot(htmlContent: string, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create iframe
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

          // Ultra-aggressive content cleaning
          const cleanedHtml = this.ultraCleanHtml(htmlContent);
          
          // Write minimal, safe HTML
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                * { 
                  font-family: Arial, sans-serif !important; 
                  max-width: 100% !important;
                  position: static !important;
                }
                body { 
                  margin: 20px !important; 
                  background: white !important; 
                  color: black !important;
                  line-height: 1.4 !important;
                }
                .img-placeholder {
                  display: inline-block;
                  width: 60px;
                  height: 20px;
                  background: #f1f3f4;
                  border: 1px solid #dadce0;
                  text-align: center;
                  font-size: 10px;
                  line-height: 18px;
                  color: #5f6368;
                  margin: 2px;
                  vertical-align: middle;
                }
              </style>
            </head>
            <body>
              ${cleanedHtml}
            </body>
            </html>
          `);
          iframeDoc.close();

          // Wait for layout
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Import html2canvas with minimal settings
          const html2canvas = (await import('html2canvas')).default;
          
          console.log('Taking ultra-stable screenshot...');
          const canvas = await html2canvas(iframeDoc.body, {
            allowTaint: false,
            useCORS: false,
            scale: 1,
            logging: false,
            removeContainer: true,
            backgroundColor: '#ffffff',
            // Skip ALL potentially problematic elements
            ignoreElements: (element) => {
              const tagName = element.tagName.toLowerCase();
              return ['script', 'style', 'link', 'meta', 'iframe', 'object', 'embed'].includes(tagName);
            }
          });

          const screenshot = canvas.toDataURL('image/png');
          document.body.removeChild(iframe);
          resolve(screenshot);
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Failed to load iframe'));
      };

      iframe.src = 'about:blank';
    });
  }

  private static ultraCleanHtml(htmlContent: string): string {
    // Create temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove EVERYTHING that could cause parsing errors
    const problematicElements = tempDiv.querySelectorAll('script, style, link, meta, iframe, object, embed, video, audio');
    problematicElements.forEach(el => el.remove());
    console.log(`Removed ${problematicElements.length} problematic elements`);
    
    // Remove ALL attributes except basic ones
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      // Keep only safe attributes
      const safeAttributes = ['href', 'alt', 'title'];
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (!safeAttributes.includes(attr.name) && !attr.name.startsWith('data-')) {
          el.removeAttribute(attr.name);
        }
      });
    });
    
    // Replace ALL images with text placeholders
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img, index) => {
      const placeholder = document.createElement('span');
      placeholder.className = 'img-placeholder';
      placeholder.textContent = '[img]';
      
      if (img.parentNode) {
        img.parentNode.replaceChild(placeholder, img);
      }
    });
    console.log(`Replaced ${images.length} images with placeholders`);
    
    // Convert complex elements to simple divs
    const complexElements = tempDiv.querySelectorAll('table, tr, td, th, thead, tbody, tfoot');
    complexElements.forEach(el => {
      const div = document.createElement('div');
      div.innerHTML = el.innerHTML;
      if (el.parentNode) {
        el.parentNode.replaceChild(div, el);
      }
    });
    
    console.log('Ultra-clean HTML processing complete');
    return tempDiv.innerHTML;
  }
}
