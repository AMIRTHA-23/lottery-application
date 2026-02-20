'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { LotteryEvent, LotteryNumber } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResultsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'lotteryEvents');
  }, [firestore]);

  const numbersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'lotteryNumbers'));
  }, [user, firestore]);

  const { data: allEvents, isLoading: isEventsLoading } = useCollection<LotteryEvent>(eventsQuery);
  const { data: userNumbers, isLoading: isNumbersLoading } = useCollection<LotteryNumber>(numbersQuery);

  const events = useMemo(() => {
      if (!allEvents) return [];
      return allEvents
          .filter(event => event.status === 'Completed')
          .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }, [allEvents]);
  
  const isLoading = isEventsLoading || isNumbersLoading;

  const userWins = useMemo(() => {
    if (!userNumbers || !events) return new Map();

    const wins = new Map<string, LotteryNumber[]>(); // Map of eventId to winning numbers
    
    events.forEach(event => {
        const winningUserNumbers = userNumbers.filter(num => num.lotteryEventId === event.id && num.number === event.result);
        if (winningUserNumbers.length > 0) {
            wins.set(event.id, winningUserNumbers);
        }
    });

    return wins;
  }, [userNumbers, events]);

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Lottery Results</h1>
        <p className="text-muted-foreground">Check the results of past lottery draws.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Draws</CardTitle>
          <CardDescription>
            A full report of all completed lottery events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Draw Date</TableHead>
                <TableHead>Winning Number</TableHead>
                <TableHead className="text-right">Your Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && events && events.length > 0 ? (
                events.map((event) => {
                  const didWin = userWins.has(event.id);
                  return (
                      <TableRow key={event.id} className={cn(didWin && 'bg-success/10')}>
                        <TableCell className="font-medium">{event.name} <span className="text-xs text-muted-foreground">({event.gameType})</span></TableCell>
                        <TableCell>{new Date(event.eventDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono font-semibold text-lg text-primary">{event.result || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {didWin ? (
                             <Badge variant="success" className="bg-green-500 hover:bg-green-600">
                                <Trophy className="mr-1 h-3 w-3"/>
                                You Won!
                             </Badge>
                          ) : (
                             <Badge variant="outline">
                                No Win
                             </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                  );
                })
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No results to show yet.
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
