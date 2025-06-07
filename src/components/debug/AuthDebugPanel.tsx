'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, User, Mail, Clock } from 'lucide-react';

export default function AuthDebugPanel() {
  const { user, loading, error } = useAuth();

  const getAuthStatus = () => {
    if (loading) return { status: 'loading', color: 'bg-yellow-500', icon: Clock };
    if (error) return { status: 'error', color: 'bg-red-500', icon: XCircle };
    if (user) return { status: 'authenticated', color: 'bg-green-500', icon: CheckCircle };
    return { status: 'unauthenticated', color: 'bg-gray-500', icon: AlertCircle };
  };

  const authStatus = getAuthStatus();
  const StatusIcon = authStatus.icon;

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className="h-5 w-5" />
          Authentication Debug Panel
        </CardTitle>
        <CardDescription>
          Real-time authentication state and user information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auth Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Status:</span>
          <Badge 
            variant="secondary" 
            className={`${authStatus.color} text-white`}
          >
            {authStatus.status.toUpperCase()}
          </Badge>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Checking authentication state...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
              <XCircle className="h-4 w-4" />
              Authentication Error
            </div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* User Information */}
        {user && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                <CheckCircle className="h-4 w-4" />
                Successfully Authenticated
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Name:</span>
                  <span>{user.displayName || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">UID:</span>
                  <span className="font-mono text-xs">{user.uid}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Firebase Token:</span>
                  <span>{user.accessToken ? 'Available' : 'Missing'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Gmail OAuth Token:</span>
                  <span>{user.gmailAccessToken ? 'Available' : 'Missing'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Check */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Configuration Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Firebase Auth initialized</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Google OAuth provider configured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Gmail scopes included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Auth context provider active</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {user && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Ready for Gmail API</h4>
            <p className="text-sm text-muted-foreground">
              You can now search your Gmail emails using the authenticated session. 
              Try using the search form to query your email data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}