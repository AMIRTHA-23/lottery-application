'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, query, where } from 'firebase/firestore';
import type { Wallet, LotteryNumber, LotteryEvent } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Query for user's wallet
  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'));
  }, [user, firestore]);
  const { data: wallets, isLoading: isWalletsLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  // Query for user's lottery numbers
  const numbersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'lotteryNumbers'));
  }, [user, firestore]);
  const { data: lotteryNumbers, isLoading: isNumbersLoading } = useCollection<LotteryNumber>(numbersQuery);

  // Query for active lottery events
  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'lotteryEvents'), where('status', '==', 'Open'), where('isEnabled', '==', true));
  }, [firestore]);
  const { data: lotteryEvents, isLoading: isEventsLoading } = useCollection<LotteryEvent>(eventsQuery);

  if (!user) {
    return null;
  }

  const isLoading = isWalletsLoading || isNumbersLoading || isEventsLoading;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {user.displayName || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Here's your lottery dashboard. Good luck!
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/play">Play Now</Link>
          </Button>
        </div>
        
        {isLoading ? (
          <p>Loading your dashboard...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>My Wallet</CardTitle>
                <CardDescription>Your current balance and currency.</CardDescription>
              </CardHeader>
              <CardContent>
                {wallet ? (
                  <>
                    <p className="text-4xl font-bold">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: wallet.currency || 'INR' }).format(wallet.balance || 0)}
                    </p>
                    <Button variant="outline" className="mt-4">Add Funds</Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">No wallet found. A wallet will be created with your first deposit.</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>My Numbers</CardTitle>
                <CardDescription>Your purchased lottery numbers for upcoming draws.</CardDescription>
              </CardHeader>
              <CardContent>
                {lotteryNumbers && lotteryNumbers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Event ID</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotteryNumbers.map((num) => (
                        <TableRow key={num.id}>
                          <TableCell className="font-medium">{num.number}</TableCell>
                          <TableCell className="text-muted-foreground truncate max-w-[100px]">{num.lotteryEventId}</TableCell>
                          <TableCell className="text-right">{num.unitsPurchased}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't purchased any numbers yet.</p>
                    <Button asChild className="mt-4">
                      <Link href="/dashboard/play">Buy Your First Number</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Active Lotteries</CardTitle>
                <CardDescription>Join these events before they close!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lotteryEvents && lotteryEvents.length > 0 ? (
                  lotteryEvents.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          {event.name}
                          <Badge variant={event.status === 'Open' ? 'success' : 'secondary'}>{event.status}</Badge>
                        </CardTitle>
                        <CardDescription>Draw on: {new Date(event.eventDate).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full">View & Purchase</Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                   <p className="text-muted-foreground md:col-span-2 lg:col-span-3 text-center p-8">No active lottery events at the moment. Please check back later.</p>
                )}
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
}
