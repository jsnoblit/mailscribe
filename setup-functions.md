# Firebase Functions Setup for MailScribe

## Step 1: Install Firebase CLI and Functions Dependencies

Run these commands in your terminal from the project root:

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Install Firebase Functions dependencies
npm install firebase-admin firebase-functions googleapis puppeteer

# Install dev dependencies for Functions
npm install -D @types/puppeteer
```

## Step 2: Login to Firebase and Initialize Functions

```bash
# Login to Firebase
firebase login

# Initialize Firebase Functions in your project
firebase init functions
```

When prompted:
- Select "Use an existing project" and choose "mailscribe-ae722"
- Choose TypeScript
- Use ESLint: Yes
- Install dependencies: Yes

## Step 3: Configure Firebase Functions for Gmail API and Puppeteer

After initialization, you'll need to:
1. Enable Gmail API in Google Cloud Console
2. Set up service account credentials
3. Configure environment variables for Functions

## Step 4: Update Functions Configuration

The firebase init will create a `functions` folder. We'll need to modify the generated files to support our Gmail + Puppeteer requirements.
