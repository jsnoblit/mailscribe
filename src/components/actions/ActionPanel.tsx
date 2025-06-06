'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Camera, Download, Zap } from 'lucide-react';

interface ActionPanelProps {
  selectedCount: number;
  onScreenshotSelected: () => void;
  onDownloadAll: () => void;
  isProcessingScreenshots: boolean;
  screenshotProgress: number; // 0 to 100
  screenshotsReady: boolean;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  selectedCount,
  onScreenshotSelected,
  onDownloadAll,
  isProcessingScreenshots,
  screenshotProgress,
  screenshotsReady,
}) => {
  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Zap className="mr-2 h-5 w-5 text-primary" />
          Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button
            onClick={onScreenshotSelected}
            disabled={selectedCount === 0 || isProcessingScreenshots}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Camera className="mr-2 h-4 w-4" />
            Screenshot Selected ({selectedCount})
          </Button>
          <Button
            onClick={onDownloadAll}
            disabled={!screenshotsReady || isProcessingScreenshots || selectedCount === 0}
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All Screenshots
          </Button>
        </div>
        {isProcessingScreenshots && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="screenshotProgress" className="text-sm font-medium">
              Processing Screenshots... ({Math.round(screenshotProgress)}%)
            </Label>
            <Progress id="screenshotProgress" value={screenshotProgress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground">
              Generating full-content PNGs. This may take a while for large batches.
            </p>
          </div>
        )}
        {screenshotsReady && !isProcessingScreenshots && selectedCount > 0 && (
           <p className="text-sm text-green-600 dark:text-green-400">
            Screenshots are ready for download.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionPanel;
