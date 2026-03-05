'use client';

import { useFirestore, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { LotteryEvent, CartItem } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Wand2, PartyPopper, ShoppingCart } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState } from 'react';
import { NumberInput } from '@/components/dashboard/number-input';
import { generateLuckyNumber } from '@/ai/flows/generate-lucky-number';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/components/dashboard/cart-context';

const purchaseSchema = z.object({
  board: z.string().min(1, "Please select a board."),
  number: z.string().regex(/^\d+$/, 'Must be a numeric value.'),
  unitsPurchased: z.coerce.number().min(1, { message: 'At least 1 unit.' }),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export default function PlayEventPage() {
  const { eventId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isPicking, setIsPicking] = useState(false);

  const eventRef = useMemoFirebase(() => {
    if (!firestore || !eventId) return null;
    return doc(firestore, 'lotteryEvents', eventId as string);
  }, [firestore, eventId]);
  const { data: event, isLoading: isEventLoading } = useDoc<LotteryEvent>(eventRef);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      unitsPurchased: 1,
      number: '',
    },
  });

  if (isEventLoading) {
    return <div className="container py-6 max-w-2xl mx-auto"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!event) return <div className="container py-6">Event not found.</div>;

  const agency = event.agency || 'Kerala';
  
  const getBoards = () => {
    if (agency === 'Kerala') return ['A', 'B', 'C', 'X', 'AB', 'BC', 'AC', 'ABC', 'XABC'];
    return ['A', 'B', 'C', 'AB', 'BC', 'AC', 'ABC'];
  };

  const getPrice = (board: string) => {
    if (board.length === 1) return 11;
    if (board.length === 2) return 11;
    if (board === 'ABC') return 12; // Base price for 3D ABC
    if (board === 'XABC') return 20;
    return event.unitPrice;
  };

  const handleQuickPick = async () => {
    if (!user) return;
    const board = form.getValues('board');
    if (!board) {
      toast({ title: "Select a board first", variant: 'destructive' });
      return;
    }
    setIsPicking(true);
    try {
      const typeMap: Record<number, any> = { 1: '1D', 2: '2D', 3: '3D', 4: '4D' };
      const result = await generateLuckyNumber({
        userName: user.displayName || 'player',
        gameType: typeMap[board.length] || '1D',
      });
      if (result.luckyNumber) {
        form.setValue('number', result.luckyNumber.slice(0, board.length), { shouldValidate: true });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPicking(false);
    }
  };

  const onAddToCart = (data: PurchaseFormValues) => {
    const digitCount = data.board.length;
    if (data.number.length !== digitCount) {
      form.setError('number', { message: `Number must be ${digitCount} digits.` });
      return;
    }

    const price = getPrice(data.board);
    const cartItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      eventName: event.name,
      eventId: event.id,
      agency: agency as any,
      board: data.board,
      number: data.number,
      unit: data.unitsPurchased,
      price: price,
      amount: price * data.unitsPurchased,
      eventDate: event.eventDate,
    };

    addToCart(cartItem);
    toast({
      title: 'Added to Cart',
      description: `${data.board} - ${data.number} added successfully.`,
    });
    router.push('/dashboard/cart');
  };

  return (
    <div className="container py-6 max-w-2xl mx-auto">
      <Card className="border-[#FF0055]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onAddToCart)}>
            <CardHeader className="bg-[#FF0055] text-white">
              <CardTitle className="flex items-center gap-2">
                <PartyPopper /> DIAMOND AGENCY
              </CardTitle>
              <CardDescription className="text-white/80">
                Playing: {event.name} ({agency} Agency)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="board"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Game Type / Board</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a board" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getBoards().map(b => (
                          <SelectItem key={b} value={b}>{b} Board</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('board') && (
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-center block">Enter {form.watch('board').length} Digit Number</FormLabel>
                      <FormControl>
                        <NumberInput 
                          length={form.watch('board').length}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={handleQuickPick} disabled={isPicking}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isPicking ? 'Consulting...' : 'Quick Pick'}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="unitsPurchased"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Units / Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-[#FF0055] hover:bg-[#D40045]">
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
