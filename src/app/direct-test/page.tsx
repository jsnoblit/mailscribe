'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function DirectFirebaseTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [accessToken, setAccessToken] = useState('');
  const { toast } = useToast();

  const testDirectFirebaseCall = async () => {
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
      // Call Firebase function directly with authentication headers
      const response = await fetch('https://us-central1-mailscribe-ae722.cloudfunctions.net/searchGmailMessages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken.trim()}`,
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          accessToken: accessToken.trim(),
          query: 'in:inbox',
          maxResults: 5,
        }),
      });

      console.log('Direct Firebase call response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        data = { raw_response: responseText, parse_error: parseError.message };
      }

      if (!response.ok) {
        throw new Error(`Firebase function returned ${response.status}: ${responseText}`);
      }

      toast({
        title: "Direct Firebase Call Success",
        description: `Status: ${response.status}, Found: ${data.messages?.length || 0} emails`,
      });
      
      setResults({
        status: response.status,
        data: data,
        raw_response: responseText,
      });

    } catch (error) {
      console.error('Direct Firebase call error:', error);
      toast({
        title: "Direct Firebase Call Failed",
        description: error.message,
        variant: "destructive",
      });
      
      setResults({
        error: error.message,
        stack: error.stack,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateAccessToken = () => {
    if (!accessToken) {
      toast({
        title: "No Token",
        description: "Please enter an access token first",
        variant: "destructive",
      });
      return;
    }

    const tokenInfo = {
      length: accessToken.length,
      starts_with: accessToken.substring(0, 10) + '...',
      looks_like_oauth: accessToken.startsWith('ya29.') || accessToken.includes('.'),
      has_spaces: accessToken.includes(' '),
    };

    toast({
      title: "Token Info",
      description: `Length: ${tokenInfo.length}, OAuth-like: ${tokenInfo.looks_like_oauth}`,
    });

    setResults({ token_analysis: tokenInfo });
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Direct Firebase Function Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Gmail Access Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste Gmail access token from OAuth Playground"
            />
          </div>
          
          <div className="flex gap-3">
            <Button onClick={validateAccessToken} variant="outline">
              Validate Token Format
            </Button>
            
            <Button onClick={testDirectFirebaseCall} disabled={isLoading || !accessToken}>
              Test Direct Firebase Call
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>To get a valid access token:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Go to <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline text-blue-600">OAuth 2.0 Playground</a></li>
            <li>In the left sidebar, find "Gmail API v1"</li>
            <li>Check the box for "https://www.googleapis.com/auth/gmail.readonly"</li>
            <li>Click "Authorize APIs" (blue button)</li>
            <li>Choose your Gmail account and allow access</li>
            <li>Back in the playground, click "Exchange authorization code for tokens"</li>
            <li>Copy the "Access token" (starts with "ya29.")</li>
            <li>Paste it above and test</li>
          </ol>
          
          <p className="mt-4 text-yellow-700 bg-yellow-100 p-2 rounded">
            <strong>Note:</strong> Access tokens expire after 1 hour. If it fails, get a fresh token.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
