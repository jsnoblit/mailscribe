'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Search, Clock } from 'lucide-react';
import type { SearchCriteria } from '@/types';

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
  initialCriteria?: Partial<SearchCriteria>;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading, initialCriteria }) => {
  const [brand, setBrand] = useState(initialCriteria?.brand || '');
  const [subject, setSubject] = useState(initialCriteria?.subject || '');
  const [startDate, setStartDate] = useState<Date | undefined>(initialCriteria?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialCriteria?.endDate);
  const [startTime, setStartTime] = useState(initialCriteria?.startTime || '');
  const [endTime, setEndTime] = useState(initialCriteria?.endTime || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      brand: brand.trim() === '' || brand.toLowerCase() === 'all' ? '' : brand.trim(),
      subject: subject.trim() === '' || subject.toLowerCase() === 'all' ? '' : subject.trim(),
      startDate,
      endDate,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
    });
  };
  
  // Effect to avoid hydration errors for Date pickers
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Search className="mr-2 h-5 w-5 text-primary" />
          Search Emails
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="brand" className="font-medium">Brand (Sender Domain/Email or "All")</Label>
              <Input
                id="brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., expedia.com or newsletter@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subject" className="font-medium">Subject Keywords (or "All")</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Special Offer, Update"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="startDate" className="font-medium">Start Date</Label>
                {mounted && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {!mounted && <Input disabled placeholder="Loading date picker..." className="mt-1"/>}
              </div>
              
              <div>
                <Label htmlFor="startTime" className="font-medium flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Start Time (optional)
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                  placeholder="HH:MM"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for start of day (midnight)
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="endDate" className="font-medium">End Date</Label>
                {mounted && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="endDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => startDate ? date < startDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {!mounted && <Input disabled placeholder="Loading date picker..." className="mt-1"/>}
              </div>
              
              <div>
                <Label htmlFor="endTime" className="font-medium flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  End Time (optional)
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                  placeholder="HH:MM"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for end of day (11:59 PM)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Time Filtering Tip</h4>
            <p className="text-sm text-blue-700">
              Use time filters to narrow down results when you have many emails on the same day. 
              For example, search from 2:00 PM to 3:00 PM to find specific test sends.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
