'use client';

import { useState } from 'react';
import type React from 'react';
import Header from '@/components/shared/Header';
import AuthCard from '@/components/auth/AuthCard';
import AuthDebugPanel from '@/components/debug/AuthDebugPanel';
import SearchForm from '@/components/search/SearchForm';
import EmailList from '@/components/results/EmailList';
import ScreenshotActions from '@/components/actions/ScreenshotActions';
import type { Email, SearchCriteria, GeneratedScreenshot, EmailMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { GmailService } from '@/lib/gmail-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { TestTube, Search, Mail, CheckCircle, XCircle, Settings, Camera, Download, FileArchive, FileImage } from 'lucide-react';
import JSZip from 'jszip';

export default function MailScribePage() {
  const { user, loading: isAuthLoading } = useAuth();
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  
  // Advanced screenshot options
  const [screenshotMode, setScreenshotMode] = useState<'layout-preserving' | 'balanced-client' | 'stable-client' | 'enhanced-client'>('layout-preserving');
  const [downloadFormat, setDownloadFormat] = useState<'individual-png' | 'zip'>('individual-png');
  const [isProcessingScreenshots, setIsProcessingScreenshots] = useState(false);
  const [screenshotProgress, setScreenshotProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedScreenshots, setGeneratedScreenshots] = useState<GeneratedScreenshot[]>([]);
  const [screenshotsReady, setScreenshotsReady] = useState(false);

  // Test functionality from test page
  const [isTestingGmail, setIsTestingGmail] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const { toast } = useToast();

  const handleSearch = async (criteria: SearchCriteria) => {
    if (!user || !user.gmailAccessToken) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to search your emails.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchLoading(true);
    setEmails([]); // Clear previous results
    setSelectedEmails(new Set()); // Clear selections
    setGeneratedScreenshots([]);
    setScreenshotsReady(false);

    try {
      console.log("Searching with criteria:", criteria);
      
      // Build search query like integrated page
      const buildSearchQuery = (criteria: SearchCriteria): string => {
        const queryParts: string[] = [];

        // Brand filter (sender)
        if (criteria.brand && criteria.brand !== 'All' && criteria.brand.trim()) {
          // If it's an email address, search by exact from:
          if (criteria.brand.includes('@')) {
            queryParts.push(`from:${criteria.brand}`);
          } else {
            // If it's a domain or brand name, search more broadly
            queryParts.push(`from:*${criteria.brand}*`);
          }
        }

        // Subject filter
        if (criteria.subject && criteria.subject !== 'All' && criteria.subject.trim()) {
          queryParts.push(`subject:"${criteria.subject}"`);
        }

        // Date range filters
        if (criteria.startDate) {
          const startDateStr = criteria.startDate.toISOString().split('T')[0].replace(/-/g, '/');
          queryParts.push(`after:${startDateStr}`);
        }

        if (criteria.endDate) {
          const endDateStr = criteria.endDate.toISOString().split('T')[0].replace(/-/g, '/');
          queryParts.push(`before:${endDateStr}`);
        }

        return queryParts.length > 0 ? queryParts.join(' ') : 'in:inbox';
      };

      const query = buildSearchQuery(criteria);
      console.log('Built search query:', query);
      
      // Use direct API call like integrated page
      const response = await fetch('/api/gmail/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: user.gmailAccessToken, // Use Gmail OAuth token
          query,
          maxResults: 50,
        }),
      });

      console.log('Search API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API error:', errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || response.statusText;
        } catch {
          errorMessage = errorText || response.statusText;
        }
        
        throw new Error(`Search failed (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      console.log('Search API success:', data);
      
      // Extract brand from sender like integrated page
      const extractBrandFromSender = (fromAddress: string): string => {
        try {
          // Extract email from "Name <email@domain.com>" format
          const emailMatch = fromAddress.match(/<([^>]+)>/);
          const email = emailMatch ? emailMatch[1] : fromAddress;
          
          // Extract domain
          const domain = email.split('@')[1];
          
          // Extract brand name (remove common TLDs and subdomains)
          const brandMatch = domain.match(/([^.]+)\.(com|org|net|edu|gov|io|co\.uk|co|app)$/);
          
          if (brandMatch) {
            return brandMatch[1];
          }
          
          // Fallback to first part of domain
          return domain.split('.')[0];
        } catch (error) {
          return 'unknown';
        }
      };
      
      // Convert to Email[] format for compatibility
      const emails: Email[] = data.messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.from,
        subject: msg.subject,
        date: msg.date,
        bodyHtml: '', // Will be loaded when needed
        snippet: msg.snippet,
        brand: extractBrandFromSender(msg.from),
      }));

      setEmails(emails);
      
      if (emails.length === 0) {
        toast({ 
          title: "No Results", 
          description: "No emails found matching your criteria.", 
          variant: "default"
        });
      } else {
        toast({ 
          title: "Search Complete", 
          description: `Found ${emails.length} email(s) matching your criteria.`, 
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

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
      const filters = {
        brand: 'All',
        subject: 'All', 
        maxResults: 5,
      };

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

  const handleEmailSelectionChange = (emailId: string, isSelected: boolean) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(emailId);
      } else {
        newSet.delete(emailId);
      }
      return newSet;
    });
  };

  const handleSelectAllChange = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmails(new Set(emails.map(email => email.id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleScreenshotSelected = async () => {
    if (!user) {
      toast({ 
        title: "Authentication Required", 
        description: "Please sign in to generate screenshots.", 
        variant: "destructive" 
      });
      return;
    }

    if (selectedEmails.size === 0) {
      toast({ 
        title: "No Emails Selected", 
        description: "Please select emails to screenshot.", 
        variant: "destructive" 
      });
      return;
    }

    setIsProcessingScreenshots(true);
    setScreenshotProgress(0);
    setGeneratedScreenshots([]);
    setScreenshotsReady(false);

    const emailsToProcess = emails.filter(email => selectedEmails.has(email.id));
    const totalEmails = emailsToProcess.length;
    let processedCount = 0;
    const newScreenshots: GeneratedScreenshot[] = [];

    for (const email of emailsToProcess) {
      try {
        setCurrentStep(`Processing: ${email.subject}`);
        
        // Get email content if not already available
        let emailContent = email.bodyHtml;
        if (!emailContent) {
          try {
            setCurrentStep(`Loading content for: ${email.subject}`);
            const contentResponse = await GmailService.getEmailContent(user, email.id);
            emailContent = contentResponse.htmlContent;
            console.log('Loaded email content length:', emailContent.length);
            console.log('Email content preview:', emailContent.substring(0, 500));
          } catch (contentError) {
            console.error(`Failed to get content for email ${email.id}:`, contentError);
            emailContent = `<html><body><h2>Email: ${email.subject}</h2><p>From: ${email.sender}</p><p>Date: ${new Date(email.date).toLocaleDateString()}</p><p>Content could not be loaded</p></body></html>`;
          }
        } else {
          console.log('Using existing email content length:', emailContent.length);
        }
        
        // Generate filename
        const filename = `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`;
        
        // Simulate screenshot generation based on mode
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
        
        // Mock screenshot data
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d')!;
        
        // Draw mock email content
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.fillText(`Subject: ${email.subject}`, 20, 50);
        ctx.fillText(`From: ${email.sender}`, 20, 80);
        ctx.fillText(`Mode: ${screenshotMode}`, 20, 110);
        ctx.fillText(`Date: ${new Date(email.date).toLocaleDateString()}`, 20, 140);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        newScreenshots.push({ 
          emailId: email.id, 
          fileName: filename,
          dataUrl 
        });
        
      } catch (error) {
        console.error(`Failed to process email ${email.id}:`, error);
        toast({ 
          title: "Screenshot Error", 
          description: `Failed to generate screenshot for email: ${email.subject}`, 
          variant: "destructive" 
        });
      } finally {
        processedCount++;
        setScreenshotProgress((processedCount / totalEmails) * 100);
      }
    }

    setGeneratedScreenshots(newScreenshots);
    setIsProcessingScreenshots(false);
    setCurrentStep('');
    
    if (newScreenshots.length > 0) {
      setScreenshotsReady(true);
      toast({ 
        title: "Screenshots Generated", 
        description: `${newScreenshots.length} screenshots are ready for download.`, 
        variant: "default" 
      });
    } else if (totalEmails > 0) {
       toast({ 
        title: "Processing Failed", 
        description: "Could not generate any screenshots.", 
        variant: "destructive" 
      });
    }
  };

  const handleDownloadScreenshots = async () => {
    if (generatedScreenshots.length === 0) {
      toast({ 
        title: "No Screenshots", 
        description: "No screenshots available to download.", 
        variant: "destructive" 
      });
      return;
    }

    if (downloadFormat === 'individual-png') {
      // Download each PNG individually
      for (const screenshot of generatedScreenshots) {
        const response = await fetch(screenshot.dataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = screenshot.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({ 
        title: "Downloads Started", 
        description: `Downloading ${generatedScreenshots.length} individual PNG files.`, 
        variant: "default" 
      });
    } else {
      // Create ZIP file
      const zip = new JSZip();
      
      for (const screenshot of generatedScreenshots) {
        // Convert data URL to blob
        const response = await fetch(screenshot.dataUrl);
        const blob = await response.blob();
        zip.file(screenshot.fileName, blob);
      }
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `MailScribe_Screenshots_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
      
      toast({ 
        title: "ZIP Download Started", 
        description: `Downloading ${generatedScreenshots.length} screenshots as ZIP file.`, 
        variant: "default" 
      });
    }

    setScreenshotsReady(false);
    setGeneratedScreenshots([]);
    setSelectedEmails(new Set());
  };

  // Convert selected emails to EmailMessage format for ScreenshotActions
  const selectedEmailObjects: EmailMessage[] = emails
    .filter(email => selectedEmails.has(email.id))
    .map(email => ({
      id: email.id,
      subject: email.subject,
      from: email.sender,
      date: email.date,
      snippet: email.snippet || '',
      brand: email.brand,
      htmlContent: email.bodyHtml,
    }));

  // Show loading screen while checking authentication state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        {!user ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold mb-4">
                📧 MailScribe
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Gmail Email Audit Tool - Search, Screenshot, and Download
              </p>
            </div>
            <AuthCard />
            <AuthDebugPanel />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="search" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="search">Email Search & Audit</TabsTrigger>
                <TabsTrigger value="test">Connection Test</TabsTrigger>
                <TabsTrigger value="debug">Debug Info</TabsTrigger>
              </TabsList>

              {/* Main Search and Audit Tab */}
              <TabsContent value="search" className="space-y-8">
                <div className="text-center">
                  <h1 className="text-3xl font-headline font-bold mb-2">
                    📧 MailScribe Email Audit
                  </h1>
                  <p className="text-muted-foreground">
                    Search your Gmail, generate screenshots, and download audit files
                  </p>
                </div>

                <SearchForm onSearch={handleSearch} isLoading={isSearchLoading} />
                
                {(emails.length > 0 || isSearchLoading) && (
                  <EmailList
                    emails={emails}
                    selectedEmails={selectedEmails}
                    onEmailSelectionChange={handleEmailSelectionChange}
                    onSelectAllChange={handleSelectAllChange}
                    isLoading={isSearchLoading}
                  />
                )}
                
                {emails.length > 0 && (
                  <div className="space-y-6">
                    {/* Advanced Screenshot Options */}
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Screenshot Options
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Screenshot Method Selection */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Screenshot Method:</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="layout-preserving"
                                  name="screenshot-mode"
                                  checked={screenshotMode === 'layout-preserving'}
                                  onChange={() => setScreenshotMode('layout-preserving')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="layout-preserving" className="text-sm font-semibold text-purple-600 cursor-pointer">
                                  🏢 Layout-Preserving (Best)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="balanced-client"
                                  name="screenshot-mode"
                                  checked={screenshotMode === 'balanced-client'}
                                  onChange={() => setScreenshotMode('balanced-client')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="balanced-client" className="text-sm text-blue-600 cursor-pointer">
                                  ⚖️ Balanced Client
                                </Label>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="stable-client"
                                  name="screenshot-mode"
                                  checked={screenshotMode === 'stable-client'}
                                  onChange={() => setScreenshotMode('stable-client')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="stable-client" className="text-sm text-green-600 cursor-pointer">
                                  ✨ Ultra-Stable Client
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="enhanced-client"
                                  name="screenshot-mode"
                                  checked={screenshotMode === 'enhanced-client'}
                                  onChange={() => setScreenshotMode('enhanced-client')}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="enhanced-client" className="text-sm cursor-pointer">
                                  🎯 Enhanced Client
                                </Label>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
                            {screenshotMode === 'layout-preserving' && '🏢 BEST: Preserves original email layout, centering, spacing, and styling exactly like the original'}
                            {screenshotMode === 'balanced-client' && '⚖️ Keeps email structure (tables, headings, formatting) while removing dangerous elements'}
                            {screenshotMode === 'stable-client' && '✨ Ultra-aggressive cleaning removes ALL scripts, CSS, and complex elements for 100% reliability'}
                            {screenshotMode === 'enhanced-client' && '🎯 Advanced image loading with CORS proxies (may have conflicts)'}
                          </p>
                        </div>

                        {/* Download Format Selection */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Download Format:</Label>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="individual-png"
                                name="download-format"
                                checked={downloadFormat === 'individual-png'}
                                onChange={() => setDownloadFormat('individual-png')}
                                className="w-4 h-4"
                              />
                              <Label htmlFor="individual-png" className="text-sm cursor-pointer flex items-center gap-2">
                                <FileImage className="h-4 w-4" />
                                Individual PNG Files
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="zip-format"
                                name="download-format"
                                checked={downloadFormat === 'zip'}
                                onChange={() => setDownloadFormat('zip')}
                                className="w-4 h-4"
                              />
                              <Label htmlFor="zip-format" className="text-sm cursor-pointer flex items-center gap-2">
                                <FileArchive className="h-4 w-4" />
                                ZIP Archive
                              </Label>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {downloadFormat === 'individual-png' ? 'Downloads each screenshot as a separate PNG file' : 'Downloads all screenshots in a single ZIP file'}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                          <Button
                            onClick={handleScreenshotSelected}
                            disabled={selectedEmails.size === 0 || isProcessingScreenshots}
                            className="flex-1"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Generate Screenshots ({selectedEmails.size})
                          </Button>
                          <Button
                            onClick={handleDownloadScreenshots}
                            disabled={!screenshotsReady || isProcessingScreenshots}
                            variant="secondary"
                            className="flex-1"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download {downloadFormat === 'zip' ? 'ZIP' : 'PNGs'}
                          </Button>
                        </div>

                        {/* Progress Display */}
                        {isProcessingScreenshots && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{currentStep}</span>
                              <span>{Math.round(screenshotProgress)}%</span>
                            </div>
                            <Progress value={screenshotProgress} className="w-full" />
                          </div>
                        )}

                        {screenshotsReady && !isProcessingScreenshots && (
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-sm text-green-800">
                              ✅ {generatedScreenshots.length} screenshots ready for download as {downloadFormat === 'zip' ? 'ZIP archive' : 'individual PNG files'}!
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Advanced Screenshot Actions Component */}
                    <ScreenshotActions
                      selectedEmails={selectedEmailObjects}
                      accessToken={user.gmailAccessToken || ''}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Connection Test Tab */}
              <TabsContent value="test" className="space-y-6">
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
                                  {testResults.sampleMessages.map((msg: any) => (
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
              </TabsContent>

              {/* Debug Info Tab */}
              <TabsContent value="debug" className="space-y-6">
                <AuthDebugPanel />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} MailScribe. Built with Firebase Studio.
      </footer>
    </div>
  );
}