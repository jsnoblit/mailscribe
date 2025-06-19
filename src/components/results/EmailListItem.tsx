'use client';

import type React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { EmailMessage } from '@/types/email';
import { Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface EmailListItemProps {
  email: EmailMessage;
  isSelected: boolean;
  onSelectionChange: (isSelected: boolean) => void;
}

const EmailListItem: React.FC<EmailListItemProps> = ({ email, isSelected, onSelectionChange }) => {
  // Handle different date formats from Gmail API
  const formatEmailDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      // Try parsing as RFC 2822 format first (Gmail API format)
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If that fails, try ISO format
        return format(parseISO(dateString), 'PPp');
      }
      return format(date, 'PPp');
    } catch (error) {
      console.warn('Failed to parse date:', dateString, error);
      return dateString; // Return original string if parsing fails
    }
  };

  const formattedDate = formatEmailDate(email.date);

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex items-center space-x-4">
        <Checkbox
          id={`email-${email.id}`}
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(checked as boolean)}
          aria-label={`Select email from ${email.from} with subject ${email.subject}`}
        />
        <Label htmlFor={`email-${email.id}`} className="flex-grow cursor-pointer">
          <div className="flex items-center">
             <Mail className="h-5 w-5 mr-3 text-muted-foreground flex-shrink-0" />
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-foreground truncate" title={email.from}>
                  {email.from}
                </p>
                <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formattedDate}
                </p>
              </div>
              <p className="text-sm text-muted-foreground truncate" title={email.subject}>
                {email.subject}
              </p>
            </div>
          </div>
        </Label>
      </CardContent>
    </Card>
  );
};

export default EmailListItem;
