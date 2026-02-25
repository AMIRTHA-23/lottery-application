'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup, where } from 'firebase/firestore';
import type { LotteryEvent, Transaction } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';

export function PayoutsReport() {
  const firestore = useFirestore();

  // 1. Fetch Completed Events (The basis for payouts)
  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'lotteryEvents'), 
      where('status', '==', 'Completed')
    );
  }, [firestore]);
  const { data: events, isLoading: isLoadingEvents } = useCollection<LotteryEvent>(eventsQuery);

  // 2. Fetch Payout Transactions (Via Collection Group)
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'transactions'), where('type', '==', 'Payout'));
  }, [firestore]);
  const { data: payouts, isLoading: isLoadingPayouts } = useCollection<Transaction>(transactionsQuery);

  const isLoading = isLoadingEvents || isLoadingPayouts;

  const reportData = useMemo(() => {
    if (!events || !payouts) return [];
    
    // Group payouts by eventId
    const payoutsByEvent = payouts.reduce((acc, payout) => {
      const eventId = payout.lotteryEventId;
      if (!eventId) return acc;

      if (!acc[eventId]) {
        acc[eventId] = { totalPayout: 0, winners: new Set<string>() };
      }
      
      acc[eventId].totalPayout += payout.amount;
      acc[eventId].winners.add(payout.userId);

      return acc;
    }, {} as Record<string, { totalPayout: number; winners: Set<string> }>);

    return events
        .map(event => {
            const payoutInfo = payoutsByEvent[event.id];
            return {
                ...event,
                totalPayout: payoutInfo?.totalPayout || 0,
                winnerCount: payoutInfo?.winners.size || 0,
            }
        })
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  }, [events, payouts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payouts by Event</CardTitle>
        <CardDescription>
          A summary of total payouts and winner counts for each completed draw.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Winning Number</TableHead>
              <TableHead className="text-right">Winners</TableHead>
              <TableHead className="text-right">Total Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && reportData.length > 0 ? (
              reportData.map((data) => (
                <TableRow key={data.id}>
                  <TableCell className="font-medium">{data.name} <span className="text-xs text-muted-foreground">({data.gameType})</span></TableCell>
                  <TableCell className="font-mono">{data.result}</TableCell>
                   <TableCell className="text-right">{data.winnerCount}</TableCell>
                  <TableCell className="text-right font-semibold text-green-500">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.totalPayout)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No payout data to report yet.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}