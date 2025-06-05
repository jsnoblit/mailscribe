'use client';

import type React from 'react';
import type { Email } from '@/types';
import EmailListItem from './EmailListItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

interface EmailListProps {
  emails: Email[];
  selectedEmails: Set<string>; // Set of email IDs
  onEmailSelectionChange: (emailId: string, isSelected: boolean) => void;
  onSelectAllChange: (isSelected: boolean) => void;
  isLoading: boolean;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmails,
  onEmailSelectionChange,
  onSelectAllChange,
  isLoading,
}) => {
  const allSelected = emails.length > 0 && emails.every(email => selectedEmails.has(email.id));
  const someSelected = emails.some(email => selectedEmails.has(email.id)) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    onSelectAllChange(checked);
  };

  if (isLoading) {
    return (
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Search Results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <div className="animate-pulse">
            <p className="text-muted-foreground">Loading emails...</p>
            {/* You can add a spinner or more detailed skeleton here */}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!emails.length && !isLoading) {
     return (
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
             <FileText className="mr-2 h-5 w-5 text-primary" />
            Search Results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">No emails found matching your criteria. Try broadening your search.</p>
        </CardContent>
      </Card>
     );
  }


  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-xl flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Search Results ({emails.length})
          </CardTitle>
          {emails.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all emails"
                data-state={allSelected ? 'checked' : someSelected ? 'indeterminate' : 'unchecked'}
              />
              <Label htmlFor="selectAll" className="text-sm font-medium">
                Select All
              </Label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-3"> {/* Adjust height as needed */}
          {emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={selectedEmails.has(email.id)}
              onSelectionChange={(isSelected) => onEmailSelectionChange(email.id, isSelected)}
            />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EmailList;
