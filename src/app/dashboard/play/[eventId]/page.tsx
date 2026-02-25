'use client';

import { useFirestore, useDoc, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, limit, runTransaction } from 'firebase/firestore';
import type { LotteryEvent, Wallet, AppSettings } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Wand2, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState } from 'react';
import { NumberInput } from '@/components/dashboard/number-input';
import { generateLuckyNumber } from '@/ai/flows/generate-lucky-number';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Schema generation is a pure function, can be outside.
const getPurchaseSchema = (gameType: LotteryEvent['gameType'] = '1D') => {
   if (gameType === 'LuckyDraw') {
    return z.object({
      unitsPurchased: z.coerce.number().min(1, { message: 'You must purchase at least 1 ticket.' }),
    });
  }
  const digitCount = parseInt(gameType.replace('D', ''));
  return z.object({
    number: z.string().length(digitCount, { message: `Number must be ${digitCount} digits.` }).regex(/^\d+$/, 'Must be a numeric value.'),
    unitsPurchased: z.coerce.number().min(1, { message: 'You must purchase at least 1 unit.' }),
  });
};

type PurchaseFormValues = z.infer<ReturnType<typeof getPurchaseSchema>>;

// This new component will contain the form logic.
// It only renders when `event` is available, ensuring `useForm` gets the right resolver.
function PlayEventForm({ event, wallet, settings }: { event: LotteryEvent; wallet: Wallet | undefined, settings: AppSettings | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isPicking, setIsPicking] = useState(false);

  const formSchema = getPurchaseSchema(event.gameType);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitsPurchased: 1,
      ...((event.gameType !== 'LuckyDraw' && { number: '' }) || {}),
    },
  });

  const handleQuickPick = async () => {
    if (!user || event.gameType === 'LuckyDraw') return;
    setIsPicking(true);
    try {
      const result = await generateLuckyNumber({
        userName: user.displayName || 'player',
        gameType: event.gameType as '1D' | '2D' | '3D' | '4D',
      });
      if (result.luckyNumber) {
        form.setValue('number', result.luckyNumber, { shouldValidate: true });
        toast({
          title: 'Your lucky number is here!',
          description: `The oracle suggests: ${result.luckyNumber}`,
        });
      }
    } catch (error) {
      console.error('AI Quick Pick failed:', error);
      toast({
        variant: 'destructive',
        title: 'Quick Pick Failed',
        description: 'The oracle is silent right now. Please try again.',
      });
    } finally {
      setIsPicking(false);
    }
  };

  const handlePurchase = async (data: PurchaseFormValues) => {
    if (!firestore || !user || !wallet) {
      toast({
        variant: 'destructive',
        title: 'Purchase Failed',
        description: 'Could not find required user or wallet information. Please try again.',
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
        
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) {
          throw new Error("Wallet not found.");
        }
        const currentBalance = walletDoc.data().balance;
        if (currentBalance < totalCost) {
          throw new Error("Insufficient funds.");
        }

        transaction.update(walletRef, { balance: currentBalance - totalCost });
        
        const numberToSave = event.gameType === 'LuckyDraw' ? newLotteryNumberRef.id : (data as any).number;

        transaction.set(newLotteryNumberRef, {
          id: newLotteryNumberRef.id,
          userId: user.uid,
          lotteryEventId: event.id,
          number: numberToSave,
          purchaseDate: new Date().toISOString(),
          unitPrice: event.unitPrice,
          unitsPurchased: data.unitsPurchased,
        });
        
        const description = event.gameType === 'LuckyDraw' 
            ? `Purchased ${data.unitsPurchased} ticket(s) for ${event.name}`
            : `Purchased ${data.unitsPurchased} units of ${numberToSave} for ${event.name}`;

        transaction.set(newTransactionRef, {
            id: newTransactionRef.id,
            walletId: wallet.id,
            transactionDate: new Date().toISOString(),
            amount: -totalCost,
            type: 'Purchase',
            description: description,
        });
      });

      toast({
        title: 'Purchase Successful!',
        description: `Your purchase for ${event.name} is confirmed. Good luck!`,
      });
      router.push('/dashboard/play');

    } catch (e: any) {
      console.error("Transaction failed: ", e);
      toast({
        variant: 'destructive',
        title: 'Transaction Failed',
        description: e.message || 'There was an error processing your purchase.',
      });
    }
  };

  const totalCost = (form.watch('unitsPurchased') || 0) * (event.unitPrice || 0);

  const getPrize = () => {
    if (event.gameType === 'LuckyDraw') return event.prize;
    if (!settings) return '...';
    
    const prizeMap: { [key: string]: number } = {
        '1D': settings.prize1D,
        '2D': settings.prize2D,
        '3D': settings.prize3D,
        '4D': settings.prize4D,
    };

    const amount = prizeMap[event.gameType];
    if (amount === undefined) return '...';
    
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  }
  
  const prize = getPrize();

  return (
    <Card className="max-w-2xl mx-auto">
       <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePurchase)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Play: {event.name}</CardTitle>
                        {event.gameType === 'LuckyDraw' ? (
                            <CardDescription>
                                Purchase a ticket for a chance to win: <span className='font-bold text-primary'>{prize}</span>!
                            </CardDescription>
                        ) : (
                            <CardDescription>
                                Choose a {parseInt(event.gameType.replace('D', ''))}-digit number for a chance to win <span className="font-bold text-primary">{prize}</span>.
                            </CardDescription>
                        )}
                    </div>
                    <Badge variant="outline" className="flex gap-2">
                        <PartyPopper className="h-4 w-4 text-primary" />
                        Win {prize}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                 {event.gameType !== 'LuckyDraw' && (
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="number"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-center block text-muted-foreground">Your Number ({event.gameType})</FormLabel>
                                <FormControl>
                                <NumberInput 
                                    length={parseInt(event.gameType.replace('D', ''))}
                                    value={field.value as string}
                                    onChange={field.onChange}
                                    disabled={field.disabled}
                                />
                                </FormControl>
                                <FormMessage className="text-center" />
                            </FormItem>
                            )}
                        />
                        <div className="flex justify-center">
                            <Button type="button" variant="outline" onClick={handleQuickPick} disabled={isPicking}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            {isPicking ? 'Consulting the oracle...' : 'AI Quick Pick'}
                            </Button>
                        </div>
                    </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="unitsPurchased"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{event.gameType === 'LuckyDraw' ? 'Number of Tickets' : 'Units to Purchase'}</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} className="h-12 text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">Total Cost</span>
                            <span className="font-bold text-lg">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalCost)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground text-right mt-1">
                            Balance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(wallet?.balance || 0)}
                        </div>
                    </CardContent>
                </Card>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                 <Button type="submit" size="lg" className="w-full text-lg" disabled={form.formState.isSubmitting || !wallet}>
                    {form.formState.isSubmitting ? 'Purchasing...' : event.gameType === 'LuckyDraw' ? 'Buy Ticket' : 'Confirm Purchase'}
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
              </CardFooter>
            </form>
        </Form>
    </Card>
  );
}

// Main page component that fetches data and handles loading/error states.
export default function PlayEventPage() {
  const { eventId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();

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

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'app') : null, [firestore]);
  const { data: settings, isLoading: isSettingsLoading } = useDoc<AppSettings>(settingsRef);

  if (isEventLoading || isWalletLoading || isSettingsLoading) {
    return (
        <div className="container py-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-8">
                     <Skeleton className="h-16 w-full" />
                     <Skeleton className="h-24 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-12 w-full" />
                </CardFooter>
            </Card>
        </div>
    );
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

  return (
    <div className="container py-6">
      <PlayEventForm event={event} wallet={wallet} settings={settings}/>
    </div>
  );
}
