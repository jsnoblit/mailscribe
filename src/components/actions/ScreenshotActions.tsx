'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Camera, Download, FileText, Loader2 } from 'lucide-react';
import { EmailMessage } from '@/types';
import { GmailService } from '@/lib/gmail-service';
import { EmailScreenshotService } from '@/lib/screenshot-service';

interface ScreenshotActionsProps {
  selectedEmails: EmailMessage[];
  accessToken: string;
}

const ScreenshotActions: React.FC<ScreenshotActionsProps> = ({
  selectedEmails,
  accessToken,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const handleSingleScreenshot = async (email: EmailMessage) => {
    if (!email.htmlContent) {
      toast({
        title: "Error",
        description: "Email content not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setCurrentStep(`Taking screenshot of: ${email.subject}`);
      
      const filename = `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_')}_${email.id}.png`;
      
      await EmailScreenshotService.captureEmailScreenshot(
        email.htmlContent,
        email.id,
        { filename }
      );

      toast({
        title: "Success",
        description: `Screenshot saved: ${filename}`,
      });
    } catch (error) {
      console.error('Screenshot error:', error);
      toast({
        title: "Error",
        description: "Failed to take screenshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const handleBatchScreenshots = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "No emails selected",
        description: "Please select at least one email to screenshot.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setCurrentStep('Loading email content...');

      // Get HTML content for emails that don't have it
      const emailsNeedingContent = selectedEmails.filter(email => !email.htmlContent);
      const emailsWithContent = selectedEmails.filter(email => email.htmlContent);

      let allEmailsWithContent = [...emailsWithContent];

      if (emailsNeedingContent.length > 0) {
        setCurrentStep(`Loading content for ${emailsNeedingContent.length} emails...`);
        const loadedEmails = await GmailService.getBatchEmailContent(
          accessToken,
          emailsNeedingContent
        );
        allEmailsWithContent = [...allEmailsWithContent, ...loadedEmails];
      }

      setProgress(30);
      setCurrentStep('Generating screenshots...');

      // Take screenshots
      const result = await EmailScreenshotService.batchCaptureScreenshots(allEmailsWithContent);
      
      setProgress(100);
      setCurrentStep('Complete!');

      toast({
        title: "Screenshots Complete",
        description: `Successfully captured ${result.success.length} screenshots. ${result.failed.length} failed.`,
      });

      if (result.failed.length > 0) {
        console.warn('Failed screenshots:', result.failed);
      }
    } catch (error) {
      console.error('Batch screenshot error:', error);
      toast({
        title: "Error",
        description: "Failed to complete batch screenshots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const handleBatchZip = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "No emails selected",
        description: "Please select at least one email to screenshot.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setCurrentStep('Loading email content...');

      // Get HTML content for emails that don't have it
      const emailsNeedingContent = selectedEmails.filter(email => !email.htmlContent);
      const emailsWithContent = selectedEmails.filter(email => email.htmlContent);

      let allEmailsWithContent = [...emailsWithContent];

      if (emailsNeedingContent.length > 0) {
        setCurrentStep(`Loading content for ${emailsNeedingContent.length} emails...`);
        const loadedEmails = await GmailService.getBatchEmailContent(
          accessToken,
          emailsNeedingContent
        );
        allEmailsWithContent = [...allEmailsWithContent, ...loadedEmails];
      }

      setProgress(30);
      setCurrentStep('Creating ZIP with screenshots...');

      // Create ZIP file
      const zipFilename = `email_audit_${new Date().toISOString().split('T')[0]}.zip`;
      await EmailScreenshotService.createScreenshotZip(allEmailsWithContent, zipFilename);
      
      setProgress(100);
      setCurrentStep('Complete!');

      toast({
        title: "ZIP Download Complete",
        description: `Downloaded ${zipFilename} with ${allEmailsWithContent.length} screenshots.`,
      });
    } catch (error) {
      console.error('ZIP creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create ZIP file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Camera className="mr-2 h-5 w-5 text-primary" />
          Screenshot Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">{currentStep}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleBatchScreenshots}
              disabled={isProcessing || selectedEmails.length === 0}
              className="flex items-center space-x-2"
            >
              <Camera className="h-4 w-4" />
              <span>
                Take Screenshots ({selectedEmails.length})
              </span>
            </Button>

            <Button
              onClick={handleBatchZip}
              disabled={isProcessing || selectedEmails.length === 0}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>
                Download ZIP ({selectedEmails.length})
              </span>
            </Button>
          </div>

          {selectedEmails.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select emails from the search results to enable screenshot actions.
            </p>
          )}

          {selectedEmails.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p>Selected emails:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {selectedEmails.slice(0, 5).map((email) => (
                  <li key={email.id} className="truncate">
                    {email.subject} - {email.brand || 'unknown'}
                  </li>
                ))}
                {selectedEmails.length > 5 && (
                  <li className="text-muted-foreground">... and {selectedEmails.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScreenshotActions;
