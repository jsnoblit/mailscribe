'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, Download, FileText, Loader2 } from 'lucide-react';
import { EmailMessage } from '@/types/email';
import { ServerScreenshotService } from '@/lib/server-screenshot-service';

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
    try {
      setIsProcessing(true);
      setCurrentStep(`Capturing screenshot for: ${email.subject}`);

      const filename = `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`;

      await ServerScreenshotService.captureServerScreenshot(
        email.id,
        accessToken,
        email.brand,
        filename
      );

      toast({
        title: "Success",
        description: "Screenshot saved successfully!",
      });
    } catch (error: any) {
      console.error('Screenshot error:', error);
      toast({
        title: "Error",
        description: `Failed to take screenshot: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  if (!accessToken) {
    return (
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <Camera className="mr-2 h-5 w-5 text-primary" />
            Advanced Screenshot Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Access token required for advanced screenshot features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Camera className="mr-2 h-5 w-5 text-primary" />
          Advanced Screenshot Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm">Screenshots will be generated on the server using Puppeteer and downloaded automatically.</p>
          </div>

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
              onClick={() => selectedEmails.length > 0 && handleSingleScreenshot(selectedEmails[0])}
              disabled={isProcessing || selectedEmails.length === 0}
              className="flex items-center space-x-2"
            >
              <Camera className="h-4 w-4" />
              <span>
                Test Advanced Screenshot ({selectedEmails.length > 0 ? '1' : '0'})
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
                {selectedEmails.slice(0, 3).map((email) => (
                  <li key={email.id} className="truncate">
                    {email.subject} - {email.brand || 'unknown'}
                  </li>
                ))}
                {selectedEmails.length > 3 && (
                  <li className="text-muted-foreground">... and {selectedEmails.length - 3} more</li>
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
