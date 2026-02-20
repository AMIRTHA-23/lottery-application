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

  return (
    <>
      <AddFundsDialog isOpen={isAddFundsOpen} onOpenChange={setAddFundsOpen} />
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and view your transaction history.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                {isWalletsLoading ? (
                  <Skeleton className="h-12 w-3/4" />
                ) : wallet ? (
                  <>
                    <p className="text-4xl font-bold">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: wallet.currency || 'INR' }).format(wallet.balance || 0)}
                    </p>
                    <Button className="mt-4" onClick={() => setAddFundsOpen(true)}>Add Funds</Button>
                  </>
                ) : (
                  <div className="text-center p-4 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground text-sm">No wallet found.</p>
                    <Button className="mt-2" onClick={() => setAddFundsOpen(true)}>Make First Deposit</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A record of your recent wallet activity.</CardDescription>
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
                            <Badge variant={tx.type === 'Deposit' ? 'success' : 'secondary'}>{tx.type}</Badge>
                          </TableCell>
                          <TableCell className={cn("text-right font-semibold", tx.amount > 0 ? 'text-green-500' : 'text-red-500')}>
                            {tx.amount > 0 ? '+' : ''}
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
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
        </div>
      </div>
    </>
  );
}
