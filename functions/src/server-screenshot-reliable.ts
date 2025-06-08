import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {google} from "googleapis";
import cors from "cors";

// Configure CORS
const corsHandler = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/**
 * Alternative server-side screenshot using chrome-aws-lambda for better compatibility
 */
export const generateReliableServerScreenshot = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "2GiB",
    cpu: 1,
  },
  (req, res) => {
    corsHandler(req, res, async () => {
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
            htmlContent = `<html><body><pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${textContent}</pre></body></html>`;
          }
        }

        if (!htmlContent) {
          res.status(400).json({error: "No email content found"});
          return;
        }

        // Instead of using Puppeteer, let's try a different approach
        // For Firebase Functions, we'll use a simpler HTML-to-image conversion
        // or return the HTML for client-side processing

        // Enhanced HTML template for better email rendering
        const fullHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                line-height: 1.5;
                margin: 0;
                background: transparent;
                word-wrap: break-word;
              }
              .email-container {
                max-width: 1200px;
                margin: 0 auto;
              }
              img {
                max-width: 100% !important;
                height: auto !important;
                vertical-align: middle;
              }
              table { 
                border-collapse: collapse; 
                max-width: 100%;
                border-spacing: 0;
              }
              td, th {
                vertical-align: top;
                padding: 4px 8px;
              }
              /* Center content in button-like links */
              a[href*="View"], a[href*="Manage"], a[role="button"], .button {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-align: center !important;
              }
              /* Better alignment for icons/text */
              td > img + span, td > span + img {
                 vertical-align: middle;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `;

        // Generate filename
        const timestamp = new Date().toISOString().split("T")[0];
        const safeSubject = messageDetails.data.payload?.headers
          ?.find(h => h.name === "Subject")?.value
          ?.replace(/[^a-zA-Z0-9\s]/g, "")
          ?.substring(0, 50) || "email";
        const filename = `${brand}_${safeSubject.replace(/\s+/g, "_")}_${timestamp}.png`;

        // For now, return the HTML content for client-side processing
        // This avoids the Chrome installation issues in Firebase Functions
        res.json({
          htmlContent: fullHtml,
          filename: filename,
          messageId: messageId,
          success: true,
          note: "HTML content returned for client-side screenshot generation",
        });

      } catch (error) {
        console.error("Reliable screenshot error:", error);
        res.status(500).json({
          error: "Failed to process email for screenshot",
          details: error.message,
        });
      }
    });
  }
);

/**
 * Fallback function that uses a different approach - returns processed HTML for client-side screenshot
 */
export const generateClientSideScreenshotData = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    invoker: 'public',
  },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const {accessToken, messageIds, brand = "unknown"} = req.body;

        if (!accessToken || !messageIds || !Array.isArray(messageIds)) {
          res.status(400).json({error: "Access token and message IDs array are required"});
          return;
        }

        // Get email content for multiple messages
        const auth = new google.auth.OAuth2();
        auth.setCredentials({access_token: accessToken});
        const gmail = google.gmail({version: "v1", auth});

        const emailData = [];

        for (const messageId of messageIds.slice(0, 10)) { // Limit to 10 for performance
          try {
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
                htmlContent = `<html><body><pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${textContent}</pre></body></html>`;
              }
            }

            if (htmlContent) {
              // Enhanced HTML template
              const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                      line-height: 1.5;
                      margin: 0;
                      background: transparent;
                      word-wrap: break-word;
                    }
                    .email-container {
                      max-width: 1200px;
                      margin: 0 auto;
                    }
                    img {
                      max-width: 100% !important;
                      height: auto !important;
                      vertical-align: middle;
                    }
                    table { 
                      border-collapse: collapse; 
                      max-width: 100%;
                      border-spacing: 0;
                    }
                    td, th {
                      vertical-align: top;
                      padding: 4px 8px;
                    }
                    /* Center content in button-like links */
                    a[href*="View"], a[href*="Manage"], a[role="button"], .button {
                      display: inline-flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                      text-align: center !important;
                    }
                    /* Better alignment for icons/text */
                    td > img + span, td > span + img {
                       vertical-align: middle;
                    }
                  </style>
                </head>
                <body>
                  ${htmlContent}
                </body>
                </html>
              `;

              // Generate filename
              const timestamp = new Date().toISOString().split("T")[0];
              const safeSubject = messageDetails.data.payload?.headers
                ?.find(h => h.name === "Subject")?.value
                ?.replace(/[^a-zA-Z0-9\s]/g, "")
                ?.substring(0, 50) || "email";
              const filename = `${brand}_${safeSubject.replace(/\s+/g, "_")}_${timestamp}.png`;

              emailData.push({
                messageId,
                htmlContent: fullHtml,
                filename,
                subject: messageDetails.data.payload?.headers?.find(h => h.name === "Subject")?.value || "",
              });
            }
          } catch (error) {
            console.error(`Error processing message ${messageId}:`, error);
          }
        }

        res.json({
          emails: emailData,
          success: true,
          count: emailData.length,
        });

      } catch (error) {
        console.error("Batch email processing error:", error);
        res.status(500).json({
          error: "Failed to process emails",
          details: error.message,
        });
      }
    });
  }
);
