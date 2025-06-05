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
import { CalendarIcon, Search } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      brand: brand.trim() === '' || brand.toLowerCase() === 'all' ? '' : brand.trim(),
      subject: subject.trim() === '' || subject.toLowerCase() === 'all' ? '' : subject.trim(),
      startDate,
      endDate,
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
                      disabled={(date) => startDate && date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
              {!mounted && <Input disabled placeholder="Loading date picker..." className="mt-1"/>}
            </div>
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
