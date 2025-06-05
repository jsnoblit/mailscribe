'use client';

import { useState, useEffect } from 'react';
import type React from 'react';
import Header from '@/components/shared/Header';
import AuthCard from '@/components/auth/AuthCard';
import SearchForm from '@/components/search/SearchForm';
import EmailList from '@/components/results/EmailList';
import ActionPanel from '@/components/actions/ActionPanel';
import type { Email, SearchCriteria, GeneratedScreenshot } from '@/types';
import { useToast } from '@/hooks/use-toast';
// import { nameScreenshotFile } from '@/ai/flows/name-screenshot-file'; // For actual GenAI call

// Mock function for nameScreenshotFile (simulates backend AI call)
const mockNameScreenshotFile = async (emailContent: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Basic simulation of filename generation
      const summary = emailContent.substring(0, 30).replace(/\W+/g, '_');
      resolve(`${summary}_screenshot_${Date.now()}`);
    }, 300); // Simulate AI processing time
  });
};


export default function MailScribePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Mock auth state
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  
  const [isProcessingScreenshots, setIsProcessingScreenshots] = useState(false);
  const [screenshotProgress, setScreenshotProgress] = useState(0);
  const [generatedScreenshots, setGeneratedScreenshots] = useState<GeneratedScreenshot[]>([]);
  const [screenshotsReady, setScreenshotsReady] = useState(false);

  const { toast } = useToast();

  // Simulate checking auth status on mount
  useEffect(() => {
    // In a real app, you'd check Firebase Auth state here
    // For now, let's assume user is not authenticated initially
    // To test authenticated view, set this to true:
    // setIsAuthenticated(true); 
  }, []);

  const handleAuthenticate = async () => {
    setIsAuthLoading(true);
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsAuthenticated(true);
    setIsAuthLoading(false);
    toast({
      title: "Authentication Successful",
      description: "You are now connected to your Gmail account.",
      variant: "default",
    });
  };

  const handleSearch = async (criteria: SearchCriteria) => {
    setIsSearchLoading(true);
    setEmails([]); // Clear previous results
    setSelectedEmails(new Set()); // Clear selections
    setGeneratedScreenshots([]);
    setScreenshotsReady(false);

    console.log("Searching with criteria:", criteria);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock data
    const mockResults: Email[] = [
      { id: '1', sender: 'sender1@example.com', subject: 'Your Weekly Digest', date: new Date(2023, 10, 1).toISOString(), bodyHtml: '<html><body><h1>Digest</h1><p>Content here...</p></body></html>' },
      { id: '2', sender: 'promotions@brand.com', subject: 'Big Sale This Weekend!', date: new Date(2023, 10, 2).toISOString(), bodyHtml: '<html><body><p>Sale details...</p></body></html>' },
      { id: '3', sender: 'support@service.com', subject: 'Re: Your Inquiry', date: new Date(2023, 10, 3).toISOString(), bodyHtml: '<html><body><p>Regarding your question...</p></body></html>' },
      { id: '4', sender: criteria.brand || 'dynamic-sender@example.com', subject: criteria.subject || 'Dynamic Subject based on search', date: new Date().toISOString(), bodyHtml: `<html><body><p>Email related to ${criteria.brand} and ${criteria.subject}</p></body></html>`},
    ];
    
    // Filter mock data based on criteria (basic simulation)
    let filteredResults = mockResults;
    if (criteria.brand && criteria.brand.toLowerCase() !== "all") {
        filteredResults = filteredResults.filter(email => email.sender.includes(criteria.brand));
    }
    if (criteria.subject && criteria.subject.toLowerCase() !== "all") {
        filteredResults = filteredResults.filter(email => email.subject.toLowerCase().includes(criteria.subject.toLowerCase()));
    }
    if (criteria.startDate) {
        filteredResults = filteredResults.filter(email => new Date(email.date) >= criteria.startDate!);
    }
    if (criteria.endDate) {
        filteredResults = filteredResults.filter(email => new Date(email.date) <= criteria.endDate!);
    }


    setEmails(filteredResults.slice(0, Math.max(1, filteredResults.length))); // Show at least one result if any filters match
    setIsSearchLoading(false);
    if (filteredResults.length === 0) {
        toast({ title: "No Results", description: "No emails found matching your criteria.", variant: "default"});
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
    if (selectedEmails.size === 0) {
      toast({ title: "No Emails Selected", description: "Please select emails to screenshot.", variant: "destructive" });
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
        // Simulate fetching email content if not already available (it is in mock data)
        const emailContent = email.bodyHtml || `Content of email ${email.id}`;
        
        // Use the mock GenAI function for filename
        const fileName = await mockNameScreenshotFile(emailContent);
        
        // Simulate screenshot generation (Puppeteer on backend)
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); // Simulate variable processing time
        
        // Mock screenshot data (e.g., a data URL or a placeholder URL)
        const dataUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=`; // 1x1 transparent PNG

        newScreenshots.push({ emailId: email.id, fileName: `${fileName}.png`, dataUrl });
        
      } catch (error) {
        console.error(`Failed to process email ${email.id}:`, error);
        toast({ title: "Screenshot Error", description: `Failed to generate screenshot for email: ${email.subject}`, variant: "destructive" });
      } finally {
        processedCount++;
        setScreenshotProgress((processedCount / totalEmails) * 100);
      }
    }

    setGeneratedScreenshots(newScreenshots);
    setIsProcessingScreenshots(false);
    
    if (newScreenshots.length > 0) {
      setScreenshotsReady(true);
      toast({ title: "Screenshots Generated", description: `${newScreenshots.length} screenshots are ready for download.`, variant: "default" });
    } else if (totalEmails > 0) {
       toast({ title: "Processing Failed", description: "Could not generate any screenshots.", variant: "destructive" });
    }
  };

  const handleDownloadAll = () => {
    if (generatedScreenshots.length === 0) {
      toast({ title: "No Screenshots", description: "No screenshots available to download.", variant: "destructive" });
      return;
    }
    
    // Simulate ZIP download
    // In a real app, you might use JSZip client-side or a backend endpoint for server-side zipping
    const zipFileName = `MailScribe_Screenshots_${Date.now()}.zip`;
    console.log("Downloading ZIP:", zipFileName, "with files:", generatedScreenshots.map(s => s.fileName));

    // Create a dummy link and click it to simulate download
    // For actual files, you'd populate this with blob data from JSZip
    const dummyContent = generatedScreenshots.map(s => `File: ${s.fileName}\n(content of ${s.emailId})\n\n`).join('');
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Download Started", description: `Downloading ${zipFileName}`, variant: "default" });
    setScreenshotsReady(false); // Reset ready state after download
    setGeneratedScreenshots([]); // Clear generated screenshots
    setSelectedEmails(new Set()); // Optionally clear selection
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        {!isAuthenticated ? (
          <AuthCard onAuthenticate={handleAuthenticate} isLoading={isAuthLoading} />
        ) : (
          <div className="space-y-8">
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
              <ActionPanel
                selectedCount={selectedEmails.size}
                onScreenshotSelected={handleScreenshotSelected}
                onDownloadAll={handleDownloadAll}
                isProcessingScreenshots={isProcessingScreenshots}
                screenshotProgress={screenshotProgress}
                screenshotsReady={screenshotsReady}
              />
            )}
          </div>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} MailScribe. Built with Firebase Studio.
      </footer>
    </div>
  );
}
