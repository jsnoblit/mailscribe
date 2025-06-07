import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Read Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging
console.log('🔑 Using config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
});

// Validate we have valid configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is incomplete! Check your .env.local file.');
  console.error('Current config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId,
  });
  throw new Error('Firebase configuration is incomplete. Make sure environment variables are set.');
}

// Initialize Firebase
console.log('🚀 Initializing Firebase with config...');
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google Auth Provider with Gmail scope
export const googleProvider = new GoogleAuthProvider();

// Add Gmail read-only scope for email access
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');

// Add additional Google scopes if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Set custom parameters for better UX
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account selection
  access_type: 'offline',   // Get refresh token
  include_granted_scopes: 'true' // Include previously granted scopes
});

// Export Firebase app instance
export default app;

// Helper function to get Firebase config (useful for debugging)
export const getFirebaseConfig = () => {
  return {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    // Don't expose sensitive keys in logs
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId,
  };
};

// Environment-based configuration
export const firebaseSettings = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
  maxEmailsPerSearch: parseInt(process.env.NEXT_PUBLIC_MAX_EMAILS_PER_SEARCH || '50'),
  maxScreenshotsPerBatch: parseInt(process.env.NEXT_PUBLIC_MAX_SCREENSHOTS_PER_BATCH || '20'),
};

console.log('✅ Firebase initialized successfully!', getFirebaseConfig());