'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Wallet } from '@/lib/types';
import { useFirestore, updateDocumentNonBlocking, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, limit, writeBatch } from 'firebase/firestore';

interface AddFundsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const addFundsSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }).min(100, 'Minimum deposit is ₹100.'),
});

type AddFundsFormValues = z.infer<typeof addFundsSchema>;

export function AddFundsDialog({ isOpen, onOpenChange }: AddFundsDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'), limit(1));
  }, [user, firestore]);
  const { data: wallets } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  const form = useForm<AddFundsFormValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: 100,
    },
  });

  const onSubmit = async (data: AddFundsFormValues) => {
    if (!firestore || !user) return;

    try {
        const batch = writeBatch(firestore);

        let walletRef;
        let currentBalance = 0;
        let walletId: string;

        if (wallet) {
            // Wallet exists
            walletRef = doc(firestore, 'users', user.uid, 'wallets', wallet.id);
            currentBalance = wallet.balance;
            walletId = wallet.id;
        } else {
            // Wallet does not exist, create it
            walletRef = doc(collection(firestore, 'users', user.uid, 'wallets'));
            walletId = walletRef.id;
            batch.set(walletRef, {
                id: walletId,
                userId: user.uid,
                balance: 0,
                currency: 'INR',
            });
        }
        
        // Update balance
        batch.update(walletRef, { balance: currentBalance + data.amount });

        // Create transaction record
        const transactionRef = doc(collection(firestore, 'users', user.uid, 'wallets', walletId, 'transactions'));
        batch.set(transactionRef, {
            id: transactionRef.id,
            walletId: walletId,
            transactionDate: new Date().toISOString(),
            amount: data.amount,
            type: 'Deposit',
            description: 'Funds deposited to wallet'
        });
        
        await batch.commit();

        toast({
            title: 'Funds Added',
            description: `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.amount)} has been added to your wallet.`,
        });

        onOpenChange(false);
        form.reset();

    } catch (e: any) {
         toast({
            variant: 'destructive',
            title: 'Failed to Add Funds',
            description: e.message || 'An unexpected error occurred.',
        });
    }

  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Funds to Wallet</DialogTitle>
          <DialogDescription>
            Enter the amount you want to deposit. This is a simulation and no real money will be charged.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Depositing...' : 'Deposit Funds'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
