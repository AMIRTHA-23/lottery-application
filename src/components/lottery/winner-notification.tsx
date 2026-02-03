'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateWinningNotification } from '@/ai/flows/real-time-winner-notifications';
import type { WinningNotificationInput } from '@/ai/flows/real-time-winner-notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper, Lightbulb, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function WinnerNotification() {
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckWinnings = async () => {
    setIsLoading(true);
    setError(null);
    setNotification(null);
    try {
      // Mock data for the AI flow
      const input: WinningNotificationInput = {
        userName: 'Sanjay',
        userLotteryNumbers: ['1234', '5678', '9012', '4321'],
        winningNumbers: ['5678', '9999', '1122', '8888'],
      };
      const result = await generateWinningNotification(input);
      setNotification(result.notificationMessage);
    } catch (e) {
      setError('Failed to check for winnings. Please try again later.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="text-primary" />
          Real-time Winner Updates
        </CardTitle>
        <CardDescription>
          Just finished a drawing? Check if you have any winning numbers from your past purchases using our AI assistant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={handleCheckWinnings} disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</> : "Check for Recent Winnings"}
          </Button>

          {isLoading && (
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {notification && (
            <Alert variant="success">
              <PartyPopper className="h-4 w-4" />
              <AlertTitle>Results are in!</AlertTitle>
              <AlertDescription>
                {notification}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
