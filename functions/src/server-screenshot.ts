import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {google} from "googleapis";
import puppeteer from "puppeteer";
import cors from "cors";

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

        // Launch Puppeteer with optimized settings
        browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security", // Allows loading any image
            "--disable-features=VizDisplayCompositor",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
          ],
        });

        const page = await browser.newPage();

        // Set viewport for consistent screenshots
        await page.setViewport({
          width: 1200,
          height: 800,
          deviceScaleFactor: 2, // High DPI for quality
        });

        // Enhanced HTML template for better email rendering
        const fullHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                margin: 20px;
                background: white;
                width: 1160px; /* Slightly less than viewport for padding */
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }
              /* Fix common email styling issues */
              table { border-collapse: collapse; }
              .email-content { max-width: 100%; }
            </style>
          </head>
          <body>
            <div class="email-content">
              ${htmlContent}
            </div>
          </body>
          </html>
        `;

        // Set content and wait for everything to load
        await page.setContent(fullHtml, {
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
