import html2canvas from 'html2canvas';

export class RawScreenshotService {
  private static CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
  ];

  private static async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private static async proxyImage(src: string): Promise<string> {
    for (const proxy of this.CORS_PROXIES) {
      const proxyUrl = `${proxy}${encodeURIComponent(src)}`;
      try {
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const blob = await response.blob();
          return await this.blobToDataUrl(blob);
        }
      } catch (error) {
        console.warn(`Proxy ${proxy} failed for ${src}:`, error);
      }
    }
    throw new Error(`All proxies failed for image: ${src}`);
  }

  static async captureRawScreenshot(htmlContent: string, filename: string): Promise<string> {
    // Create a temporary div to modify the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Find all images and attempt to proxy them
    const images = Array.from(tempDiv.querySelectorAll('img'));
    await Promise.all(
      images.map(async (img) => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('http')) {
          try {
            const dataUrl = await this.proxyImage(src);
            img.src = dataUrl;
            img.setAttribute('crossorigin', 'anonymous');
          } catch (error) {
            console.warn(`Could not load image ${src}:`, error);
            // Optional: replace with a placeholder if it fails
            img.alt = `[Image not loaded: ${src}]`;
          }
        }
      })
    );

    const processedHtml = tempDiv.innerHTML;

    return new Promise(async (resolve, reject) => {
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

          // Directly write the PROCESSED HTML content
          iframeDoc.open();
          iframeDoc.write(processedHtml);
          iframeDoc.close();

          // Force styles to fix alignment issues, since email styles are unpredictable
          const style = iframeDoc.createElement('style');
          style.textContent = `
            td, th, tr, span, div, a {
              vertical-align: middle !important;
            }
            img {
              vertical-align: middle !important;
            }
            a[role="button"], .button-like {
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
          `;
          iframeDoc.head.appendChild(style);

          // Wait for images and layout to settle
          await new Promise(r => setTimeout(r, 2000));

          console.log('Taking raw screenshot...');
          const canvas = await html2canvas(iframeDoc.body, {
            allowTaint: true,
            useCORS: true,
            logging: false,
            background: '#ffffff',
            width: 1200,
            height: Math.max(800, iframeDoc.body.scrollHeight),
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
        reject(new Error('Failed to load iframe content'));
      };

      iframe.src = 'about:blank';
    });
  }
} 