'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ApiTestPage() {
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const testApiRoute = async () => {
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
      console.log('Testing API route...');
      
      const response = await fetch('/api/gmail/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken.trim(),
          query: 'in:inbox',
          maxResults: 5,
        }),
      });

      console.log('API Route Response Status:', response.status);
      console.log('API Route Response Headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('API Route Response Text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        data = { 
          raw_response: responseText, 
          parse_error: parseError.message,
          status: response.status 
        };
      }

      if (!response.ok) {
        throw new Error(`API Route failed: ${response.status} - ${responseText}`);
      }

      toast({
        title: "API Route Test Success",
        description: `Found ${data.messages?.length || 0} emails`,
      });
      
      setResults(data);

    } catch (error) {
      console.error('API Route test error:', error);
      toast({
        title: "API Route Test Failed",
        description: error.message,
        variant: "destructive",
      });
      
      setResults({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">API Route Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test /api/gmail/search Route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accessToken">Gmail Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste Gmail access token"
            />
          </div>
          
          <Button onClick={testApiRoute} disabled={isLoading || !accessToken}>
            Test API Route
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>API Route Results</CardTitle>
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
          <CardTitle>Debug Steps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>This test checks:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Next.js API route (/api/gmail/search)</li>
            <li>Communication to Firebase Function</li>
            <li>Gmail API response</li>
            <li>Error handling and response parsing</li>
          </ul>
          <p className="mt-4 text-yellow-700 bg-yellow-100 p-2 rounded">
            <strong>Note:</strong> Check the browser console for detailed logs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
