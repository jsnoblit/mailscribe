import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {google} from "googleapis";
import cors from "cors";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configure CORS to allow all origins
const corsHandler = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/**
 * Test function to verify deployment works
 */
export const testFunction = onRequest(
  {
    cors: true,
    invoker: 'public',
  },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        res.status(200).json({
          message: "Firebase Functions are working!",
          timestamp: new Date().toISOString(),
          method: req.method,
          project: process.env.GCLOUD_PROJECT,
        });
      } catch (error) {
        console.error("Test function error:", error);
        res.status(500).json({error: "Test function failed"});
      }
    });
  }
);

/**
 * Search Gmail messages based on query parameters
 */
export const searchGmailMessages = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    invoker: 'public',
  },
  (req, res) => {
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
        res.status(500).json({error: "Failed to search Gmail messages", details: error.message});
      }
    });
  }
);

/**
 * Get email HTML content for screenshot
 */
export const getEmailContent = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    invoker: 'public',
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
        res.status(500).json({error: "Failed to get email content", details: error.message});
      }
    });
  }
);

// Export server screenshot functions
export {generateServerScreenshot} from "./server-screenshot";
export {generateReliableServerScreenshot, generateClientSideScreenshotData} from "./server-screenshot-reliable";
export {getEnhancedEmailContent} from "./enhanced-email";
