'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SimpleSearchTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [accessToken, setAccessToken] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const testFirebaseFunction = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-function');
      const data = await response.json();
      
      toast({
        title: "Firebase Function Test",
        description: `Status: ${response.status}, Message: ${data.message || 'Success'}`,
      });
      
      setResults(data);
    } catch (error) {
      console.error('Test function error:', error);
      toast({
        title: "Error",
        description: "Failed to call Firebase function",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testGmailSearch = async () => {
    if (!accessToken.trim()) {
      toast({
        title: "Missing Access Token",
        description: "Please enter a Gmail access token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/gmail/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken.trim(),
          query: searchQuery || 'in:inbox',
          maxResults: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      toast({
        title: "Gmail Search Test",
        description: `Found ${data.messages?.length || 0} emails`,
      });
      
      setResults(data);
    } catch (error) {
      console.error('Gmail search error:', error);
      toast({
        title: "Gmail Search Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGoogleAccessToken = () => {
    // Simple OAuth flow - opens popup for Google OAuth
    const clientId = 'your-google-client-id'; // You'll need to replace this
    const scope = 'https://www.googleapis.com/auth/gmail.readonly';
    const redirectUri = window.location.origin;
    
    const authUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=token&` +
      `include_granted_scopes=true`;
    
    window.open(authUrl, 'google-auth', 'width=500,height=600');
    
    toast({
      title: "OAuth Flow",
      description: "Check the popup window for Google authentication",
    });
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Gmail Search Testing</h1>
      
      {/* Test Firebase Function */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Test Firebase Function</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testFirebaseFunction} disabled={isLoading}>
            Test Firebase Function Connection
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This tests if your Firebase Functions are working.
          </p>
        </CardContent>
      </Card>

      {/* OAuth Token Input */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Get Gmail Access Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accessToken">Gmail Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste your Gmail API access token here"
            />
          </div>
          
          <div className="space-y-2">
            <Button onClick={getGoogleAccessToken} variant="outline">
              Get Access Token (OAuth)
            </Button>
            <p className="text-xs text-muted-foreground">
              Alternative: Get token manually from{' '}
              <a 
                href="https://developers.google.com/oauthplayground" 
                target="_blank" 
                className="underline"
              >
                OAuth Playground
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gmail Search Test */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Test Gmail Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="searchQuery">Search Query (optional)</Label>
            <Input
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., from:example.com (leave empty for recent emails)"
            />
          </div>
          
          <Button onClick={testGmailSearch} disabled={isLoading || !accessToken}>
            Test Gmail Search
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Get Access Token</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Option 1: OAuth Playground (Recommended for testing)</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Go to <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline">OAuth 2.0 Playground</a></li>
            <li>In Step 1, find "Gmail API v1" and check "https://www.googleapis.com/auth/gmail.readonly"</li>
            <li>Click "Authorize APIs"</li>
            <li>Sign in with your Gmail account</li>
            <li>In Step 2, click "Exchange authorization code for tokens"</li>
            <li>Copy the "Access token" and paste it above</li>
          </ol>
          
          <p className="mt-4"><strong>Option 2: Proper OAuth Setup (Production)</strong></p>
          <p>You'll need to set up Google OAuth credentials in your Firebase/Google Cloud project.</p>
        </CardContent>
      </Card>
    </div>
  );
}
