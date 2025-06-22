import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {google} from "googleapis";
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({origin: true});

/**
 * Search Gmail messages based on query parameters
 */
export const searchGmailMessages = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const {accessToken, query, maxResults = 50} = req.body;

      if (!accessToken) {
        res.status(400).json({error: "Access token is required"});
        return;
      }

      // Initialize Gmail API
      const auth = new google.auth.OAuth2();
      auth.setCredentials({access_token: accessToken});
      const gmail = google.gmail({version: "v1", auth});

      // Search for messages
      const response = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      const messages = response.data.messages || [];
      const emailDetails = [];

      // Get details for each message
      for (const message of messages.slice(0, 20)) { // Limit to 20 for performance
        try {
          const messageDetails = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "full",
          });

          const headers = messageDetails.data.payload?.headers || [];
          const subjectHeader = headers.find((h) => h.name === "Subject");
          const fromHeader = headers.find((h) => h.name === "From");
          const dateHeader = headers.find((h) => h.name === "Date");

          emailDetails.push({
            id: message.id,
            subject: subjectHeader?.value || "No Subject",
            from: fromHeader?.value || "Unknown Sender",
            date: dateHeader?.value || "",
            snippet: messageDetails.data.snippet || "",
          });
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
        }
      }

      res.json({
        messages: emailDetails,
        totalResults: response.data.resultSizeEstimate || 0,
      });
    } catch (error) {
      console.error("Error searching Gmail:", error);
      res.status(500).json({error: "Failed to search Gmail messages"});
    }
  });
});

/**
 * Get email HTML content for screenshot
 */
export const getEmailContent = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const {accessToken, messageId} = req.body;

      if (!accessToken || !messageId) {
        res.status(400).json({error: "Access token and message ID are required"});
        return;
      }

      // Initialize Gmail API
      const auth = new google.auth.OAuth2();
      auth.setCredentials({access_token: accessToken});
      const gmail = google.gmail({version: "v1", auth});

      // Get message details
      const messageDetails = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      // Extract HTML content
      let htmlContent = "";
      const payload = messageDetails.data.payload;

      if (payload) {
        // Function to recursively find HTML content
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

        // Fallback to plain text if no HTML found
        if (!htmlContent && payload.body?.data) {
          const textContent = Buffer.from(payload.body.data, "base64").toString("utf-8");
          htmlContent = `<html><body><pre>${textContent}</pre></body></html>`;
        }
      }

      res.json({
        htmlContent,
        messageId,
      });
    } catch (error) {
      console.error("Error getting email content:", error);
      res.status(500).json({error: "Failed to get email content"});
    }
  });
});

/**
 * Generate screenshot from email HTML content
 */
export const generateEmailScreenshot = onRequest({
  timeoutSeconds: 300,
  memory: "2GiB",
  cpu: 1,
}, (req, res) => {
  corsHandler(req, res, async () => {
    let browser;
    try {
      const {htmlContent, messageId, brand = "unknown"} = req.body;

      if (!htmlContent || !messageId) {
        res.status(400).json({error: "HTML content and message ID are required"});
        return;
      }

      // Launch Puppeteer using the bundled Chromium binary
      browser = await puppeteer.launch({
        executablePath: await chromium.executablePath(),
        args: chromium.args,
        headless: true,
        defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 1 },
      });

      const page = await browser.newPage();

      // Set viewport for consistent screenshots
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
      });

      // Set content and wait for it to load
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        type: "png",
        fullPage: true,
        encoding: "base64",
      });

      await browser.close();

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${brand}_${messageId}_${timestamp}.png`;

      res.json({
        screenshot: screenshot,
        filename: filename,
        messageId: messageId,
      });
    } catch (error) {
      console.error("Error generating screenshot:", error);
      if (browser) {
        await browser.close();
      }
      res.status(500).json({error: "Failed to generate screenshot"});
    }
  });
});

/**
 * Batch process multiple email screenshots
 */
export const batchGenerateScreenshots = onRequest({
  timeoutSeconds: 540, // 9 minutes
  memory: "4GiB",
  cpu: 2,
}, (req, res) => {
  corsHandler(req, res, async () => {
    let browser;
    try {
      const {emails, accessToken} = req.body;

      if (!emails || !Array.isArray(emails) || !accessToken) {
        res.status(400).json({error: "Emails array and access token are required"});
        return;
      }

      // Initialize Gmail API
      const auth = new google.auth.OAuth2();
      auth.setCredentials({access_token: accessToken});
      const gmail = google.gmail({version: "v1", auth});

      // Launch Puppeteer once for all screenshots with Cloud Functions optimizations
      browser = await puppeteer.launch({
        executablePath: await chromium.executablePath(),
        args: chromium.args,
        headless: true,
        defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 1 },
      });

      const screenshots = [];
      const errors = [];

      for (const email of emails) {
        try {
          // Get email HTML content
          const messageDetails = await gmail.users.messages.get({
            userId: "me",
            id: email.id,
            format: "full",
          });

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

          if (htmlContent) {
            const page = await browser.newPage();
            await page.setViewport({width: 1200, height: 800, deviceScaleFactor: 1});
            await page.setContent(htmlContent, {waitUntil: "networkidle0", timeout: 30000});

            const screenshot = await page.screenshot({
              type: "png",
              fullPage: true,
              encoding: "base64",
            });

            await page.close();

            const timestamp = new Date().toISOString().split("T")[0];
            const filename = `${email.brand || "unknown"}_${email.id}_${timestamp}.png`;

            screenshots.push({
              screenshot,
              filename,
              messageId: email.id,
              subject: email.subject,
            });
          }
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
          errors.push({
            messageId: email.id,
            error: "Failed to process email",
          });
        }
      }

      await browser.close();

      res.json({
        screenshots,
        errors,
        processed: screenshots.length,
        failed: errors.length,
      });
    } catch (error) {
      console.error("Error in batch processing:", error);
      if (browser) {
        await browser.close();
      }
      res.status(500).json({error: "Failed to process batch screenshots"});
    }
  });
});
