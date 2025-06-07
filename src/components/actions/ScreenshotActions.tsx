'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, Download, FileText, Loader2 } from 'lucide-react';
import { EmailMessage } from '@/types';
import { GmailService } from '@/lib/gmail-service';
import { EmailScreenshotService } from '@/lib/screenshot-service';
import { ServerScreenshotService } from '@/lib/server-screenshot-service';
import { HybridScreenshotService } from '@/lib/hybrid-screenshot-service';
import { BalancedScreenshotService } from '@/lib/balanced-screenshot-service';
import { LayoutPreservingScreenshotService } from '@/lib/layout-preserving-screenshot-service';
import { UltraStableScreenshotService } from '@/lib/ultra-stable-screenshot-service';

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
  const [screenshotMode, setScreenshotMode] = useState<'layout-preserving' | 'balanced-client' | 'stable-client' | 'enhanced-client'>('layout-preserving');
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const handleSingleScreenshot = async (email: EmailMessage) => {
    try {
      setIsProcessing(true);
      setCurrentStep(`Loading content for: ${email.subject}`);
      
      // Check if we need to load email content
      let emailWithContent = email;
      if (!email.htmlContent) {
        console.log('🔍 Loading email content for:', email.id);
        
        // Load the email content using Gmail service with direct API call (like integrated page)
        const response = await fetch('/api/gmail/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            messageId: email.id,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to load email content: ${response.statusText}`);
        }

        const contentData = await response.json();
        emailWithContent = {
          ...email,
          htmlContent: contentData.htmlContent,
        };
        console.log('📧 Email content loaded successfully!');
        console.log('📊 Content length:', contentData.htmlContent.length);
        console.log('📄 Content preview:', contentData.htmlContent.substring(0, 200));
      } else {
        console.log('📧 Using existing email content, length:', email.htmlContent.length);
      }
      
      if (!emailWithContent.htmlContent) {
        toast({
          title: "Error",
          description: "Could not load email content. Please check your access token.",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentStep(`Taking screenshot of: ${email.subject}`);
      
      if (screenshotMode === 'layout-preserving') {
        const screenshot = await LayoutPreservingScreenshotService.captureLayoutPreservingScreenshot(
          emailWithContent.htmlContent,
          `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`
        );
        
        // Download the screenshot
        const response = await fetch(screenshot);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Layout-preserving screenshot saved successfully!",
        });
      } else if (screenshotMode === 'balanced-client') {
        const screenshot = await BalancedScreenshotService.captureBalancedScreenshot(
          emailWithContent.htmlContent,
          `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`
        );
        
        // Download the screenshot
        const response = await fetch(screenshot);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Balanced screenshot saved successfully!",
        });
      } else if (screenshotMode === 'stable-client') {
        const screenshot = await UltraStableScreenshotService.captureUltraStableScreenshot(
          emailWithContent.htmlContent,
          `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`
        );
        
        // Download the screenshot
        const response = await fetch(screenshot);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${email.brand || 'unknown'}_${email.subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'email'}_${email.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Ultra-stable screenshot saved successfully!",
        });
      } else {
        // Handle other modes...
        toast({
          title: "Info",
          description: "Other screenshot modes coming soon!",
        });
      }
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
          <div className="p-3 bg-blue-50 rounded-lg space-y-3">
            <Label className="text-sm font-medium">Screenshot Method:</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="layout-preserving-mode-advanced"
                  name="screenshot-mode-advanced"
                  checked={screenshotMode === 'layout-preserving'}
                  onChange={() => setScreenshotMode('layout-preserving')}
                  className="w-4 h-4"
                />
                <Label htmlFor="layout-preserving-mode-advanced" className="text-sm font-semibold text-purple-600">
                  🏢 Layout-Preserving (Best) - Maintains original email layout exactly
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="balanced-client-mode-advanced"
                  name="screenshot-mode-advanced"
                  checked={screenshotMode === 'balanced-client'}
                  onChange={() => setScreenshotMode('balanced-client')}
                  className="w-4 h-4"
                />
                <Label htmlFor="balanced-client-mode-advanced" className="text-sm text-blue-600">
                  ⚖️ Balanced Client - Preserves structure, avoids errors
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="stable-client-mode-advanced"
                  name="screenshot-mode-advanced"
                  checked={screenshotMode === 'stable-client'}
                  onChange={() => setScreenshotMode('stable-client')}
                  className="w-4 h-4"
                />
                <Label htmlFor="stable-client-mode-advanced" className="text-sm text-green-600">
                  ✨ Ultra-Stable Client - Zero errors, minimal structure
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="enhanced-client-mode-advanced"
                  name="screenshot-mode-advanced"
                  checked={screenshotMode === 'enhanced-client'}
                  onChange={() => setScreenshotMode('enhanced-client')}
                  className="w-4 h-4"
                />
                <Label htmlFor="enhanced-client-mode-advanced" className="text-sm">
                  🎯 Enhanced Client - Advanced image handling (may have conflicts)
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {screenshotMode === 'layout-preserving' && '🏢 BEST: Preserves original email layout, centering, spacing, and styling exactly like the original'}
              {screenshotMode === 'balanced-client' && '⚖️ Keeps email structure (tables, headings, formatting) while removing dangerous elements'}
              {screenshotMode === 'stable-client' && '✨ Ultra-aggressive cleaning removes ALL scripts, CSS, and complex elements for 100% reliability'}
              {screenshotMode === 'enhanced-client' && '🎯 Advanced image loading with CORS proxies (may have conflicts)'}
            </p>
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
