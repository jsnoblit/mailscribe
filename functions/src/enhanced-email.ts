import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {google} from "googleapis";
import cors from "cors";

console.log('enhanced-email.ts CALLED');

// Configure CORS
const corsHandler = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/**
 * Enhanced email content service with image preprocessing
 */
export const getEnhancedEmailContent = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
  },
  (req, res) => {
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

        // Enhanced HTML preprocessing for better client-side screenshots
        const enhanceHtmlForScreenshots = (html: string): string => {
          // Add better styling and image handling
          const enhancedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                  line-height: 1.4;
                  margin: 20px;
                  background: white;
                  max-width: 1160px;
                  color: #333;
                }
                img {
                  max-width: 100% !important;
                  height: auto !important;
                  display: block;
                  border: none;
                }
                /* Handle external images that might fail */
                img[src*="gstatic.com"],
                img[src*="googleusercontent.com"],
                img[src*="click."],
                img[src*="doubleclick"] {
                  background: #f8f9fa;
                  border: 1px dashed #dee2e6;
                  min-height: 50px;
                  min-width: 100px;
                }
                img[src*="gstatic.com"]:after,
                img[src*="googleusercontent.com"]:after,
                img[src*="click."]:after,
                img[src*="doubleclick"]:after {
                  content: '[Image]';
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  font-size: 12px;
                  color: #6c757d;
                }
                table { 
                  border-collapse: collapse; 
                  max-width: 100%;
                }
                .email-content { 
                  max-width: 100%; 
                  overflow-x: auto;
                }
                /* Force text to be visible */
                * {
                  color: inherit !important;
                }
                a {
                  color: #0066cc !important;
                  text-decoration: underline;
                }
              </style>
            </head>
            <body>
              <div class="email-content">
                ${html}
              </div>
              <script>
                // Image error handling
                document.addEventListener('DOMContentLoaded', function() {
                  const images = document.querySelectorAll('img');
                  images.forEach(function(img) {
                    img.onerror = function() {
                      this.style.background = '#f8f9fa';
                      this.style.border = '1px dashed #dee2e6';
                      this.style.minHeight = '50px';
                      this.style.minWidth = '100px';
                      this.alt = '[Image could not load]';
                    };
                  });
                });
              </script>
            </body>
            </html>
          `;
          return enhancedHtml;
        };

        const enhancedHtml = enhanceHtmlForScreenshots(htmlContent);

        res.json({
          htmlContent: enhancedHtml,
          originalHtml: htmlContent,
          messageId,
          enhanced: true,
        });
      } catch (error) {
        console.error("Error getting enhanced email content:", error);
        res.status(500).json({error: "Failed to get enhanced email content", details: error.message});
      }
    });
  }
);
