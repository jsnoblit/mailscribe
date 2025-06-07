// Enhanced image handling for client-side screenshots with actual image rendering
export async function preprocessHtmlWithImageHandling(htmlContent: string): Promise<string> {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Find all images
  const images = tempDiv.querySelectorAll('img');
  console.log(`Found ${images.length} images to process for client-side rendering`);
  
  // Process each image sequentially to avoid DOM conflicts
  for (let index = 0; index < images.length; index++) {
    const img = images[index];
    
    // Skip if image has already been processed/removed
    if (!img.parentNode) {
      console.log(`Skipping image ${index + 1} - already processed`);
      continue;
    }
    
    const src = img.getAttribute('src') || img.src || '';
    console.log(`Processing image ${index + 1}: ${src}`);
    
    try {
      // For Gmail embedded images (cid:) and other problematic URLs
      if (src.startsWith('cid:') || src === '' || !src) {
        console.log(`Replacing embedded/empty image: ${src}`);
        replaceWithPlaceholder(img, '[img]');
        continue;
      }
      
      // For external images, try to load them properly
      if (src.startsWith('http')) {
        await handleExternalImage(img, src);
        continue;
      }
      
      // For relative URLs or data URLs, keep as-is
      console.log(`Keeping image as-is: ${src}`);
      
    } catch (error) {
      console.warn(`Failed to process image ${src}:`, error);
      // Only replace if the image still exists
      if (img.parentNode) {
        replaceWithPlaceholder(img, '[img]');
      }
    }
  }
  
  const result = tempDiv.innerHTML;
  console.log('Enhanced HTML processing complete');
  return result;
}

async function handleExternalImage(img: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve) => {
    // Create a test image to check if it loads
    const testImg = new Image();
    
    // Set up CORS handling
    testImg.crossOrigin = 'anonymous';
    
    testImg.onload = () => {
      console.log(`Image loaded successfully: ${src}`);
      // Image loads fine, keep the original
      img.setAttribute('crossorigin', 'anonymous');
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      resolve();
    };
    
    testImg.onerror = () => {
      console.log(`Image failed to load, trying proxy: ${src}`);
      // Try using a CORS proxy for external images
      tryImageProxy(img, src).then(resolve);
    };
    
    // Start loading the test image
    testImg.src = src;
    
    // Timeout after 3 seconds
    setTimeout(() => {
      console.log(`Image loading timeout: ${src}`);
      tryImageProxy(img, src).then(resolve);
    }, 3000);
  });
}

async function tryImageProxy(img: HTMLImageElement, originalSrc: string): Promise<void> {
  // Check if image still exists before processing
  if (!img.parentNode) {
    console.log('Image no longer exists, skipping proxy attempt');
    return;
  }
  
  // List of CORS proxy services to try
  const corsProxies = [
    `https://cors-anywhere.herokuapp.com/${originalSrc}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(originalSrc)}`,
    `https://corsproxy.io/?${encodeURIComponent(originalSrc)}`,
  ];
  
  for (const proxyUrl of corsProxies) {
    try {
      // Check again if image still exists
      if (!img.parentNode) {
        console.log('Image removed during proxy attempt');
        return;
      }
      
      console.log(`Trying proxy: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        
        // Final check before updating
        if (img.parentNode) {
          console.log(`Successfully proxied image: ${originalSrc}`);
          img.src = dataUrl;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          return;
        }
      }
    } catch (error) {
      console.warn(`Proxy failed: ${proxyUrl}`, error);
    }
  }
  
  // If all proxies fail, replace with placeholder (only if image still exists)
  if (img.parentNode) {
    console.log(`All proxies failed for: ${originalSrc}`);
    replaceWithPlaceholder(img, '[img]');
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function replaceWithPlaceholder(img: HTMLImageElement, text: string): void {
  // Check if the image still has a parent before trying to replace
  if (!img.parentNode) {
    console.warn('Image has no parent node, skipping replacement');
    return;
  }
  
  const placeholder = document.createElement('div');
  placeholder.style.cssText = `
    width: ${img.width || img.getAttribute('width') || 100}px;
    height: ${img.height || img.getAttribute('height') || 30}px;
    background: #f8f9fa;
    border: 1px solid #e8eaed;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #5f6368;
    font-family: Arial, sans-serif;
    margin: 2px;
  `;
  placeholder.textContent = text;
  
  try {
    img.parentNode.replaceChild(placeholder, img);
  } catch (error) {
    console.warn('Failed to replace image with placeholder:', error);
    // If replacement fails, just hide the image
    img.style.display = 'none';
  }
}

// Simple version that just optimizes existing images without proxying
export function preprocessHtmlForScreenshotWithImages(htmlContent: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const images = tempDiv.querySelectorAll('img');
  console.log(`Optimizing ${images.length} images for screenshot`);
  
  images.forEach((img, index) => {
    const src = img.getAttribute('src') || img.src || '';
    
    // Handle problematic image types
    if (src.startsWith('cid:') || src === '' || !src) {
      console.log(`Replacing problematic image ${index + 1}: ${src}`);
      replaceWithPlaceholder(img, '[img]');
      return;
    }
    
    // For external images, optimize for screenshot capture
    if (src.startsWith('http')) {
      // Remove CORS restrictions and add error handling
      img.removeAttribute('crossorigin');
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      
      // Add inline error handling
      img.setAttribute('onerror', `
        this.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'width: 100px; height: 30px; background: #f8f9fa; border: 1px solid #e8eaed; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; color: #5f6368; font-family: Arial, sans-serif; margin: 2px;';
        placeholder.textContent = '[img]';
        this.parentNode.insertBefore(placeholder, this);
      `);
    }
    
    console.log(`Optimized image ${index + 1}: ${src}`);
  });
  
  return tempDiv.innerHTML;
}
