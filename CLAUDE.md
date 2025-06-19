# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MailScribe is an AI-powered email management tool built with Next.js and Firebase. It allows users to search, summarize, and take screenshots of Gmail emails through a secure web interface.

## Common Development Commands

### Main Application
```bash
npm run dev          # Start Next.js development server on port 9002
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run typecheck    # TypeScript type checking
```

### AI/Genkit Development
```bash
npm run genkit:dev   # Start Genkit development server
npm run genkit:watch # Start Genkit with file watching
```

### Firebase Functions
```bash
cd functions
npm run build        # Build TypeScript functions
npm run build:watch  # Build with watch mode
npm run serve        # Start Firebase emulator
npm run deploy       # Deploy functions to Firebase
npm run logs         # View function logs
```

### Puppeteer Setup (Functions)
```bash
cd functions
npm run puppeteer:install  # Install Chrome for Puppeteer
```

## Architecture Overview

### Frontend (Next.js 15 + App Router)
- **Authentication**: Firebase Auth with Gmail OAuth integration (`src/lib/firebase.ts`)
- **Email Service**: Gmail API integration through custom service (`src/lib/gmail-service.ts`)
- **Screenshot Capture**: Multiple screenshot services with different strategies:
  - Client-side: `screenshot-service.ts` (html2canvas)
  - Server-side: Functions with Puppeteer for reliable rendering
  - Hybrid approaches combining both methods
- **AI Integration**: Google Genkit for email summarization and analysis (`src/ai/`)
- **UI Components**: Radix UI components with Tailwind CSS styling

### Backend (Firebase Functions)
- **Gmail API**: Server-side Gmail message search and content retrieval
- **Screenshot Generation**: Puppeteer-based email screenshot service with Chrome browser
- **CORS Handling**: Configured for cross-origin requests from the frontend

### Key Services Structure
```
src/lib/
├── firebase.ts                    # Firebase config and auth setup
├── gmail-service.ts              # Gmail API client wrapper
├── screenshot-service.ts         # Client-side screenshot with html2canvas
├── server-screenshot-service.ts  # Server-side screenshot via functions
├── hybrid-screenshot-service.ts  # Combined client/server approach
└── *-screenshot-service.ts       # Various screenshot strategies
```

### Authentication Flow
1. Firebase Auth with Google OAuth
2. Gmail scope requests (`gmail.readonly`)
3. Access token storage for Gmail API calls
4. Secure token passing to Firebase Functions

### Screenshot Architecture
Multiple screenshot strategies are implemented due to CORS and image loading challenges:
- **Client-side**: Direct browser screenshot with CORS proxy handling
- **Server-side**: Puppeteer in Firebase Functions for reliable rendering
- **Hybrid**: Combines both approaches for optimal results

## Environment Configuration

### Required Environment Variables (`.env.local`)
```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002
NEXT_PUBLIC_MAX_EMAILS_PER_SEARCH=50
NEXT_PUBLIC_MAX_SCREENSHOTS_PER_BATCH=20
```

### Firebase Setup Requirements
- Firebase project with Authentication enabled
- Gmail API enabled in Google Cloud Console
- OAuth consent screen configured
- Firebase Functions deployed with Node.js 20

## Development Patterns

### Component Organization
- **UI Components**: Radix UI with shadcn/ui patterns in `src/components/ui/`
- **Feature Components**: Organized by functionality (auth, search, results, etc.)
- **Shared Components**: Reusable components in `src/components/shared/`

### State Management
- React hooks and context for authentication state
- Local state for form handling and UI interactions
- Service classes for API interactions

### Error Handling
- Gmail API errors handled with retry logic
- Screenshot failures fall back to alternative methods
- User-friendly error messages with debugging information

### Testing Pages
The application includes several test pages for development:
- `/api-test` - API endpoint testing
- `/auth-test` - Authentication flow testing
- `/direct-test` - Direct Gmail integration testing
- `/env-debug` - Environment variable debugging

## Firebase Functions Architecture

Functions are written in TypeScript and include:
- **Gmail Integration**: Message search and content retrieval
- **Screenshot Generation**: Puppeteer-based email rendering
- **CORS Configuration**: Proper cross-origin handling
- **Error Handling**: Comprehensive error responses

### Function Deployment
Functions use Node.js 20 and automatically install Chrome for Puppeteer during deployment. The build process compiles TypeScript to JavaScript in the `lib/` directory.