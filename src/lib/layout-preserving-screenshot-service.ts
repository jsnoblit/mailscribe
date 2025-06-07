import { EmailMessage } from '@/types';

// Layout-preserving screenshot service that maintains original email structure
export class LayoutPreservingScreenshotService {
  static async captureLayoutPreservingScreenshot(htmlContent: string, filename: string): Promise<string> {
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

          // Preserve layout while cleaning dangerous elements
          const layoutPreservedHtml = this.preserveLayoutAndClean(htmlContent);
          
          // Write HTML that maintains original email styling
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                /* Preserve original email layout styling */
                body { 
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #f5f5f5 !important;
                  font-family: Arial, sans-serif !important;
                  line-height: 1.4 !important;
                  width: 100% !important;
                }
                
                /* Preserve table-based layouts */
                table { 
                  border-collapse: collapse !important;
                  mso-table-lspace: 0pt !important;
                  mso-table-rspace: 0pt !important;
                }
                
                /* Preserve cell structure */
                td, th {
                  border-collapse: collapse !important;
                  vertical-align: top !important;
                }
                
                /* Preserve widths and centering */
                .email-container, [role="banner"], [role="main"], [role="contentinfo"] {
                  width: 100% !important;
                  max-width: 600px !important;
                  margin: 0 auto !important;
                }
                
                /* Preserve centered content */
                center, .center {
                  width: 100% !important;
                  text-align: center !important;
                }
                
                /* Image placeholder styling that matches original spacing */
                .img-placeholder {
                  display: inline-block;
                  background: #f0f0f0;
                  border: 1px dashed #ccc;
                  padding: 4px 8px;
                  font-size: 11px;
                  color: #666;
                  text-align: center;
                  vertical-align: middle;
                  font-family: Arial, sans-serif;
                  border-radius: 3px;
                }
                
                /* Enhanced button styling - ONLY for actual buttons */
                .enhanced-button {
                  display: inline-block !important;
                  background-color: #0066cc !important;
                  color: white !important;
                  padding: 4px 8px !important;
                  border-radius: 3px !important;
                  text-decoration: none !important;
                  font-weight: 500 !important;
                  border: none !important;
                  text-align: center !important;
                  font-size: 12px !important;
                  line-height: 1.2 !important;
                  width: auto !important;
                  height: auto !important;
                }
                
                /* Style all buttons consistently regardless of background color */
                a[style*="background"], button, input[type="button"], input[type="submit"] {
                  font-size: 12px !important;
                  padding: 4px 8px !important;
                  border-radius: 3px !important;
                  line-height: 1.2 !important;
                }
                
                /* Preserve table-based button layouts */
                td[role="button"], td.button {
                  background-color: #0066cc !important;
                  border-radius: 3px !important;
                  text-align: center !important;
                  font-size: 12px !important;
                }
                
                td[role="button"] a, td.button a {
                  color: white !important;
                  text-decoration: none !important;
                  display: block !important;
                  padding: 4px 8px !important;
                  font-weight: 500 !important;
                  font-size: 12px !important;
                }
                
                /* Only override dangerous positioning */
                * {
                  position: static !important;
                  transform: none !important;
                  animation: none !important;
                  transition: none !important;
                }
                
                /* Preserve important layout properties */
                [style*="width:"], [width] {
                  /* Keep widths for layout */
                }
                
                [style*="height:"], [height] {
                  /* Keep heights for layout */
                }
                
                [style*="margin:"], [style*="padding:"] {
                  /* Keep spacing */
                }
                
                [style*="text-align:"], [align] {
                  /* Keep text alignment */
                }
              </style>
            </head>
            <body>
              ${layoutPreservedHtml}
            </body>
            </html>
          `);
          iframeDoc.close();

          // Wait for layout to settle
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Import html2canvas with layout-friendly settings
          const html2canvas = (await import('html2canvas')).default;
          
          console.log('Taking layout-preserving screenshot...');
          const canvas = await html2canvas(iframeDoc.body, {
            allowTaint: false,
            useCORS: false,
            scale: 1.5,
            logging: false,
            removeContainer: true,
            backgroundColor: null, // Preserve original background
            width: 1200,
            height: Math.max(800, iframeDoc.body.scrollHeight),
            // Only ignore truly problematic elements
            ignoreElements: (element) => {
              const tagName = element.tagName.toLowerCase();
              return ['script', 'iframe', 'object', 'embed', 'video', 'audio'].includes(tagName);
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

  private static preserveLayoutAndClean(htmlContent: string): string {
    // Create temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove only the most dangerous elements (keep layout elements)
    const dangerousElements = tempDiv.querySelectorAll('script, iframe, object, embed, video, audio');
    dangerousElements.forEach(el => el.remove());
    console.log(`Removed ${dangerousElements.length} dangerous elements`);
    
    // Handle buttons and links with much more selective styling
    const potentialButtons = tempDiv.querySelectorAll('a, [role="button"], .button, .btn, .cta');
    let buttonCount = 0;
    
    potentialButtons.forEach((element, index) => {
      const style = element.getAttribute('style') || '';
      const className = element.getAttribute('class') || '';
      const text = (element.textContent || '').trim().toLowerCase();
      const href = element.getAttribute('href') || '';
      
      // Much more selective button detection
      const hasButtonStyling = style.includes('background-color') && 
                               (style.includes('padding') || style.includes('border-radius'));
      
      const hasButtonClass = className.includes('button') || 
                            className.includes('btn') || 
                            className.includes('cta');
      
      const hasButtonRole = element.getAttribute('role') === 'button';
      
      // Very specific button text patterns (action words)
      const isButtonText = [
        'view', 'download', 'manage', 'find', 'book', 'reserve',
        'cancel', 'confirm', 'add', 'get', 'start', 'continue',
        'shop', 'buy', 'purchase', 'order', 'subscribe', 'join',
        'sign up', 'log in', 'contact', 'call', 'email'
      ].some(buttonWord => text.includes(buttonWord));
      
      // Don't style regular navigation links or email addresses
      const isNavigationLink = href.includes('mailto:') || 
                              href.includes('tel:') || 
                              text.includes('@') ||
                              text.includes('phone') ||
                              text.includes('email') ||
                              text.includes('contact') ||
                              text.length > 30; // Long text is probably not a button
      
      // Only style if it's clearly a button AND not a navigation link
      const isActualButton = (hasButtonStyling || hasButtonClass || hasButtonRole || isButtonText) && 
                            !isNavigationLink;
      
      if (isActualButton) {
        element.setAttribute('class', (className + ' enhanced-button').trim());
        buttonCount++;
      }
    });
    
    console.log(`Enhanced ${buttonCount} actual buttons (filtered from ${potentialButtons.length} candidates)`);
    
    // Clean only dangerous inline styles, preserve layout styles
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      const style = el.getAttribute('style');
      if (style) {
        // Remove only positioning and animation properties that cause issues
        let cleanStyle = style
          .replace(/position\s*:\s*(fixed|absolute|sticky)[^;]*;?/gi, '')
          .replace(/transform\s*:\s*[^;]+;?/gi, '')
          .replace(/animation\s*:\s*[^;]+;?/gi, '')
          .replace(/transition\s*:\s*[^;]+;?/gi, '')
          .replace(/@import[^;]+;?/gi, '')
          .replace(/javascript:[^;]+;?/gi, '')
          .replace(/expression\\([^)]+\\)/gi, '');
        
        // Keep all other styling (width, height, colors, margins, padding, etc.)
        if (cleanStyle.trim()) {
          el.setAttribute('style', cleanStyle);
        } else {
          el.removeAttribute('style');
        }
      }
      
      // Remove only event handlers, keep all other attributes
      const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'];
      dangerousAttrs.forEach(attr => el.removeAttribute(attr));
    });
    
    // Handle images while preserving layout dimensions
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img, index) => {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const width = img.getAttribute('width') || img.style.width || '';
      const height = img.getAttribute('height') || img.style.height || '';
      
      // Replace external/problematic images with layout-preserving placeholders
      if (src.startsWith('http') || src.startsWith('cid:') || src === '') {
        const placeholder = document.createElement('span');
        placeholder.className = 'img-placeholder';
        
        // Use descriptive text from alt attribute
        const displayText = alt ? `[${alt.substring(0, 30)}]` : '[img]';
        placeholder.textContent = displayText;
        
        // Preserve original dimensions to maintain layout
        let placeholderStyle = '';
        if (width) {
          const w = width.toString();
          placeholderStyle += `width: ${w.includes('px') || w.includes('%') ? w : w + 'px'};`;
        }
        if (height) {
          const h = height.toString();
          placeholderStyle += `height: ${h.includes('px') || h.includes('%') ? h : h + 'px'};`;
          placeholderStyle += `line-height: ${h.includes('px') || h.includes('%') ? h : h + 'px'};`;
        }
        
        // Preserve any existing styling
        const existingStyle = img.getAttribute('style') || '';
        if (existingStyle) {
          // Keep layout-related styles
          const layoutStyles = existingStyle.match(/(display|float|margin|padding|border)[^;]*;/gi);
          if (layoutStyles) {
            placeholderStyle += layoutStyles.join('');
          }
        }
        
        if (placeholderStyle) {
          placeholder.setAttribute('style', placeholderStyle);
        }
        
        if (img.parentNode) {
          img.parentNode.replaceChild(placeholder, img);
        }
      } else {
        // Keep safe images but make them secure
        img.removeAttribute('onerror');
        img.removeAttribute('onload');
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
    console.log(`Processed ${images.length} images while preserving layout`);
    
    // Only remove style tags that contain dangerous CSS
    const styles = tempDiv.querySelectorAll('style');
    styles.forEach(style => {
      const cssText = style.textContent || '';
      // Only remove styles with dangerous content
      if (cssText.includes('javascript:') || 
          cssText.includes('expression(') ||
          cssText.includes('@import url(')) {
        style.remove();
      }
      // Keep all other CSS for layout preservation
    });
    
    console.log('Layout-preserving HTML processing complete');
    return tempDiv.innerHTML;
  }
}
