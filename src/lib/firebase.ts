import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Firebase configuration with hardcoded values as fallback for App Hosting
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBxgTI7qfyMH0wjWh-i6wBb5B77IGDu2Iw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mailscribe-ae722.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mailscribe-ae722",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mailscribe-ae722.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "300010916290",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:300010916290:web:54186103d7511a8ca9ae5b",
};

// Debug logging
console.log('🔑 Using config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
});

// Additional debugging for deployment
console.log('🔍 Environment debug:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'present' : 'missing',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'present' : 'missing',
  allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
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
  console.error('Environment variables:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'present' : 'missing',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'present' : 'missing',
    FIREBASE_WEBAPP_CONFIG: process.env.FIREBASE_WEBAPP_CONFIG ? 'present' : 'missing',
  });
  throw new Error('Firebase configuration is incomplete. Make sure environment variables are set.');
}

// Initialize Firebase
console.log('🚀 Initializing Firebase with config...');
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Ensure credentials survive full browser restarts by persisting them in localStorage
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => console.log('📌 Firebase auth persistence set to LOCAL'))
    .catch((err) => console.error('❌ Failed to set Firebase persistence', err));
}

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