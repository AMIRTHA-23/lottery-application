'use client';

import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, limit, runTransaction } from 'firebase/firestore';
import type { LotteryEvent, Wallet } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const getPurchaseSchema = (gameType: LotteryEvent['gameType']) => {
  const digitCount = parseInt(gameType.replace('D', ''));
  return z.object({
    number: z.string().length(digitCount, { message: `Number must be ${digitCount} digits.` }).regex(/^\d+$/, 'Must be a numeric value.'),
    unitsPurchased: z.coerce.number().min(1, { message: 'You must purchase at least 1 unit.' }),
  });
};

export default function PlayEventPage() {
  const { eventId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const eventRef = useMemoFirebase(() => {
    if (!firestore || !eventId) return null;
    return doc(firestore, 'lotteryEvents', eventId as string);
  }, [firestore, eventId]);
  const { data: event, isLoading: isEventLoading } = useDoc<LotteryEvent>(eventRef);

  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'), limit(1));
  }, [user, firestore]);
  const { data: wallets, isLoading: isWalletLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  const formSchema = getPurchaseSchema(event?.gameType || '1D');
  type PurchaseFormValues = z.infer<typeof formSchema>;

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: '',
      unitsPurchased: 1,
    },
  });

  const handlePurchase: (data: PurchaseFormValues) => void = async (data) => {
    if (!firestore || !user || !event || !wallet) {
      toast({
        variant: 'destructive',
        title: 'Purchase Failed',
        description: 'Could not find required user, event, or wallet information.',
      });
      return;
    }

    const totalCost = data.unitsPurchased * event.unitPrice;

    if (wallet.balance < totalCost) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Funds',
        description: `You need ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalCost)} but your balance is only ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(wallet.balance)}.`,
      });
      return;
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const walletRef = doc(firestore, 'users', user.uid, 'wallets', wallet.id);
        const newLotteryNumberRef = doc(collection(firestore, 'users', user.uid, 'lotteryNumbers'));
        const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'wallets', wallet.id, 'transactions'));
        
        // 1. Read the wallet balance
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) {
          throw new Error("Wallet not found.");
        }
        const currentBalance = walletDoc.data().balance;
        if (currentBalance < totalCost) {
          throw new Error("Insufficient funds.");
        }

        // 2. Update wallet balance
        transaction.update(walletRef, { balance: currentBalance - totalCost });

        // 3. Create lottery number document
        transaction.set(newLotteryNumberRef, {
          id: newLotteryNumberRef.id,
          userId: user.uid,
          lotteryEventId: event.id,
          number: data.number,
          purchaseDate: new Date().toISOString(),
          unitPrice: event.unitPrice,
          unitsPurchased: data.unitsPurchased,
        });

        // 4. Create transaction document
        transaction.set(newTransactionRef, {
            id: newTransactionRef.id,
            walletId: wallet.id,
            transactionDate: new Date().toISOString(),
            amount: -totalCost,
            type: 'Purchase',
            description: `Purchased ${data.unitsPurchased} units of ${data.number} for ${event.name}`
        });
      });

      toast({
        title: 'Purchase Successful!',
        description: `You bought ${data.unitsPurchased} units of ${data.number}. Good luck!`,
      });
      router.push('/dashboard');

    } catch (e: any) {
      console.error("Transaction failed: ", e);
      toast({
        variant: 'destructive',
        title: 'Transaction Failed',
        description: e.message || 'There was an error processing your purchase.',
      });
    }
  };

  if (isEventLoading || isWalletLoading) {
    return <div className="container py-6">Loading game...</div>;
  }

  if (!event) {
    return <div className="container py-6">Lottery event not found.</div>;
  }
  
  if (event.status !== 'Open' || !event.isEnabled) {
     return (
      <div className="container py-6 flex justify-center items-center">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Event Closed</AlertTitle>
          <AlertDescription>
            This lottery event is no longer open for purchases.
            <Button asChild variant="link" className='p-0 h-auto ml-1'><Link href="/dashboard/play">View other events</Link></Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalCost = (form.watch('unitsPurchased') || 0) * (event?.unitPrice || 0);

  return (
    <div className="container py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Play: {event.name}</CardTitle>
          <CardDescription>
            Choose your {parseInt(event.gameType.replace('D', ''))}-digit number and how many units you want to buy.
            The price is {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(event.unitPrice)} per unit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePurchase)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Number ({event.gameType})</FormLabel>
                      <FormControl>
                        <Input placeholder={`Enter ${parseInt(event.gameType.replace('D', ''))} digits`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitsPurchased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card className="bg-muted/50">
                  <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total Cost</span>
                           <span className="text-lg font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalCost)}</span>
                      </div>
                       <div className="text-sm text-muted-foreground text-right mt-1">
                          Balance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(wallet?.balance || 0)}
                       </div>
                  </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !wallet}>
                {form.formState.isSubmitting ? 'Purchasing...' : 'Confirm Purchase'}
              </Button>
               {!wallet && (
                <Alert variant="destructive">
                  <AlertTitle>No Wallet Found</AlertTitle>
                  <AlertDescription>
                    You must have a wallet with funds to play. Please make a deposit first.
                     <Button asChild variant="link" className='p-0 h-auto ml-1'><Link href="/dashboard/wallet">Go to Wallet</Link></Button>
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
