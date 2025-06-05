'use client';

import type React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Email } from '@/types';
import { Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onSelectionChange: (isSelected: boolean) => void;
}

const EmailListItem: React.FC<EmailListItemProps> = ({ email, isSelected, onSelectionChange }) => {
  const formattedDate = email.date ? format(parseISO(email.date), 'PPp') : 'N/A';

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex items-center space-x-4">
        <Checkbox
          id={`email-${email.id}`}
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(checked as boolean)}
          aria-label={`Select email from ${email.sender} with subject ${email.subject}`}
        />
        <Label htmlFor={`email-${email.id}`} className="flex-grow cursor-pointer">
          <div className="flex items-center">
             <Mail className="h-5 w-5 mr-3 text-muted-foreground flex-shrink-0" />
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-foreground truncate" title={email.sender}>
                  {email.sender}
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
