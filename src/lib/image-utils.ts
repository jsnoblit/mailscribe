// Simple image handling for html2canvas
export function preprocessHtmlForScreenshot(htmlContent: string): string {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Remove or replace problematic images
  const images = tempDiv.querySelectorAll('img');
  console.log(`Found ${images.length} images to process`);
  
  images.forEach((img, index) => {
    const src = img.getAttribute('src') || img.src || '';
    console.log(`Processing image ${index + 1}: ${src}`);
    
    // Check if image is likely to cause CORS issues
    if (src.includes('googleusercontent.com') || 
        src.includes('gstatic.com') ||
        src.includes('googleapis.com') ||
        src.startsWith('https://www.google.com/') ||
        src.includes('gmail.com') ||
        src.includes('google.com') || // More broad detection
        src.startsWith('cid:') || // Gmail embedded images
        src === '' || // Empty src
        !src) { // No src at all
      
      console.log(`Replacing problematic image: ${src}`);
      
      // Replace with a simple text placeholder
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
      placeholder.textContent = '[img]';
      
      img.parentNode?.replaceChild(placeholder, img);
    } else {
      console.log(`Keeping image: ${src}`);
      // For other images, add error handling attributes
      img.setAttribute('crossorigin', 'anonymous');
      img.style.maxWidth = '100%';
      img.onerror = () => {
        console.log(`Image failed to load: ${src}`);
        // Replace with placeholder on error
        const errorPlaceholder = document.createElement('div');
        errorPlaceholder.style.cssText = `
          width: 100px;
          height: 30px;
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
        errorPlaceholder.textContent = '[img]';
        img.parentNode?.replaceChild(errorPlaceholder, img);
      };
    }
  });
  
  const result = tempDiv.innerHTML;
  console.log('Processed HTML length:', result.length);
  return result;
}
