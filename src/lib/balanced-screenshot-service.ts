import { EmailMessage } from '@/types';

// Balanced screenshot service that preserves structure while avoiding errors
export class BalancedScreenshotService {
  static async captureBalancedScreenshot(htmlContent: string, filename: string): Promise<string> {
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

          // Balanced content cleaning - preserve structure, remove problematic elements
          const cleanedHtml = this.balancedCleanHtml(htmlContent);
          
          // Write well-structured HTML
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                /* Preserved email styling with safety overrides */
                body { 
                  font-family: Arial, sans-serif;
                  line-height: 1.4;
                  margin: 20px;
                  background: white;
                  color: black;
                  max-width: 1160px;
                  overflow-x: hidden;
                }
                
                /* Preserve table layouts */
                table { 
                  border-collapse: collapse;
                  max-width: 100%;
                  width: auto;
                }
                
                td, th {
                  padding: 8px;
                  vertical-align: top;
                  border: 1px solid #ddd;
                }
                
                /* Preserve text formatting */
                h1, h2, h3, h4, h5, h6 {
                  margin: 10px 0;
                  line-height: 1.2;
                }
                
                p {
                  margin: 8px 0;
                }
                
                /* Safe image handling */
                .img-placeholder {
                  display: inline-block;
                  background: #f8f9fa;
                  border: 1px solid #dadce0;
                  padding: 4px 8px;
                  font-size: 11px;
                  color: #5f6368;
                  margin: 2px;
                  border-radius: 3px;
                }
                
                /* Preserve basic formatting */
                strong, b { font-weight: bold; }
                em, i { font-style: italic; }
                u { text-decoration: underline; }
                
                /* Safe overrides for problematic properties */
                * {
                  position: static !important;
                  transform: none !important;
                  animation: none !important;
                  transition: none !important;
                  max-width: 100% !important;
                }
                
                /* Preserve colors and backgrounds that are inline */
                [style*="color:"], [style*="background"] {
                  /* Allow basic color styling */
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
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Import html2canvas with balanced settings
          const html2canvas = (await import('html2canvas')).default;
          
          console.log('Taking balanced screenshot...');
          const canvas = await html2canvas(iframeDoc.body, {
            allowTaint: false,
            useCORS: false,
            scale: 1.5,
            logging: false,
            removeContainer: true,
            backgroundColor: '#ffffff',
            // Only skip the most problematic elements
            ignoreElements: (element) => {
              const tagName = element.tagName.toLowerCase();
              return ['script', 'iframe', 'object', 'embed'].includes(tagName);
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

  private static balancedCleanHtml(htmlContent: string): string {
    // Create temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove only the most problematic elements
    const problematicElements = tempDiv.querySelectorAll('script, iframe, object, embed, video, audio');
    problematicElements.forEach(el => el.remove());
    console.log(`Removed ${problematicElements.length} problematic elements`);
    
    // Clean up dangerous inline styles but preserve basic formatting
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      const style = el.getAttribute('style');
      if (style) {
        // Remove only problematic CSS properties
        let cleanStyle = style
          .replace(/position\s*:\s*[^;]+;?/gi, '')
          .replace(/transform\s*:\s*[^;]+;?/gi, '')
          .replace(/animation\s*:\s*[^;]+;?/gi, '')
          .replace(/transition\s*:\s*[^;]+;?/gi, '')
          .replace(/@import[^;]+;?/gi, '')
          .replace(/javascript:[^;]+;?/gi, '');
        
        if (cleanStyle.trim()) {
          el.setAttribute('style', cleanStyle);
        } else {
          el.removeAttribute('style');
        }
      }
      
      // Remove dangerous event handlers
      const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'];
      dangerousAttrs.forEach(attr => el.removeAttribute(attr));
    });
    
    // Handle images with better placeholders
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img, index) => {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      
      // Replace problematic images but preserve layout
      if (src.startsWith('http') || src.startsWith('cid:') || src === '') {
        const placeholder = document.createElement('span');
        placeholder.className = 'img-placeholder';
        
        // Use alt text if available, otherwise generic placeholder
        placeholder.textContent = alt ? `[${alt.substring(0, 20)}]` : '[img]';
        
        // Try to preserve width/height for layout
        const width = img.getAttribute('width') || img.style.width;
        const height = img.getAttribute('height') || img.style.height;
        
        if (width) placeholder.style.width = width.includes('px') ? width : width + 'px';
        if (height) placeholder.style.minHeight = height.includes('px') ? height : height + 'px';
        
        if (img.parentNode) {
          img.parentNode.replaceChild(placeholder, img);
        }
      } else {
        // Keep data URLs and relative images, but make them safe
        img.removeAttribute('onerror');
        img.removeAttribute('onload');
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
    console.log(`Processed ${images.length} images`);
    
    // Remove only truly problematic style tags (keep basic CSS)
    const styles = tempDiv.querySelectorAll('style');
    styles.forEach(style => {
      const cssText = style.textContent || '';
      if (cssText.includes('@import') || 
          cssText.includes('position:fixed') || 
          cssText.includes('position:absolute') ||
          cssText.includes('javascript:') ||
          cssText.includes('expression(')) {
        style.remove();
      }
    });
    
    console.log('Balanced HTML processing complete');
    return tempDiv.innerHTML;
  }
}
