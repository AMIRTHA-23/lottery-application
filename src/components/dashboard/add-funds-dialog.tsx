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
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, limit, writeBatch } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Wallet as WalletIcon } from 'lucide-react';

interface AddFundsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const addFundsSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }).min(100, 'Minimum is ₹100.'),
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

  const balanceForm = useForm<AddFundsFormValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: { amount: 500 },
  });

  const coinsForm = useForm<AddFundsFormValues>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: { amount: 500 },
  });

  const handleTransaction = async (data: AddFundsFormValues, type: 'Balance' | 'Coins') => {
    if (!firestore || !user) return;

    try {
        const batch = writeBatch(firestore);
        let walletRef;
        let currentBalance = wallet?.balance || 0;
        let currentCoins = wallet?.specialCoins || 0;
        let walletId: string;

        if (wallet) {
            walletRef = doc(firestore, 'users', user.uid, 'wallets', wallet.id);
            walletId = wallet.id;
        } else {
            walletRef = doc(collection(firestore, 'users', user.uid, 'wallets'));
            walletId = walletRef.id;
            batch.set(walletRef, {
                id: walletId,
                userId: user.uid,
                balance: 0,
                currency: 'INR',
                specialCoins: 0,
                totalCoinsEarned: 0,
                level: 1
            });
        }
        
        if (type === 'Balance') {
            batch.update(walletRef, { balance: currentBalance + data.amount });
        } else {
            const coinsToAdd = data.amount * 10; // Rate: ₹1 = 10 Coins
            batch.update(walletRef, { 
                specialCoins: currentCoins + coinsToAdd,
                totalCoinsEarned: (wallet?.totalCoinsEarned || 0) + coinsToAdd
            });
        }

        const transactionRef = doc(collection(firestore, 'users', user.uid, 'wallets', walletId, 'transactions'));
        batch.set(transactionRef, {
            id: transactionRef.id,
            userId: user.uid,
            walletId: walletId,
            transactionDate: new Date().toISOString(),
            amount: data.amount,
            type: 'Deposit',
            description: type === 'Balance' ? 'Topped up wallet balance' : `Purchased ${data.amount * 10} Special Coins`
        });
        
        await batch.commit();

        toast({
            title: 'Transaction Successful',
            description: type === 'Balance' 
                ? `₹${data.amount} added to your balance.` 
                : `${data.amount * 10} Special Coins added to your rewards.`,
        });

        onOpenChange(false);
    } catch (e: any) {
         toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds or Buy Coins</DialogTitle>
          <DialogDescription>
            Top up your cash balance or purchase Special Coins to play.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balance" className="gap-2">
                <WalletIcon className="h-4 w-4" /> Cash Balance
            </TabsTrigger>
            <TabsTrigger value="coins" className="gap-2 text-[#FF0055]">
                <Coins className="h-4 w-4" /> Buy Coins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balance" className="pt-4">
            <Form {...balanceForm}>
              <form onSubmit={balanceForm.handleSubmit((d) => handleTransaction(d, 'Balance'))} className="space-y-4">
                <FormField
                  control={balanceForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Amount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={balanceForm.formState.isSubmitting}>
                  Add Cash Balance
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="coins" className="pt-4">
            <Form {...coinsForm}>
              <form onSubmit={coinsForm.handleSubmit((d) => handleTransaction(d, 'Coins'))} className="space-y-4">
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-100 mb-4">
                    <p className="text-xs font-bold text-[#FF0055] uppercase mb-1">Conversion Rate</p>
                    <p className="text-lg font-black">₹1.00 = 10 Special Coins</p>
                </div>
                <FormField
                  control={coinsForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Amount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        You will receive <span className="font-bold text-[#FF0055]">{field.value * 10} Coins</span>
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-[#FF0055] hover:bg-[#D40045]" disabled={coinsForm.formState.isSubmitting}>
                  Buy Special Coins
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
