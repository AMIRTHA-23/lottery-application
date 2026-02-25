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

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Only fetch completed, non-luckydraw events, as they are the only ones with auto-payouts
    return query(
      collection(firestore, 'lotteryEvents'), 
      where('status', '==', 'Completed'),
      where('gameType', '!=', 'LuckyDraw')
    );
  }, [firestore]);

  const allTransactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Fetch all transactions from the group; we'll filter client-side
    return query(collectionGroup(firestore, 'transactions'));
  }, [firestore]);

  const { data: events, isLoading: isLoadingEvents } = useCollection<LotteryEvent>(eventsQuery);
  const { data: allTransactions, isLoading: isLoadingPayouts } = useCollection<Transaction>(allTransactionsQuery);

  const isLoading = isLoadingEvents || isLoadingPayouts;

  const reportData = useMemo(() => {
    if (!events || !allTransactions) return [];
    
    // Filter for payout transactions on the client
    const payouts = allTransactions.filter(tx => tx.type === 'Payout');

    const payoutsByEvent = payouts.reduce((acc, payout) => {
      const eventId = payout.lotteryEventId;
      if (!eventId || !payout.userId) return acc;

      if (!acc[eventId]) {
        acc[eventId] = { totalPayout: 0, winnerIds: new Set<string>() };
      }
      
      acc[eventId].totalPayout += payout.amount;
      acc[eventId].winnerIds.add(payout.userId);

      return acc;
    }, {} as Record<string, { totalPayout: number; winnerIds: Set<string> }>);

    return events
        .map(event => {
            const payoutData = payoutsByEvent[event.id];
            return {
                ...event,
                totalPayout: payoutData?.totalPayout || 0,
                winnerCount: payoutData?.winnerIds.size || 0,
            }
        })
        .filter(data => data.totalPayout > 0)
        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  }, [events, allTransactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payouts by Event</CardTitle>
        <CardDescription>
          A summary of total payouts for each completed event.
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
                  <TableCell className="font-medium">{data.name}</TableCell>
                  <TableCell className="font-mono">{data.result}</TableCell>
                   <TableCell className="text-right">{data.winnerCount || 0}</TableCell>
                  <TableCell className="text-right font-semibold text-green-500">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.totalPayout || 0)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No payout data to report.
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
