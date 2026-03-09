'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import type { Wallet, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AddFundsDialog } from '@/components/dashboard/add-funds-dialog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, TrendingUp, Trophy, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function WalletPage() {
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

  // Query for user's transactions
  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !wallet) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets', wallet.id, 'transactions'), orderBy('transactionDate', 'desc'));
  }, [user, firestore, wallet]);
  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);
  
  const isLoading = isWalletsLoading || isTransactionsLoading;

  const getTransactionBadgeVariant = (type: Transaction['type']) => {
    switch (type) {
      case 'Deposit':
      case 'Payout':
      case 'Reward':
        return 'success';
      case 'Purchase':
        return 'destructive';
      case 'Withdrawal':
      case 'Redemption':
        return 'secondary';
      default:
        return 'default';
    }
  }

  // Level progress logic
  const currentLevel = wallet?.level || 1;
  const lifetimeCoins = wallet?.totalCoinsEarned || 0;
  const coinsForNextLevel = 1000;
  const progressToNext = (lifetimeCoins % coinsForNextLevel) / 10;

  return (
    <>
      <AddFundsDialog isOpen={isAddFundsOpen} onOpenChange={setAddFundsOpen} />
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#FF0055]">My Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and track your Special Coins rewards.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Balance Card */}
          <Card className="md:col-span-1 border-t-4 border-t-[#FF0055]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {isWalletsLoading ? (
                <Skeleton className="h-12 w-3/4" />
              ) : wallet ? (
                <>
                  <p className="text-4xl font-extrabold text-[#FF0055]">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: wallet.currency || 'INR' }).format(wallet.balance || 0)}
                  </p>
                  <Button className="mt-6 w-full bg-[#FF0055] hover:bg-[#D40045] font-bold" onClick={() => setAddFundsOpen(true)}>Add Funds</Button>
                </>
              ) : (
                <div className="text-center p-4 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm">No wallet found.</p>
                  <Button className="mt-2" onClick={() => setAddFundsOpen(true)}>Initialize Wallet</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reward & Level Card */}
          <Card className="md:col-span-2 overflow-hidden border-[#FF0055]/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
              <div className="p-6 bg-yellow-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-sm font-bold uppercase text-yellow-800 tracking-wider">Special Coins</h3>
                  </div>
                  <p className="text-3xl font-black text-yellow-600">{wallet?.specialCoins || 0}</p>
                  <p className="text-xs text-yellow-700 mt-1 font-medium">Worth ₹{((wallet?.specialCoins || 0) / 100).toFixed(2)} in discounts</p>
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <p className="text-[10px] text-yellow-600 font-bold uppercase italic">Earn 1 coin for every ₹10 spent!</p>
                </div>
              </div>
              <div className="p-6 flex flex-col justify-between bg-white border-l border-[#FF0055]/10">
                <div>
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-[#FF0055]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Player Level</h3>
                    </div>
                    <Badge className="bg-[#FF0055] font-black">LVL {currentLevel}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span>Progress to Lvl {currentLevel + 1}</span>
                      <span>{Math.floor(progressToNext)}%</span>
                    </div>
                    <Progress value={progressToNext} className="h-2 bg-pink-100" indicatorClassName="bg-[#FF0055]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Frequent purchases earn more coins and increase your level. High level players get priority draw access.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>A complete record of your wallet activity and rewards.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTransactionsLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {!isTransactionsLoading && transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant={getTransactionBadgeVariant(tx.type)} className={cn(tx.type === 'Reward' && 'bg-yellow-500 hover:bg-yellow-600')}>
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-bold", tx.type === 'Reward' ? 'text-yellow-600' : tx.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                        {tx.type === 'Reward' ? (
                          <span className="flex items-center justify-end gap-1">
                            +{tx.amount} <Coins className="h-3 w-3" />
                          </span>
                        ) : (
                          <>
                            {tx.amount > 0 ? '+' : ''}
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isTransactionsLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
