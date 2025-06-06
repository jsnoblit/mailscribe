import { EmailMessage, ScreenshotOptions, BatchScreenshotResult } from '@/types/email';
import html2canvas from 'html2canvas';

// Frontend screenshot utility using html2canvas
// This handles email screenshots directly in the browser

export class EmailScreenshotService {
  /**
   * Take a screenshot of email HTML content
   */
  static async captureEmailScreenshot(
    htmlContent: string, 
    messageId: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    const {
      filename = `email_${messageId}_${new Date().toISOString().split('T')[0]}.png`,
      quality = 1,
      scale = 2
    } = options;

    // Create a temporary container for the email
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '1200px';
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Set the HTML content
    container.innerHTML = htmlContent;
    
    // Add to DOM temporarily
    document.body.appendChild(container);

    try {
      // Add delay to let images load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Pre-load images before screenshot (skip problematic ones)
      const images = container.querySelectorAll('img');
      const problematicDomains = ['gstatic.com', 'googleusercontent.com', 'githubusercontent.com', 'expedia.com', 'click.'];
      
      const imagePromises = Array.from(images).map((img) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(img);
          } else {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img); // Continue even if image fails
            // Longer timeout to allow proxy loading
            setTimeout(() => resolve(img), 8000);
          }
        });
      });
      
      await Promise.all(imagePromises);
      console.log(`Waited for ${images.length} images to load`);
      
      // Capture screenshot with better image handling
      const canvas = await html2canvas(container, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1200,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // Skip elements that might cause CORS issues
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
        },
        onclone: (clonedDoc) => {
          // Pre-process images in the cloned document
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img, index) => {
            // Handle Gmail proxy images and external images
            if (img.src) {
              let imgSrc = img.src;
              
              // Skip CORS-problematic domains and replace with placeholder
              const problematicDomains = ['gstatic.com', 'googleusercontent.com', 'githubusercontent.com', 'expedia.com', 'click.', 'doubleclick.', 'googlesyndication.'];
              const isProblematic = problematicDomains.some(domain => imgSrc.includes(domain));
              
              if (isProblematic) {
                // Try using a CORS proxy to load the image
                const corsProxies = [
                  'https://api.allorigins.win/raw?url=',
                  'https://cors-anywhere.herokuapp.com/',
                  'https://api.codetabs.com/v1/proxy?quest='
                ];
                
                // Try the first proxy
                const proxyUrl = corsProxies[0] + encodeURIComponent(imgSrc);
                img.src = proxyUrl;
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                  console.log(`Successfully loaded image via proxy: ${imgSrc.substring(0, 50)}...`);
                };
                
                img.onerror = () => {
                  console.warn(`Proxy failed for image, using placeholder: ${imgSrc.substring(0, 50)}...`);
                  // Fallback to placeholder
                  img.style.width = img.width || '100px';
                  img.style.height = img.height || '50px';
                  img.style.backgroundColor = '#f0f0f0';
                  img.style.border = '1px dashed #ccc';
                  img.style.display = 'inline-block';
                  img.alt = '[Image: ' + imgSrc.split('/').pop() + ']';
                  img.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
                      <rect width="100" height="50" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
                      <text x="50" y="25" text-anchor="middle" font-family="Arial" font-size="8" fill="#6c757d">Image</text>
                    </svg>
                  `);
                };
              } else {
                // For non-problematic images, add crossorigin
                img.crossOrigin = 'anonymous';
                img.onerror = () => {
                  // Replace with placeholder on error
                  img.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
                      <rect width="100" height="50" fill="#fff3cd" stroke="#ffeaa7" stroke-width="1"/>
                      <text x="50" y="25" text-anchor="middle" font-family="Arial" font-size="8" fill="#856404">[Image]</text>
                    </svg>
                  `);
                };
              }
            }
          });
          
          // Also handle background images
          const elementsWithBgImages = clonedDoc.querySelectorAll('[style*="background-image"]');
          elementsWithBgImages.forEach((element) => {
            const style = element.style;
            if (style.backgroundImage && style.backgroundImage.includes('url(')) {
              // Remove background images that might cause CORS issues
              style.backgroundImage = 'none';
            }
          });
        }
      });

      // Convert to blob and download
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve(url);
          } else {
            reject(new Error('Failed to create screenshot blob'));
          }
        }, 'image/png', quality);
      });
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  /**
   * Batch process multiple email screenshots
   */
  static async batchCaptureScreenshots(
    emails: EmailMessage[]
  ): Promise<BatchScreenshotResult> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const email of emails) {
      try {
        const filename = `${email.brand || 'unknown'}_${email.id}_${new Date().toISOString().split('T')[0]}.png`;
        await this.captureEmailScreenshot(email.htmlContent, email.id, { filename });
        success.push(email.id);
        
        // Add small delay between screenshots
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to screenshot email ${email.id}:`, error);
        failed.push(email.id);
      }
    }

    return { success, failed };
  }

  /**
   * Create a ZIP file of multiple screenshots (requires JSZip)
   */
  static async createScreenshotZip(
    emails: EmailMessage[],
    zipFilename: string = `email_screenshots_${new Date().toISOString().split('T')[0]}.zip`
  ): Promise<void> {
    try {
      // Dynamic import JSZip
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      for (const email of emails) {
        try {
          if (!email.htmlContent) {
            console.warn(`Skipping email ${email.id} - no HTML content`);
            continue;
          }

          // Create container
          const container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.top = '-9999px';
          container.style.left = '-9999px';
          container.style.width = '1200px';
          container.style.backgroundColor = 'white';
          container.style.padding = '20px';
          container.style.fontFamily = 'Arial, sans-serif';
          container.innerHTML = email.htmlContent;
          document.body.appendChild(container);

          // Add delay to let images load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Pre-load images before screenshot (skip problematic ones)
        const images = container.querySelectorAll('img');
        const problematicDomains = ['gstatic.com', 'googleusercontent.com', 'githubusercontent.com', 'expedia.com', 'click.'];
        
        const imagePromises = Array.from(images).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve(img);
            } else {
              img.onload = () => resolve(img);
              img.onerror = () => resolve(img); // Continue even if image fails
              // Longer timeout to allow proxy loading
              setTimeout(() => resolve(img), 8000);
            }
          });
        });
        
        await Promise.all(imagePromises);
        console.log(`Waited for ${images.length} images to load`);
        
        // Capture screenshot with better image handling
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 1200,
            scrollX: 0,
            scrollY: 0,
            logging: false,
            imageTimeout: 15000,
            onclone: (clonedDoc) => {
              // Handle images in the cloned document
              const images = clonedDoc.querySelectorAll('img');
              images.forEach((img, index) => {
                if (img.src) {
                  // Handle different types of images
                  let imgSrc = img.src;
                  
                  // Skip CORS-problematic domains and replace with placeholder
                  const problematicDomains = ['gstatic.com', 'googleusercontent.com', 'githubusercontent.com', 'expedia.com', 'click.', 'doubleclick.', 'googlesyndication.'];
                  const isProblematic = problematicDomains.some(domain => imgSrc.includes(domain));
                  
                  if (isProblematic) {
                    // Try using a CORS proxy to load the image
                    const corsProxies = [
                      'https://api.allorigins.win/raw?url=',
                      'https://cors-anywhere.herokuapp.com/',
                      'https://api.codetabs.com/v1/proxy?quest='
                    ];
                    
                    // Try the first proxy
                    const proxyUrl = corsProxies[0] + encodeURIComponent(imgSrc);
                    img.src = proxyUrl;
                    img.crossOrigin = 'anonymous';
                    
                    img.onload = () => {
                      console.log(`Successfully loaded image via proxy: ${imgSrc.substring(0, 50)}...`);
                    };
                    
                    img.onerror = () => {
                      console.warn(`Proxy failed for image, using placeholder: ${imgSrc.substring(0, 50)}...`);
                      // Fallback to placeholder
                      img.style.width = img.width || '100px';
                      img.style.height = img.height || '50px';
                      img.style.backgroundColor = '#f0f0f0';
                      img.style.border = '1px dashed #ccc';
                      img.style.display = 'inline-block';
                      img.alt = '[Image: ' + imgSrc.split('/').pop() + ']';
                      img.src = 'data:image/svg+xml;base64,' + btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
                          <rect width="100" height="50" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
                          <text x="50" y="25" text-anchor="middle" font-family="Arial" font-size="8" fill="#6c757d">Image</text>
                        </svg>
                      `);
                    };
                  } else {
                    // For non-problematic images, add crossorigin
                    img.crossOrigin = 'anonymous';
                    img.onload = () => console.log(`Image ${index} loaded successfully`);
                    img.onerror = () => {
                      console.warn(`Image ${index} failed to load, using placeholder`);
                      // Replace with placeholder on error
                      img.src = 'data:image/svg+xml;base64,' + btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
                          <rect width="100" height="50" fill="#fff3cd" stroke="#ffeaa7" stroke-width="1"/>
                          <text x="50" y="25" text-anchor="middle" font-family="Arial" font-size="8" fill="#856404">[Image]</text>
                        </svg>
                      `);
                    };
                  }
                }
              });
              
              // Handle CSS background images
              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach((element) => {
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
                  // Keep background images but add fallback
                  element.style.backgroundSize = 'contain';
                  element.style.backgroundRepeat = 'no-repeat';
                }
              });
            }
          });

          // Convert to blob
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            }, 'image/png', 1);
          });

          // Add to ZIP with safe filename
          const safeSubject = email.subject?.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50) || 'untitled';
          const filename = `${email.brand || 'unknown'}_${safeSubject.replace(/\s+/g, '_')}_${email.id}.png`;
          zip.file(filename, blob);

          // Clean up
          document.body.removeChild(container);
        } catch (error) {
          console.error(`Failed to add ${email.id} to ZIP:`, error);
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      throw new Error('Failed to create ZIP file');
    }
  }
}
