'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestScreenshots: React.FC = () => {
  const testScreenshot = async () => {
    try {
      console.log('Testing screenshot functionality...');
      
      // Test 1: Check if html2canvas loads
      const html2canvas = (await import('html2canvas')).default;
      console.log('✅ html2canvas loaded successfully');
      
      // Test 2: Check if JSZip loads
      const JSZip = (await import('jszip')).default;
      console.log('✅ JSZip loaded successfully');
      
      // Test 3: Create a simple screenshot
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<h1 style="color: red; padding: 20px;">Test Screenshot</h1>';
      testDiv.style.position = 'fixed';
      testDiv.style.top = '-9999px';
      testDiv.style.backgroundColor = 'white';
      testDiv.style.width = '400px';
      testDiv.style.height = '200px';
      
      document.body.appendChild(testDiv);
      
      const canvas = await html2canvas(testDiv);
      console.log('✅ Screenshot created successfully');
      
      // Test 4: Create blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });
      console.log('✅ Blob created successfully, type:', blob.type, 'size:', blob.size);
      
      // Test 5: Create ZIP
      const zip = new JSZip();
      zip.file('test-screenshot.png', blob);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('✅ ZIP created successfully, type:', zipBlob.type, 'size:', zipBlob.size);
      
      // Test 6: Download ZIP
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'test-screenshots.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ ZIP download initiated');
      
      // Cleanup
      document.body.removeChild(testDiv);
      
      alert('Test completed! Check console for details and downloads folder for test-screenshots.zip');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      alert(`Test failed: ${error.message}`);
    }
  };

  const testSinglePNG = async () => {
    try {
      console.log('Testing single PNG download...');
      
      const html2canvas = (await import('html2canvas')).default;
      
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<h1 style="color: blue; padding: 20px; background: yellow;">Single PNG Test</h1>';
      testDiv.style.position = 'fixed';
      testDiv.style.top = '-9999px';
      testDiv.style.backgroundColor = 'white';
      testDiv.style.width = '400px';
      testDiv.style.height = '200px';
      
      document.body.appendChild(testDiv);
      
      const canvas = await html2canvas(testDiv);
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'test-single.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      document.body.removeChild(testDiv);
      
      console.log('✅ Single PNG download completed');
      alert('Single PNG test completed!');
      
    } catch (error) {
      console.error('❌ Single PNG test failed:', error);
      alert(`Single PNG test failed: ${error.message}`);
    }
  };

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle>Screenshot Test Page</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use these tests to debug screenshot functionality. Check browser console for detailed logs.
          </p>
          
          <div className="flex gap-3">
            <Button onClick={testSinglePNG} variant="outline">
              Test Single PNG Download
            </Button>
            
            <Button onClick={testScreenshot}>
              Test ZIP Download
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p><strong>What these tests do:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check if html2canvas and JSZip libraries load correctly</li>
              <li>Create a simple screenshot of HTML content</li>
              <li>Convert screenshot to PNG blob</li>
              <li>Create ZIP file with the PNG</li>
              <li>Download the file</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestScreenshots;
