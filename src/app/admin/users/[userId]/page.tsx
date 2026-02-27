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
import { ArrowLeft, Pencil, ShieldAlert, ShieldCheck, UserCheck, Calendar, Phone, Mail, User, ShieldX, CheckCircle, XCircle } from 'lucide-react';
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

  const updateKycStatus = (newStatus: UserProfile['kycStatus']) => {
    if (!firestore || !user) return;
    const userDocRef = doc(firestore, 'users', user.id);
    updateDocumentNonBlocking(userDocRef, { kycStatus: newStatus });
    toast({
        title: `KYC ${newStatus}`,
        description: `User verification status updated to ${newStatus}.`,
    });
  }

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.username}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="text-sm">{user.email}</span>
            </div>
            </div>
        </div>
        <div className="flex flex-wrap gap-2">
            <Badge variant={user.status === 'Frozen' ? 'destructive' : 'success'}>
                {user.status || 'Active'}
            </Badge>
            <Badge variant={user.kycStatus === 'Verified' ? 'success' : user.kycStatus === 'Rejected' ? 'destructive' : 'secondary'}>
                KYC: {user.kycStatus || 'Pending'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleToggleFreeze}>
                {user.status === 'Frozen' ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                {user.status === 'Frozen' ? 'Unfreeze' : 'Freeze'}
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>User Profile & KYC</CardTitle>
                <CardDescription>Full details collected during registration.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => updateKycStatus('Verified')} disabled={user.kycStatus === 'Verified'}>
                    <CheckCircle className="mr-1 h-4 w-4" /> Verify
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateKycStatus('Rejected')} disabled={user.kycStatus === 'Rejected'}>
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Full Name</p>
                            <p className="text-sm">{user.firstName} {user.lastName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Date of Birth</p>
                            <p className="text-sm">{user.dob || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Gender</p>
                            <p className="text-sm capitalize">{user.gender || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Phone Number</p>
                            <p className="text-sm">{user.phoneNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Registration Date</p>
                            <p className="text-sm">{new Date(user.registrationDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Referral Source</p>
                        <p className="text-sm">{user.referralSource || 'Direct/Unknown'}</p>
                    </div>
                </div>
            </div>
             <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-semibold mb-2">Age Verification Status</p>
                {user.isAgeVerified ? (
                    <div className="flex items-center gap-2 text-success">
                        <UserCheck className="h-5 w-5" />
                        <span>Confirmed 18+ at Signup</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-destructive">
                        <ShieldX className="h-5 w-5" />
                        <span>Not Verified</span>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
           <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center h-[120px]">
             {isWalletsLoading ? (
              <Skeleton className="h-12 w-3/4" />
            ) : wallet ? (
                <>
                    <p className="text-4xl font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: wallet.currency || 'INR' }).format(wallet.balance || 0)}
                    </p>
                    <Button size="sm" variant="ghost" className="mt-4" onClick={() => setAdjustWalletOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Manual Adjust
                    </Button>
                </>
            ) : (
               <p className="text-muted-foreground">No wallet found.</p>
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
