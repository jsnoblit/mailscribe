import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {google} from "googleapis";
import puppeteer from "puppeteer";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";
import { TestTube, Search, Mail, CheckCircle, XCircle, Settings, Camera, Download, FileArchive, FileImage, FileText } from 'lucide-react';

// Configure CORS
const corsHandler = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/**
 * Server-side screenshot generation with full image support
 */
export const generateServerScreenshot = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "2GiB",
    cpu: 1,
  },
  (req, res) => {
    corsHandler(req, res, async () => {
      let browser;
      try {
        const {accessToken, messageId, brand = "unknown"} = req.body;

        if (!accessToken || !messageId) {
          res.status(400).json({error: "Access token and message ID are required"});
          return;
        }

        // Get email content first
        const auth = new google.auth.OAuth2();
        auth.setCredentials({access_token: accessToken});
        const gmail = google.gmail({version: "v1", auth});

        const messageDetails = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "full",
        });

        // Extract HTML content
        let htmlContent = "";
        const payload = messageDetails.data.payload;

        if (payload) {
          const findHtmlContent = (part: any): string => {
            if (part.mimeType === "text/html" && part.body?.data) {
              return Buffer.from(part.body.data, "base64").toString("utf-8");
            }
            if (part.parts) {
              for (const subPart of part.parts) {
                const html = findHtmlContent(subPart);
                if (html) return html;
              }
            }
            return "";
          };

          htmlContent = findHtmlContent(payload);

          if (!htmlContent && payload.body?.data) {
            const textContent = Buffer.from(payload.body.data, "base64").toString("utf-8");
            htmlContent = `<html><body><pre>${textContent}</pre></body></html>`;
          }
        }

        if (!htmlContent) {
          res.status(400).json({error: "No email content found"});
          return;
        }

        // Launch Puppeteer with Firebase Functions optimized settings
        const puppeteerOptions: any = {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-ipc-flooding-protection",
            "--memory-pressure-off",
            "--max_old_space_size=4096",
          ],
        };

        // Try to find Chrome executable in Firebase Functions environment
        const possibleChromePaths = [
          // Firebase Functions Gen2 paths
          "/layers/google.nodejs.functions-framework/functions-framework/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome",
          "/workspace/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/google-chrome",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
          // Local development paths (macOS)
          "/Users/jnoblit/.cache/puppeteer/chrome/mac_arm-137.0.7151.55/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
          process.env.PUPPETEER_EXECUTABLE_PATH,
          // Generic local puppeteer cache paths
          process.env.HOME + "/.cache/puppeteer/chrome/mac_arm-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
          process.env.HOME + "/.cache/puppeteer/chrome/mac-*/chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        ].filter(Boolean);

        let executablePath: string | undefined;
        for (const chromePath of possibleChromePaths) {
          if (chromePath && chromePath.includes('*')) {
            // Handle glob patterns for both Linux and macOS
            const baseDir = chromePath.split('*')[0];
            const suffix = chromePath.split('*')[1] || '';
            try {
              if (fs.existsSync(baseDir)) {
                const dirs = fs.readdirSync(baseDir);
                for (const dir of dirs) {
                  let fullPath;
                  if (suffix.includes('chrome-linux/chrome')) {
                    // Linux pattern
                    fullPath = path.join(baseDir, dir, 'chrome-linux/chrome');
                  } else if (suffix.includes('Google Chrome for Testing.app')) {
                    // macOS pattern  
                    fullPath = path.join(baseDir, dir, suffix);
                  } else {
                    fullPath = path.join(baseDir, dir, suffix);
                  }
                  
                  if (fs.existsSync(fullPath)) {
                    executablePath = fullPath;
                    break;
                  }
                }
              }
            } catch (e) {
              // Continue to next path
            }
          } else if (chromePath && fs.existsSync(chromePath)) {
            executablePath = chromePath;
            break;
          }
        }

        if (executablePath) {
          puppeteerOptions.executablePath = executablePath;
          console.log(`Using Chrome at: ${executablePath}`);
        } else {
          console.log('No Chrome executable found, letting Puppeteer handle it');
        }

        browser = await puppeteer.launch(puppeteerOptions);

        const page = await browser.newPage();

        // Set Gmail-like user agent
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        );

        // Set viewport for Gmail-like rendering
        await page.setViewport({
          width: 600,
          height: 800,
          deviceScaleFactor: 1, // Gmail is not retina by default
        });

        // Force light mode
        await page.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: "light" },
        ]);

        // -------------------------------------------------------------
        // Inject a web-font so headless Chrome on Linux has a close
        // match to Apple "SF Pro".  We preload an Inter TTF and
        // declare it as a fallback face.  Gmail on macOS will still
        // use the native system font; Puppeteer will download Inter.
        // -------------------------------------------------------------

        const fontInjection = `\n<link rel="preload" as="font" type="font/ttf" crossorigin href="https://fonts.gstatic.com/s/inter/v12/UcCn_537.ttf">\n<style>@font-face { font-family: 'SanFranciscoFallback'; src: url('https://fonts.gstatic.com/s/inter/v12/UcCn_537.ttf') format('truetype'); font-display: block; } body, p, h1, h2, h3, h4, span, a, li { font-family: 'SanFranciscoFallback', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }</style>`;

        // Always wrap the Gmail HTML in a minimal shell that includes the
        // font preload/@font-face snippet. This guarantees identical fonts
        // across all environments, regardless of whether the payload was a
        // complete document or a fragment.

        const contentToRender = htmlContent.trim();

        const finalHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
    ${fontInjection}
  </head>
  <body>
    ${contentToRender}
  </body>
</html>`;

        await page.setContent(finalHtml, {
          waitUntil: ["networkidle0", "domcontentloaded"],
          timeout: 30000,
        });

        // Wait extra time for images to load
        await page.waitForTimeout(3000);

        // Take screenshot
        const screenshot = await page.screenshot({
          type: "png",
          fullPage: true,
          encoding: "base64",
        });

        await browser.close();

        // Generate filename
        const timestamp = new Date().toISOString().split("T")[0];
        const safeSubject = messageDetails.data.payload?.headers
          ?.find(h => h.name === "Subject")?.value
          ?.replace(/[^a-zA-Z0-9\s]/g, "")
          ?.substring(0, 50) || "email";
        const filename = `${brand}_${safeSubject.replace(/\s+/g, "_")}_${timestamp}.png`;

        res.json({
          screenshot: screenshot,
          filename: filename,
          messageId: messageId,
          success: true,
          renderedHtml: finalHtml,
        });

      } catch (error) {
        console.error("Server screenshot error:", error);
        if (browser) {
          await browser.close();
        }
        res.status(500).json({
          error: "Failed to generate screenshot",
          details: error.message,
        });
      }
    });
  }
);
console.log('FONT BLOCK INJECTED') ;