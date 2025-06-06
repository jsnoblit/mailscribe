'use client';

import { useState } from 'react';
import type React from 'react';
import Header from '@/components/shared/Header';
import SearchForm from '@/components/search/SearchForm';
import EmailList from '@/components/results/EmailList';
import ScreenshotActions from '@/components/actions/ScreenshotActions';
import type { EmailMessage, SearchCriteria } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function IntegratedMailScribePage() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const { toast } = useToast();

  const handleAuthenticate = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Missing Access Token",
        description: "Please enter a Gmail access token",
        variant: "destructive",
      });
      return;
    }

    setIsAuthenticated(true);
    toast({
      title: "Authentication Successful",
      description: "You can now search your Gmail account.",
    });
  };

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

  const handleSearch = async (criteria: SearchCriteria) => {
    if (!isAuthenticated || !accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please authenticate with Gmail first.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchLoading(true);
    setEmails([]);
    setSelectedEmails(new Set());

    try {
      console.log("Searching with criteria:", criteria);
      
      const query = buildSearchQuery(criteria);
      console.log('Built search query:', query);
      
      const response = await fetch('/api/gmail/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          query,
          maxResults: criteria.maxResults || 50,
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
      
      // Add brand information to emails
      const emailsWithBrands = data.messages.map((email: any) => ({
        ...email,
        brand: extractBrandFromSender(email.from),
      }));
      
      setEmails(emailsWithBrands);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.messages.length} emails (${data.totalResults} total matches)`,
      });
    } catch (error) {
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

  // Convert selected email IDs to EmailMessage objects
  const selectedEmailObjects = emails.filter(email => selectedEmails.has(email.id));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        {!isAuthenticated ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gmail Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="accessToken">Gmail Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Paste your Gmail access token here"
                  />
                </div>
                
                <Button onClick={handleAuthenticate}>
                  Connect to Gmail
                </Button>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>To get an access token:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Go to <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline text-blue-600">OAuth 2.0 Playground</a></li>
                    <li>Find "Gmail API v1" and check "https://www.googleapis.com/auth/gmail.readonly"</li>
                    <li>Click "Authorize APIs" and sign in</li>
                    <li>Click "Exchange authorization code for tokens"</li>
                    <li>Copy the "Access token" and paste it above</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✅ Connected to Gmail successfully
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
              <ScreenshotActions
                selectedEmails={selectedEmailObjects}
                accessToken={accessToken}
              />
            )}
          </div>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} MailScribe. Built for email auditing.
      </footer>
    </div>
  );
}
