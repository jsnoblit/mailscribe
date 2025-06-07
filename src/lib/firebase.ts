import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Hardcoded Firebase configuration as fallback
const FALLBACK_CONFIG = {
  apiKey: "AIzaSyChP-o61yEOaJ4ysbUcRQwaLZB0whTK77Y",
  authDomain: "mailscribe-ae722.firebaseapp.com", 
  projectId: "mailscribe-ae722",
  storageBucket: "mailscribe-ae722.firebasestorage.app",
  messagingSenderId: "300010916290",
  appId: "1:300010916290:web:b32850cb6950b69ba9ae5b"
};

// Try to get from environment variables first, fallback to hardcoded
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FALLBACK_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FALLBACK_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FALLBACK_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FALLBACK_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FALLBACK_CONFIG.appId,
};

// Debug logging
const envSource = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'env' : 'fallback',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'env' : 'fallback',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'env' : 'fallback',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'env' : 'fallback',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'env' : 'fallback',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'env' : 'fallback',
};

console.log('🔧 Firebase Config Source Check:', envSource);
console.log('🔑 Using config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
});

// Validate we have valid configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is incomplete!');
  console.error('Current config:', firebaseConfig);
  throw new Error('Firebase configuration is incomplete');
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
    configSource: envSource,
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