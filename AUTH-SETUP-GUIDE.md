# MailScribe Authentication Setup Guide

## 🔐 Authentication Architecture

MailScribe uses Firebase Authentication with Google OAuth to securely access Gmail accounts. Here's how it works:

### Authentication Flow
1. **User clicks "Sign in with Google"** in the AuthCard component
2. **Firebase Auth opens OAuth popup** with Gmail read permissions
3. **User grants access** to their Gmail account
4. **Firebase returns access token** with Gmail API access
5. **App stores user state** in React context via useAuth hook
6. **Gmail API calls** are made using the authenticated user's token

### Key Components

#### 🎣 Authentication Hook (`/src/hooks/useAuth.ts`)
- Manages Firebase Auth state
- Provides `signInWithGoogle()` and `signOut()` functions  
- Handles access tokens for Gmail API
- Includes comprehensive error handling

#### 🏠 Auth Provider (`layout.tsx`)
- Wraps entire app with authentication context
- Manages auth state across all components

#### 🎨 Auth UI (`/src/components/auth/AuthCard.tsx`)
- Clean sign-in interface
- Real-time error display
- Loading states during auth

#### 📨 Gmail Service (`/src/lib/gmail-service.ts`)
- Secure API wrapper for Gmail operations
- Handles search queries and email content
- Uses authenticated user context

### Security Features

✅ **Read-only Gmail access** - App can only read emails, never send or delete
✅ **OAuth 2.0 flow** - Industry standard authentication  
✅ **Token validation** - All API calls verified with user tokens
✅ **Error boundaries** - Graceful handling of auth failures
✅ **Session management** - Persistent auth state across browser sessions

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Check Firebase configuration**
   ```bash
   ./test-auth-setup.sh
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Test authentication**
   - Navigate to http://localhost:9002
   - Click "Sign in with Google"
   - Grant Gmail permissions
   - Start searching emails!

## 🔧 Configuration Requirements

### Firebase Project Setup
- Firebase project created at console.firebase.google.com
- Authentication enabled with Google provider
- Gmail API scope configured: `https://www.googleapis.com/auth/gmail.readonly`

### Google Cloud Console
- Gmail API enabled
- OAuth 2.0 client configured
- Authorized domains added (localhost for dev)

### Environment Variables (.env.local)
```bash
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🐛 Troubleshooting

### Common Auth Issues

**"Pop-up blocked"**
- Solution: Allow popups for localhost in browser settings

**"Invalid credentials"**  
- Check Google Cloud OAuth client configuration
- Verify authorized domains include your development URL

**"Gmail API access denied"**
- Ensure Gmail API is enabled in Google Cloud Console
- Check OAuth scopes include Gmail read access

**"Firebase Auth error"**
- Verify Firebase config in .env.local
- Check Firebase Authentication is enabled

### Debug Tools

1. **Browser Console** - View detailed auth errors
2. **Firebase Console** - Monitor auth events  
3. **Network Tab** - Check API call responses
4. **Test Script** - Run `./test-auth-setup.sh`

## 📱 User Experience

### Before Authentication
- Clean landing page with sign-in card
- Clear explanation of Gmail permissions needed
- Professional branding and messaging

### After Authentication  
- User avatar/name in header
- Sign-out option via dropdown menu
- Immediate access to email search
- Persistent session across page reloads

### Error Handling
- User-friendly error messages
- Retry mechanisms for transient failures
- Clear guidance for resolution steps

## 🔮 Next Steps

With authentication working, you can now:

1. **Test Gmail search** with real email data
2. **Implement screenshot generation** 
3. **Add SharePoint integration** (Phase 2)
4. **Enable team collaboration** (Phase 3)

The authentication foundation is solid and ready for production use! 🎉
