# MailScribe - Email Audit Tool

A powerful email auditing tool built with Next.js, Firebase Functions, and frontend screenshot capabilities.

## Features

- **Gmail Integration**: Search and retrieve emails using Gmail API
- **Advanced Filtering**: Filter by brand/sender, subject, and date range
- **Frontend Screenshots**: High-quality PNG screenshots using html2canvas
- **Batch Processing**: Process multiple emails at once
- **ZIP Downloads**: Download screenshots as organized ZIP files
- **Firebase Functions**: Serverless backend for Gmail API calls

## Setup Instructions

### 1. Install Dependencies

```bash
npm install html2canvas jszip
npm install --save-dev @types/html2canvas
```

### 2. Firebase Configuration

1. Update `src/lib/firebase.ts` with your Firebase project configuration
2. Enable Gmail API in Google Cloud Console for your project
3. Set up OAuth 2.0 credentials with these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.metadata`

### 3. Deploy Firebase Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 4. Update Function URLs

Update the `FIREBASE_FUNCTIONS_URL` in:
- `src/app/api/gmail/search/route.ts`
- `src/app/api/gmail/content/route.ts`

Replace with your deployed function URL (format: `https://us-central1-[project-id].cloudfunctions.net`)

## Usage

### Development

```bash
npm run dev
```

Visit `http://localhost:9002/integrated` for the full integrated version.

### Search Workflow

1. **Authenticate**: Sign in with your Gmail account
2. **Search**: Use filters to find emails:
   - **Brand**: Enter sender domain (e.g., "expedia.com") or "All"
   - **Subject**: Enter keywords or "All"
   - **Date Range**: Optional start/end dates
3. **Select**: Choose emails from search results
4. **Screenshot**: Generate and download screenshots

### Screenshot Options

- **Individual Screenshots**: Download screenshots one by one
- **Batch Processing**: Generate multiple screenshots
- **ZIP Download**: Download all screenshots in an organized ZIP file

## API Endpoints

### Search Emails
```
POST /api/gmail/search
```
Body:
```json
{
  "accessToken": "gmail-access-token",
  "query": "from:example.com after:2024/01/01",
  "maxResults": 50
}
```

### Get Email Content
```
POST /api/gmail/content
```
Body:
```json
{
  "accessToken": "gmail-access-token", 
  "messageId": "gmail-message-id"
}
```

## Firebase Functions

### Deployed Functions

1. **searchGmailMessages**: Search Gmail with query parameters
2. **getEmailContent**: Get HTML content for specific emails
3. **testFunction**: Simple test endpoint

### Function URLs

- Search: `https://us-central1-mailscribe-ae722.cloudfunctions.net/searchGmailMessages`
- Content: `https://us-central1-mailscribe-ae722.cloudfunctions.net/getEmailContent`
- Test: `https://us-central1-mailscribe-ae722.cloudfunctions.net/testFunction`

## File Structure

```
src/
├── app/
│   ├── api/gmail/          # Next.js API routes
│   ├── integrated/         # Integrated Gmail + Screenshot page
│   └── page.tsx           # Original mock page
├── components/
│   ├── actions/           # Screenshot action components
│   ├── auth/              # Authentication components
│   ├── results/           # Email list components
│   ├── search/            # Search form components
│   └── shared/            # Shared components
├── lib/
│   ├── gmail-service.ts   # Gmail API service
│   ├── screenshot-service.ts # Frontend screenshot handling
│   └── firebase.ts       # Firebase configuration
└── types/
    ├── email.ts          # Email type definitions
    └── index.ts          # Main type exports
```

## Screenshot Quality

Screenshots are optimized for Figma import:
- **Format**: PNG
- **Scale**: 2x for high resolution
- **Viewport**: 1200px wide for consistency
- **Content**: Email body only (no Gmail UI)

## Troubleshooting

### Authentication Issues
- Ensure Gmail API is enabled in Google Cloud Console
- Check OAuth scopes are correctly configured
- Verify redirect URIs are set up in OAuth settings

### Function Deployment Issues
- Check Node.js version compatibility (functions use Node 22)
- Ensure Firebase CLI is authenticated: `firebase login`
- Verify project selection: `firebase use mailscribe-ae722`

### Screenshot Issues
- Screenshots work only in browser environment
- Large emails may take longer to process
- Some email styles may not render perfectly

## Production Considerations

1. **Rate Limiting**: Gmail API has usage quotas
2. **Error Handling**: Implement retry logic for failed operations
3. **Security**: Store access tokens securely
4. **Performance**: Consider pagination for large result sets
5. **Storage**: Consider cloud storage for generated screenshots

## License

Built for internal email auditing purposes.
