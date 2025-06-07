'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export interface AuthUser extends User {
  accessToken?: string;
  refreshToken: string;
  gmailAccessToken?: string; // Add Gmail-specific access token
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Get the access token for Gmail API calls
        firebaseUser.getIdToken().then((token) => {
          const newAuthData = {
            ...firebaseUser,
            accessToken: token,
          };
          
          console.log('🔍 Firebase Auth Token Debug:', {
            hasFirebaseToken: !!token,
            firebaseTokenLength: token?.length,
            firebaseTokenPreview: token?.substring(0, 50) + '...',
          });

          // Use functional update to merge states
          setUser(currentUser => ({
            ...(currentUser || {}), // Keep existing gmailAccessToken
            ...newAuthData
          } as AuthUser));
          setLoading(false);
        }).catch((err) => {
          console.error('Error getting ID token:', err);
          setError('Failed to get authentication token');
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the OAuth access token for Gmail API
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const gmailAccessToken = credential?.accessToken; // This is the Gmail OAuth token
      
      if (result.user) {
        const authUser: AuthUser = {
          ...result.user,
          accessToken: undefined, // Will be set by onAuthStateChanged
          gmailAccessToken: gmailAccessToken || undefined, // Store Gmail token
        };
        console.log('🔍 OAuth Token Debug:', {
          hasGmailToken: !!gmailAccessToken,
          gmailTokenLength: gmailAccessToken?.length,
          gmailTokenPreview: gmailAccessToken?.substring(0, 50) + '...',
        });
        setUser(authUser);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      let errorMessage = 'Authentication failed';
      
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked by browser';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials';
          break;
        default:
          errorMessage = err.message || 'Authentication failed';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut: signOutUser,
    clearError,
  };
};

// Auth Context Provider Component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authState = useAuthState();
  
  return React.createElement(
    AuthContext.Provider,
    { value: authState },
    children
  );
};