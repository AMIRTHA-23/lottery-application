'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, limit, orderBy } from 'firebase/firestore';
import type { UserProfile, Wallet, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pencil, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AdjustWalletDialog } from '@/components/admin/adjust-wallet-dialog';
import { useToast } from '@/hooks/use-toast';

export default function UserDetailPage() {
  const { userId } = useParams();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdjustWalletOpen, setAdjustWalletOpen] = useState(false);

  // Fetch User Profile
  const userRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId as string);
  }, [firestore, userId]);
  const { data: user, isLoading: isUserLoading } = useDoc<UserProfile>(userRef);

  // Fetch User Wallet
  const walletQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'users', userId as string, 'wallets'), limit(1));
  }, [firestore, userId]);
  const { data: wallets, isLoading: isWalletsLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  // Fetch User Transactions
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !userId || !wallet) return null;
    return query(collection(firestore, 'users', userId as string, 'wallets', wallet.id, 'transactions'), orderBy('transactionDate', 'desc'));
  }, [firestore, userId, wallet]);
  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const handleToggleFreeze = () => {
    if (!firestore || !user) return;
    const userDocRef = doc(firestore, 'users', user.id);
    const newStatus = user.status === 'Frozen' ? 'Active' : 'Frozen';
    updateDocumentNonBlocking(userDocRef, { status: newStatus });
    toast({
        title: `Account ${newStatus}`,
        description: `User ${user.username} has been ${newStatus.toLowerCase()}.`,
    });
  };

  const isLoading = isUserLoading || isWalletsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground">The requested user does not exist.</p>
        <Button onClick={() => router.push('/admin/users')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

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
    {user && wallet && <AdjustWalletDialog user={user} wallet={wallet} isOpen={isAdjustWalletOpen} onOpenChange={setAdjustWalletOpen} />}
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.username}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Badge variant={user.status === 'Frozen' ? 'destructive' : 'success'}>
                {user.status || 'Active'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleToggleFreeze}>
                {user.status === 'Frozen' ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                {user.status === 'Frozen' ? 'Unfreeze Account' : 'Freeze Account'}
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="font-medium">First Name:</span> <span className="text-muted-foreground">{user.firstName}</span></div>
            <div className="flex justify-between"><span className="font-medium">Last Name:</span> <span className="text-muted-foreground">{user.lastName}</span></div>
            <div className="flex justify-between"><span className="font-medium">Phone:</span> <span className="text-muted-foreground">{user.phoneNumber || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="font-medium">Registered:</span> <span className="text-muted-foreground">{new Date(user.registrationDate).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
           <CardHeader>
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent>
             {isWalletsLoading ? (
              <Skeleton className="h-12 w-3/4" />
            ) : wallet ? (
                <>
                    <p className="text-4xl font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: wallet.currency || 'INR' }).format(wallet.balance || 0)}
                    </p>
                    <Button size="sm" className="mt-2" onClick={() => setAdjustWalletOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Adjust Balance
                    </Button>
                </>
            ) : (
               <p className="text-muted-foreground">No wallet found for this user.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A complete record of the user's wallet activity.</CardDescription>
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
                    <TableCell className="text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleString()}</TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate">{tx.description}</TableCell>
                    <TableCell>
                      <Badge variant={getTransactionBadgeVariant(tx.type)}>{tx.type}</Badge>
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
                      No transactions found for this user.
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