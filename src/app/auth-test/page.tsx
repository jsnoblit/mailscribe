'use client';

import { useState } from 'react';
import Header from '@/components/shared/Header';
import AuthCard from '@/components/auth/AuthCard';
import AuthDebugPanel from '@/components/debug/AuthDebugPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { GmailService } from '@/lib/gmail-service';
import { TestTube, Search, Mail, CheckCircle, XCircle } from 'lucide-react';

export default function AuthTestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTestingGmail, setIsTestingGmail] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testGmailConnection = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first to test Gmail connection.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingGmail(true);
    setTestResults(null);

    try {
      // Test Gmail search with a simple query
      const filters = {
        brand: 'All',
        subject: 'All', 
        maxResults: 5,
      };

      console.log('Testing Gmail connection with filters:', filters);
      
      const response = await GmailService.searchEmails(user, filters);
      
      setTestResults({
        success: true,
        messageCount: response.messages.length,
        totalResults: response.totalResults,
        sampleMessages: response.messages.slice(0, 3).map(msg => ({
          id: msg.id,
          subject: msg.subject,
          from: msg.from,
          date: msg.date,
        })),
      });

      toast({
        title: "Gmail Connection Successful!",
        description: `Found ${response.messages.length} recent emails.`,
        variant: "default",
      });

    } catch (error: any) {
      console.error('Gmail test error:', error);
      
      setTestResults({
        success: false,
        error: error.message,
      });

      toast({
        title: "Gmail Connection Failed",
        description: error.message || "Unable to connect to Gmail API.",
        variant: "destructive",
      });
    } finally {
      setIsTestingGmail(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-4xl font-headline font-bold mb-4">
              🔐 Authentication Test Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Test and verify your Gmail authentication setup
            </p>
          </div>

          {/* Authentication Card */}
          {!user && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Step 1: Sign In</h2>
              <AuthCard />
            </div>
          )}

          {/* Debug Panel */}
          <AuthDebugPanel />

          {/* Gmail Test Section */}
          {user && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Gmail API Connection Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Test the Gmail API connection by searching for recent emails in your inbox.
                </p>
                
                <Button 
                  onClick={testGmailConnection}
                  disabled={isTestingGmail}
                  className="w-full sm:w-auto"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isTestingGmail ? 'Testing Gmail Connection...' : 'Test Gmail Connection'}
                </Button>

                {/* Test Results */}
                {testResults && (
                  <div className={`border rounded-md p-4 ${
                    testResults.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`flex items-center gap-2 font-medium mb-3 ${
                      testResults.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResults.success ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      {testResults.success ? 'Gmail Connection Successful!' : 'Gmail Connection Failed'}
                    </div>

                    {testResults.success ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Messages Found:</span>
                            <span className="ml-2">{testResults.messageCount}</span>
                          </div>
                          <div>
                            <span className="font-medium">Total Results:</span>
                            <span className="ml-2">{testResults.totalResults}</span>
                          </div>
                        </div>

                        {testResults.sampleMessages && testResults.sampleMessages.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-800 mb-2">Sample Messages:</h4>
                            <div className="space-y-2">
                              {testResults.sampleMessages.map((msg: any, index: number) => (
                                <div key={msg.id} className="bg-white border border-green-100 rounded p-3 text-sm">
                                  <div className="flex items-start gap-2">
                                    <Mail className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-grow min-w-0">
                                      <div className="font-medium text-green-900 truncate">
                                        {msg.subject}
                                      </div>
                                      <div className="text-green-700 text-xs mt-1 truncate">
                                        From: {msg.from}
                                      </div>
                                      <div className="text-green-600 text-xs mt-1">
                                        {new Date(msg.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-700 text-sm">
                        <div className="font-medium mb-1">Error Details:</div>
                        <div className="bg-red-100 border border-red-200 rounded p-2 font-mono text-xs">
                          {testResults.error}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {user && testResults?.success && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-green-800">🎉 Ready for Production!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 mb-4">
                  Your authentication is working perfectly! You can now:
                </p>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Search your Gmail emails with custom filters
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Generate screenshots of email content
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Download screenshots for audit purposes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Use all MailScribe features securely
                  </li>
                </ul>
                <div className="mt-6">
                  <Button asChild>
                    <a href="/">Go to Main App</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>📋 Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">1. Authentication Test</h4>
                <p className="text-muted-foreground">
                  The debug panel above shows your current authentication state. 
                  If you're signed in, you should see a green "AUTHENTICATED" status 
                  with your user details.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Gmail API Test</h4>
                <p className="text-muted-foreground">
                  Click "Test Gmail Connection" to verify that your access token 
                  can successfully query the Gmail API and retrieve your email data.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Troubleshooting</h4>
                <p className="text-muted-foreground">
                  If you encounter issues, check the browser console for detailed 
                  error messages. Common issues include popup blockers, incorrect 
                  OAuth configuration, or expired access tokens.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}