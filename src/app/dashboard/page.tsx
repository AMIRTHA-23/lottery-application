'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, query, limit, orderBy, doc } from 'firebase/firestore';
import type { Wallet, LotteryNumber, Announcement, Transaction, UserProfile } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Megaphone, Wallet as WalletIcon, TrendingUp, TrendingDown, ShieldCheck, Share2, Coins, Star, AlertTriangle, Clock } from 'lucide-react';
import { AddFundsDialog } from '@/components/dashboard/add-funds-dialog';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LiveDrawCarousel } from '@/components/dashboard/live-draw-carousel';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddFundsOpen, setAddFundsOpen] = useState(false);

  // Fetch User Profile for KYC/Verification status
  const profileRef = useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

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
  
  const getTransactionBadgeVariant = (type: Transaction['type']) => {
    switch (type) {
      case 'Deposit':
      case 'Payout':
      case 'Reward':
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
          <div className="flex items-center gap-2 mt-1">
             <p className="text-muted-foreground">Here's your lottery dashboard.</p>
             {profile?.kycStatus === 'Verified' ? (
                 <Badge variant="success" className="h-5"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>
             ) : (
                 <Badge variant="secondary" className="h-5">{profile?.kycStatus === 'Pending' ? 'Verification Pending' : 'KYC Required'}</Badge>
             )}
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href="/dashboard/referrals"><Share2 className="mr-2 h-4 w-4" /> Refer Friends</Link>
            </Button>
            <Button asChild className="bg-[#FF0055] hover:bg-[#D40045]">
                <Link href="/dashboard/play">Play Now</Link>
            </Button>
        </div>
      </div>

      {profile?.kycStatus !== 'Verified' && profile?.kycStatus !== 'Pending' && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-bold text-red-800">Account Not Verified</p>
                <p className="text-xs text-red-700">Complete your KYC to unlock higher payouts and VIP rewards.</p>
              </div>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shrink-0" asChild>
              <Link href="/dashboard/settings">Complete KYC</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {profile?.kycStatus === 'Pending' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-bold text-yellow-800">Verification in Progress</p>
              <p className="text-xs text-yellow-700">Our team is reviewing your profile. You'll be notified once verified.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <LiveDrawCarousel />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
            <>
                <Card><CardHeader><Skeleton className="h-5 w-24"/></CardHeader><CardContent><Skeleton className="h-8 w-32"/><Skeleton className="h-8 w-full mt-2"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24"/></CardHeader><CardContent><Skeleton className="h-8 w-32"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24"/></CardHeader><CardContent><Skeleton className="h-8 w-32"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24"/></CardHeader><CardContent><Skeleton className="h-8 w-32"/></CardContent></Card>
            </>
        ) : (
            <>
                <Card className="border-l-4 border-l-[#FF0055]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Wallet Balance</CardTitle>
                        <WalletIcon className="h-4 w-4 text-[#FF0055]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{wallet ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(wallet.balance) : '₹0.00'}</div>
                         <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold border-[#FF0055] text-[#FF0055]" onClick={() => setAddFundsOpen(true)}>Add Funds</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-yellow-800">Special Coins</CardTitle>
                        <Coins className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-yellow-600">{wallet?.specialCoins || 0}</div>
                        <div className="flex items-center gap-1 mt-2">
                           <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                           <span className="text-[10px] font-bold text-yellow-700 uppercase">Level {wallet?.level || 1} Player</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Winnings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-black">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.totalWinnings)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Spent</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-black">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.totalSpent)}</div>
                    </CardContent>
                </Card>
            </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
                                        <Badge variant={getTransactionBadgeVariant(tx.type)} className={cn(tx.type === 'Reward' && 'bg-yellow-500 hover:bg-yellow-600')}>
                                          {tx.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={cn("text-right font-bold", tx.type === 'Reward' ? 'text-yellow-600' : tx.amount > 0 ? 'text-green-500' : 'text-red-500')}>
                                        {tx.type === 'Reward' ? `+${tx.amount} Coins` : (
                                          <>
                                            {tx.amount > 0 ? '+' : ''}
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                                          </>
                                        )}
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
                    <CardDescription>Your 5 most recently purchased numbers or tickets.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isNumbersLoading ? <p>Loading...</p> : lotteryNumbers && lotteryNumbers.length > 0 ? (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Number/Ticket</TableHead>
                            <TableHead>Event ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Units</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {lotteryNumbers.map((num) => (
                            <TableRow key={num.id}>
                            <TableCell className="font-medium font-mono">{num.number.length > 10 ? `${num.number.substring(0,10)}...` : num.number}</TableCell>
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
                        <Button asChild className="mt-4 bg-[#FF0055] hover:bg-[#D40045]">
                        <Link href="/dashboard/play">Buy Your First Number</Link>
                        </Button>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
        
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

             <Card className="bg-gradient-to-br from-white to-pink-50">
                <CardHeader>
                    <CardTitle className="text-[#FF0055]">VIP Rewards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Your current level: <span className="font-black text-[#FF0055]">Level {wallet?.level || 1}</span>
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span>XP Progress</span>
                        <span>{wallet ? Math.floor(((wallet.totalCoinsEarned % 1000) / 1000) * 100) : 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-pink-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FF0055]" 
                          style={{ width: `${wallet ? Math.floor(((wallet.totalCoinsEarned % 1000) / 1000) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2 border-[#FF0055] text-[#FF0055] hover:bg-pink-50" asChild>
                        <Link href="/dashboard/wallet">Reward Details</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    </>
  );
}
