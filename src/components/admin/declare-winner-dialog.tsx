'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { LotteryEvent, LotteryNumber, Wallet, AppSettings } from '@/lib/types';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collectionGroup, query, where, getDocs, writeBatch, limit, collection } from 'firebase/firestore';
import { useEffect } from 'react';

const getWinnerSchema = (gameType: LotteryEvent['gameType']) => {
    if (gameType === 'LuckyDraw') {
      return z.object({
        result: z.string().min(1, { message: 'Please enter a ticket ID or winner name.' }),
      });
    }
    const digitCount = parseInt(gameType.replace('D', ''));
    return z.object({
        result: z.string().length(digitCount, { message: `Winning number must be ${digitCount} digits.` }).regex(/^\d+$/, "Must be a number."),
    });
}

interface DeclareWinnerDialogProps {
    event: LotteryEvent | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}


export function DeclareWinnerDialog({ event, isOpen, onOpenChange }: DeclareWinnerDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'app') : null, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<AppSettings>(settingsRef);

  const formSchema = getWinnerSchema(event?.gameType || '1D');
  type WinnerFormValues = z.infer<typeof formSchema>;

  const form = useForm<WinnerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      result: '',
    },
  });

  // Reset form when dialog is closed or event changes
  useEffect(() => {
    form.reset();
  }, [isOpen, event, form]);

  const handlePayouts = async (event: LotteryEvent, winningNumber: string, appSettings: AppSettings) => {
    if (!firestore) return { winnersCount: 0, totalPayout: 0 };
    
    const lotteryNumbersRef = collectionGroup(firestore, 'lotteryNumbers');
    const winnersQuery = query(
        lotteryNumbersRef,
        where('lotteryEventId', '==', event.id),
        where('number', '==', winningNumber)
    );

    try {
        const winnersSnapshot = await getDocs(winnersQuery);
        const winningDocs = winnersSnapshot.docs.map(doc => doc.data() as LotteryNumber);

        if (winningDocs.length === 0) {
            toast({ title: "No winners for this event.", description: "No payouts were processed." });
            return { winnersCount: 0, totalPayout: 0 };
        }
        
        const prizeMap: { [key: string]: number } = {
            '1D': appSettings.prize1D,
            '2D': appSettings.prize2D,
            '3D': appSettings.prize3D,
            '4D': appSettings.prize4D,
        };
        const payoutAmount = prizeMap[event.gameType as keyof typeof prizeMap];

        if (payoutAmount === undefined) {
            toast({ variant: 'destructive', title: "Configuration Error", description: `No prize amount configured for game type: ${event.gameType}`});
            return { winnersCount: 0, totalPayout: 0 };
        }

        const batch = writeBatch(firestore);
        let totalPayout = 0;
        
        const winningEntriesByUser: Record<string, { totalWinnings: number, walletRef: any, walletData: Wallet }> = {};

        for (const winnerDoc of winningDocs) {
            const userId = winnerDoc.userId;
            
            if (!winningEntriesByUser[userId]) {
                 const walletQuery = query(collection(firestore, 'users', userId, 'wallets'), limit(1));
                 const walletSnapshot = await getDocs(walletQuery);
                 if (walletSnapshot.empty) {
                    console.warn(`No wallet found for winner user ID: ${userId}`);
                    continue;
                }
                const walletDoc = walletSnapshot.docs[0];
                winningEntriesByUser[userId] = {
                    totalWinnings: 0,
                    walletRef: walletDoc.ref,
                    walletData: walletDoc.data() as Wallet
                };
            }
            // Payout is the fixed prize amount multiplied by the units purchased
            const winnings = payoutAmount * winnerDoc.unitsPurchased;
            winningEntriesByUser[userId].totalWinnings += winnings;
            totalPayout += winnings;
        }

        for (const userId in winningEntriesByUser) {
            const entry = winningEntriesByUser[userId];
            const newBalance = entry.walletData.balance + entry.totalWinnings;
            batch.update(entry.walletRef, { balance: newBalance });

            const transactionRef = doc(collection(firestore, 'users', userId, 'wallets', entry.walletData.id, 'transactions'));
            batch.set(transactionRef, {
                id: transactionRef.id,
                userId: userId,
                walletId: entry.walletData.id,
                transactionDate: new Date().toISOString(),
                amount: entry.totalWinnings,
                type: 'Payout',
                description: `Winnings for ${event.name} (Number: ${winningNumber})`,
                lotteryEventId: event.id
            });
        }

        await batch.commit();
        return { winnersCount: Object.keys(winningEntriesByUser).length, totalPayout };

    } catch (e: any) {
        console.error('Payout processing failed:', e);
        toast({
            variant: "destructive",
            title: "Payout Failed",
            description: e.message || "An error occurred while processing payouts."
        });
        return { winnersCount: 0, totalPayout: 0 };
    }
  };


  const onSubmit = async (data: WinnerFormValues) => {
    if (!firestore || !event || !settings) {
        toast({ variant: 'destructive', title: 'Error', description: 'Missing required data to declare winner.' });
        return;
    }

    if (event.status !== 'Open') {
        toast({ variant: 'destructive', title: 'Event Not Open', description: 'This event is already closed or completed.' });
        return;
    }

    try {
        const eventRef = doc(firestore, 'lotteryEvents', event.id);
        
        if (event.gameType !== 'LuckyDraw') {
            toast({ description: "Declaring result and processing payouts..." });
            const payoutResult = await handlePayouts(event, data.result, settings);
             if (payoutResult.winnersCount > 0) {
                toast({
                    variant: "success",
                    title: "Payouts Complete!",
                    description: `Paid ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payoutResult.totalPayout)} to ${payoutResult.winnersCount} winner(s).`
                });
            }
        } else {
             // For lucky draws, just mark as complete. Admin handles prize distribution manually.
            toast({
                title: "Lucky Draw Completed",
                description: `Winner is holder of ticket: ${data.result}. Manual prize distribution required.`
            });
        }
        
        // Update event status after payouts
        await updateDoc(eventRef, {
            result: data.result,
            status: 'Completed',
            isEnabled: false,
        });

        toast({
            title: 'Winner Declared!',
            description: `The result for "${event.name}" is ${data.result}.`,
        });

        onOpenChange(false);
    } catch(e: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to declare winner',
            description: e.message || 'An unexpected error occurred.',
        });
    } finally {
        form.reset();
    }
  };

  if (!event) return null;
  
  const isLuckyDraw = event.gameType === 'LuckyDraw';
  const isSubmitting = form.formState.isSubmitting || isLoadingSettings;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Declare Winner for {event.name}</DialogTitle>
          <DialogDescription>
            {isLuckyDraw
              ? "Enter the winning ticket ID. This action will complete the event."
              : "Enter the winning number to complete this event and trigger payouts. This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isLuckyDraw ? 'Winning Ticket ID' : `Winning Number (${event.gameType})`}</FormLabel>
                  <FormControl>
                    <Input placeholder={isLuckyDraw ? 'Enter ticket ID' : `Enter ${parseInt(event.gameType.replace('D', ''))}-digit number`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Declare Winner'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    