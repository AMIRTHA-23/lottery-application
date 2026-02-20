'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import type { Wallet, LotteryNumber, Announcement, Transaction } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Megaphone, Wallet as WalletIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { AddFundsDialog } from '@/components/dashboard/add-funds-dialog';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

  // Query for all user's transactions (for stats)
  const allTransactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !wallet) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets', wallet.id, 'transactions'), orderBy('transactionDate', 'desc'));
  }, [user, firestore, wallet]);
  const { data: allTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(allTransactionsQuery);
  
  const { stats, recentTransactions } = useMemo(() => {
    if (!allTransactions) {
      return { stats: { totalWinnings: 0, totalSpent: 0 }, recentTransactions: [] };
    }
    const totalWinnings = allTransactions
      .filter((tx) => tx.type === 'Payout')
      .reduce((acc, tx) => acc + tx.amount, 0);
    const totalSpent = allTransactions
      .filter((tx) => tx.type === 'Purchase')
      .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    
    return { 
        stats: { totalWinnings, totalSpent }, 
        recentTransactions: allTransactions.slice(0, 5) 
    };
  }, [allTransactions]);


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

  const isLoading = isWalletsLoading || isNumbersLoading || isAnnouncementsLoading || isTransactionsLoading;
  
  const statCards = [
    {
        title: "Total Winnings",
        value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.totalWinnings),
        icon: TrendingUp
    },
    {
        title: "Total Spent",
        value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.totalSpent),
        icon: TrendingDown
    }
  ]
  
  const getTransactionBadgeVariant = (type: Transaction['type']) => {
    switch (type) {
      case 'Deposit':
      case 'Payout':
        return 'success';
      case 'Purchase':
        return 'destructive';
      case 'Withdrawal':
        return 'secondary';
      default:
        return 'default';
    }
  }

  return (
    <>
    <AddFundsDialog isOpen={isAddFundsOpen} onOpenChange={setAddFundsOpen} />
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
      
       {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
            <>
                <Card><CardHeader><Skeleton className="h-5 w-24"/></CardHeader><CardContent><Skeleton className="h-8 w-32"/><Skeleton className="h-8 w-full mt-2"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24"/></CardHeader><CardContent><Skeleton className="h-8 w-32"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24"/></CardHeader><CardContent><Skeleton className="h-8 w-32"/></CardContent></Card>
            </>
        ) : (
            <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                        <WalletIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{wallet ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(wallet.balance) : '₹0.00'}</div>
                         <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => setAddFundsOpen(true)}>Add Funds</Button>
                            <Button size="sm" variant="outline" asChild><Link href="/dashboard/wallet">View History</Link></Button>
                        </div>
                    </CardContent>
                </Card>
                {statCards.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
                ))}
            </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your last 5 transactions from your wallet.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isTransactionsLoading ? <p>Loading...</p> : recentTransactions && recentTransactions.length > 0 ? (
                        <Table>
                            <TableBody>
                            {recentTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <div className="font-medium max-w-[250px] truncate">{tx.description}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleString()}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getTransactionBadgeVariant(tx.type)}>{tx.type}</Badge>
                                    </TableCell>
                                    <TableCell className={cn("text-right font-semibold", tx.amount > 0 ? 'text-green-500' : 'text-red-500')}>
                                        {tx.amount > 0 ? '+' : ''}
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    ) : (
                    <p className="text-muted-foreground text-sm">No transactions yet.</p>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>My Recent Numbers</CardTitle>
                    <CardDescription>Your 5 most recently purchased numbers.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isNumbersLoading ? <p>Loading...</p> : lotteryNumbers && lotteryNumbers.length > 0 ? (
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
                    <CardTitle>Recent Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                    {isAnnouncementsLoading ? <p>Loading...</p> : announcements && announcements.length > 0 ? (
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
        </div>
      </div>
    </div>
    </>
  );
}
