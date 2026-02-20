'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Wallet } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, writeBatch, collection } from 'firebase/firestore';

interface AdjustWalletDialogProps {
  user: UserProfile;
  wallet: Wallet;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const adjustWalletSchema = z.object({
  amount: z.coerce.number().refine((val) => val !== 0, {
    message: 'Amount cannot be zero.',
  }),
  reason: z.string().min(5, { message: 'Reason must be at least 5 characters long.' }),
});

type AdjustWalletFormValues = z.infer<typeof adjustWalletSchema>;

export function AdjustWalletDialog({ user, wallet, isOpen, onOpenChange }: AdjustWalletDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<AdjustWalletFormValues>({
    resolver: zodResolver(adjustWalletSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
  });

  const onSubmit = async (data: AdjustWalletFormValues) => {
    if (!firestore) return;

    try {
      const batch = writeBatch(firestore);
      const walletRef = doc(firestore, 'users', user.id, 'wallets', wallet.id);
      
      const newBalance = wallet.balance + data.amount;
      batch.update(walletRef, { balance: newBalance });

      const transactionRef = doc(collection(firestore, 'users', user.id, 'wallets', wallet.id, 'transactions'));
      const transactionType = data.amount > 0 ? 'Deposit' : 'Withdrawal';
      batch.set(transactionRef, {
        id: transactionRef.id,
        walletId: wallet.id,
        transactionDate: new Date().toISOString(),
        amount: data.amount,
        type: transactionType,
        description: `Admin adjustment: ${data.reason}`,
      });

      await batch.commit();

      toast({
        title: 'Wallet Adjusted',
        description: `${user.username}'s wallet has been adjusted by ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.amount)}.`,
      });
      onOpenChange(false);
      form.reset();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Adjust Wallet',
        description: e.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Wallet for {user.username}</DialogTitle>
          <DialogDescription>
            Manually add (positive amount) or remove (negative amount) funds. This will create a transaction record.
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
                    <Input type="number" placeholder="e.g., 50 or -50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Adjustment</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Goodwill credit for system issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adjusting...' : 'Confirm Adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
