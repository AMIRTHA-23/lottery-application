'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import type { Wallet, LotteryNumber, Announcement } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { AddFundsDialog } from '@/components/dashboard/add-funds-dialog';
import { useState } from 'react';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddFundsOpen, setAddFundsOpen] = useState(false);

  // Query for user's wallet
  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'), limit(1));
  }, [user, firestore]);
  const { data: wallets, isLoading: isWalletsLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  // Query for user's recent lottery numbers
  const numbersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'lotteryNumbers'), orderBy('purchaseDate', 'desc'), limit(5));
  }, [user, firestore]);
  const { data: lotteryNumbers, isLoading: isNumbersLoading } = useCollection<LotteryNumber>(numbersQuery);

  // Query for announcements
  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
  }, [firestore]);
  const { data: announcements, isLoading: isAnnouncementsLoading } = useCollection<Announcement>(announcementsQuery);


  if (!user) {
    return null;
  }

  const isLoading = isWalletsLoading || isNumbersLoading || isAnnouncementsLoading;

  return (
    <>
    <AddFundsDialog isOpen={isAddFundsOpen} onOpenChange={setAddFundsOpen} />
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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Announcements</CardTitle>
                        <CardDescription>Latest updates and notices from the admin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {announcements && announcements.length > 0 ? (
                        <div className="space-y-4">
                            {announcements.map((item) => (
                            <div key={item.id} className="flex items-start gap-4">
                                <Megaphone className="h-5 w-5 text-primary mt-1"/>
                                <div className='flex-1'>
                                    <p className="font-semibold">{item.title}</p>
                                    <p className="text-sm text-muted-foreground">{item.content}</p>
                                </div>
                            </div>
                            ))}
                        </div>
                        ) : (
                        <p className="text-muted-foreground text-sm">No new announcements.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>My Recent Numbers</CardTitle>
                        <CardDescription>Your 5 most recently purchased numbers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {lotteryNumbers && lotteryNumbers.length > 0 ? (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Event ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Units</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {lotteryNumbers.map((num) => (
                                <TableRow key={num.id}>
                                <TableCell className="font-medium">{num.number}</TableCell>
                                <TableCell className="text-muted-foreground truncate max-w-[100px]">{num.lotteryEventId}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">{new Date(num.purchaseDate).toLocaleDateString()}</TableCell>
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
            </div>
            
            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>My Wallet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {wallet ? (
                        <>
                            <p className="text-4xl font-bold">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: wallet.currency || 'INR' }).format(wallet.balance || 0)}
                            </p>
                             <div className="flex gap-2 mt-4">
                                <Button onClick={() => setAddFundsOpen(true)}>Add Funds</Button>
                                <Button variant="outline" asChild><Link href="/dashboard/wallet">View History</Link></Button>
                            </div>
                        </>
                        ) : (
                         <div className="text-center p-4 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No wallet found.</p>
                            <Button className="mt-2" onClick={() => setAddFundsOpen(true)}>Make First Deposit</Button>
                        </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>How to Play</CardTitle>
                        <CardDescription>A quick guide to start playing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                                <p className="text-sm text-muted-foreground">Go to the <Link href="/dashboard/play" className="font-semibold text-primary hover:underline">Play</Link> page to see active games.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                                <p className="text-sm text-muted-foreground">Pick a game, choose your lucky number, and decide how many units to buy.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                                <p className="text-sm text-muted-foreground">Confirm your purchase from your wallet balance.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">4</div>
                                <p className="text-sm text-muted-foreground">Check the <Link href="/dashboard/results" className="font-semibold text-primary hover:underline">Results</Link> page after the draw to see if you've won!</p>
                            </li>
                        </ul>
                        <Button asChild variant="secondary" className="mt-4 w-full">
                            <Link href="/dashboard/rules">Read Full Game Rules</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
