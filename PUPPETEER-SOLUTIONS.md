# MailScribe - Puppeteer Screenshot Solutions

This document explains the solutions implemented to resolve server-side Puppeteer issues in Firebase Functions.

## Problem

The original error was:
```
Error: Server screenshot failed: 500 - Could not find Chrome (ver. 127.0.6533.88)
```

This occurs because Firebase Functions has specific requirements for running Puppeteer/Chrome.

## Solutions Implemented

### 1. Enhanced Server-Side Puppeteer (`server-screenshot.ts`)

**Improvements:**
- Dynamic Chrome executable path detection
- Multiple fallback paths for different Firebase environments
- Enhanced Puppeteer launch arguments
- Better memory management

**Chrome Path Detection:**
```javascript
const possibleChromePaths = [
  "/layers/google.nodejs.functions-framework/functions-framework/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome",
  "/workspace/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  process.env.PUPPETEER_EXECUTABLE_PATH,
];
```

### 2. Reliable Server Screenshot (`server-screenshot-reliable.ts`)

**Alternative Approach:**
- Returns processed HTML instead of generating screenshots server-side
- Avoids Chrome installation issues entirely
- Provides enhanced HTML for client-side processing

**Benefits:**
- No Chrome dependency on server
- Faster response times
- More reliable in Firebase Functions environment

### 3. Hybrid Screenshot Service (`hybrid-screenshot-service.ts`)

**Multi-Method Approach:**
1. **Primary:** Try reliable server screenshots (server-processed HTML → client screenshot)
2. **Fallback 1:** Enhanced client-side with server HTML processing
3. **Fallback 2:** Basic client-side screenshots

**Advantages:**
- Automatic fallback between methods
- Best of both worlds (server processing + client rendering)
- Resilient to various failure modes

## Deployment Instructions

### Option 1: Quick Deploy (Recommended)
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

### Option 2: Manual Steps
```bash
cd functions
npm install
npx puppeteer browsers install chrome
npm run build
cd ..
firebase deploy --only functions
```

## Usage in Frontend

The `ScreenshotActions` component now offers three modes:

### 1. Hybrid Mode (Recommended)
- Automatically tries multiple screenshot methods
- Best reliability and quality
- Handles Chrome issues gracefully

### 2. Server Mode
- Uses original server-side Puppeteer
- May still have Chrome issues in some environments
- Best for complex emails with many images

### 3. Client Mode
- Pure client-side rendering
- Most reliable but may miss some images
- Good for simple emails and testing

## Technical Details

### Chrome Installation
The `package.json` includes:
```json
{
  "scripts": {
    "postinstall": "npx puppeteer browsers install chrome",
    "puppeteer:install": "npx puppeteer browsers install chrome --path ./browsers"
  },
  "dependencies": {
    "puppeteer": "^22.0.0",
    "puppeteer-core": "^22.0.0"
  }
}
```

### Firebase Function Configuration
```javascript
export const generateServerScreenshot = onRequest({
  cors: true,
  timeoutSeconds: 300,
  memory: "2GiB",      // Increased memory for Puppeteer
  cpu: 1,              // Dedicated CPU for better performance
});
```

### Optimized Puppeteer Arguments
```javascript
const puppeteerOptions = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-web-security",
    "--memory-pressure-off",
    "--max_old_space_size=4096",
    // ... more optimizations
  ],
};
```

## Troubleshooting

### If Chrome Installation Still Fails:
1. Use Hybrid Mode (default) - it will fallback to client-side
2. The reliable server screenshot returns HTML for client processing
3. Check Firebase Functions logs for specific error details

### For Development:
1. Test locally first: `npm run serve`
2. Use the `/integrated` page for real Gmail testing
3. Monitor browser console for client-side errors

### Performance Optimization:
1. Limit batch size to 10-20 emails at a time
2. Use Hybrid mode for best balance of speed and quality
3. Monitor Firebase Functions usage/costs

## API Endpoints

- `searchGmailMessages` - Search emails
- `getEmailContent` - Get individual email HTML
- `generateServerScreenshot` - Original Puppeteer (may fail)
- `generateReliableServerScreenshot` - Returns HTML for client processing
- `generateClientSideScreenshotData` - Batch HTML processing

## Next Steps

1. **Deploy the updated functions:**
   ```bash
   ./deploy-functions.sh
   ```

2. **Test the hybrid approach:**
   - Navigate to `/integrated`
   - Search for emails
   - Select "Hybrid" mode (default)
   - Try taking screenshots

3. **Monitor results:**
   - Check browser downloads folder
   - Monitor Firebase Functions logs
   - Test with different email types

The hybrid approach should resolve the Chrome installation issues while providing the best possible screenshot quality through intelligent fallbacks.
