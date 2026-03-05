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
import { Wand2, PartyPopper, ShoppingCart, Ticket } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState, useEffect } from 'react';
import { NumberInput } from '@/components/dashboard/number-input';
import { generateLuckyNumber } from '@/ai/flows/generate-lucky-number';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/components/dashboard/cart-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [activeTab, setActiveTab] = useState('1D');

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
      board: '',
    },
  });

  const agency = event?.agency || 'Kerala';

  const gameTypes = [
    { id: '1D', boards: ['A', 'B', 'C'] },
    { id: '2D', boards: ['AB', 'BC', 'AC'] },
    { id: '3D', boards: ['ABC'] },
    { id: '4D', boards: ['XABC'], hidden: agency !== 'Kerala' }
  ];

  const getPrice = (board: string) => {
    if (board.length === 1) return 11;
    if (board.length === 2) return 11;
    if (board === 'ABC') return 12; 
    if (board === 'XABC') return 20;
    return event?.unitPrice || 10;
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
      const result = await generateLuckyNumber({
        userName: user.displayName || 'player',
        gameType: activeTab as any,
      });
      if (result.luckyNumber) {
        // Adjust length based on board
        const cleanNum = result.luckyNumber.replace(/\D/g, '').slice(0, board.length);
        form.setValue('number', cleanNum, { shouldValidate: true });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPicking(false);
    }
  };

  const onAddToCart = (data: PurchaseFormValues) => {
    if (!event) return;
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

  if (isEventLoading) {
    return <div className="container py-6 max-w-2xl mx-auto"><Skeleton className="h-[500px] w-full" /></div>;
  }

  if (!event) return <div className="container py-6">Event not found.</div>;

  return (
    <div className="container py-6 max-w-2xl mx-auto">
      <Card className="border-[#FF0055] overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onAddToCart)}>
            <CardHeader className="bg-[#FF0055] text-white">
              <CardTitle className="flex items-center gap-2">
                <PartyPopper /> DIAMOND AGENCY
              </CardTitle>
              <CardDescription className="text-white/80">
                Playing: {event.name} ({agency})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-[#FF0055]">Select Game Category</label>
                <Tabs defaultValue="1D" className="w-full" onValueChange={(val) => {
                  setActiveTab(val);
                  form.setValue('board', '');
                  form.setValue('number', '');
                }}>
                  <TabsList className="grid w-full grid-cols-4 bg-pink-50">
                    <TabsTrigger value="1D" className="data-[state=active]:bg-[#FF0055] data-[state=active]:text-white">1D</TabsTrigger>
                    <TabsTrigger value="2D" className="data-[state=active]:bg-[#FF0055] data-[state=active]:text-white">2D</TabsTrigger>
                    <TabsTrigger value="3D" className="data-[state=active]:bg-[#FF0055] data-[state=active]:text-white">3D</TabsTrigger>
                    <TabsTrigger value="4D" disabled={agency !== 'Kerala'} className="data-[state=active]:bg-[#FF0055] data-[state=active]:text-white">4D</TabsTrigger>
                  </TabsList>

                  {gameTypes.map((gt) => (
                    <TabsContent key={gt.id} value={gt.id} className="pt-4">
                      <FormField
                        control={form.control}
                        name="board"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Board for {gt.id}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${gt.id} Board`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {gt.boards.map(b => (
                                  <SelectItem key={b} value={b}>{b} Board</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {form.watch('board') && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-center block font-bold text-[#FF0055]">Enter {form.watch('board').length} Digit Number</FormLabel>
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

                  <div className="flex justify-center">
                    <Button type="button" variant="outline" className="border-[#FF0055] text-[#FF0055]" onClick={handleQuickPick} disabled={isPicking}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isPicking ? 'Consulting Oracle...' : 'Quick Pick'}
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name="unitsPurchased"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Units / Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} className="h-12 text-lg font-bold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                    <div className="flex justify-between items-center font-bold">
                      <span>Unit Price</span>
                      <span>₹{getPrice(form.watch('board'))}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-[#FF0055] text-xl mt-2">
                      <span>Total Amount</span>
                      <span>₹{(getPrice(form.watch('board')) * form.watch('unitsPurchased')).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 border-t p-6">
              <Button 
                type="submit" 
                className="w-full bg-[#FF0055] hover:bg-[#D40045] h-14 text-xl font-bold rounded-xl shadow-lg"
                disabled={!form.watch('board')}
              >
                <ShoppingCart className="mr-2 h-6 w-6" /> Add to Cart
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
