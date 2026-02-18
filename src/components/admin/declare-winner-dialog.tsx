'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { LotteryEvent } from '@/lib/types';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

interface DeclareWinnerDialogProps {
  event: LotteryEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const getWinnerSchema = (gameType: LotteryEvent['gameType']) => {
    const digitCount = parseInt(gameType.replace('D', ''));
    return z.object({
        result: z.string().length(digitCount, { message: `Winning number must be ${digitCount} digits.` }).regex(/^\d+$/, "Must be a number."),
    });
}


export function DeclareWinnerDialog({ event, isOpen, onOpenChange }: DeclareWinnerDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const formSchema = getWinnerSchema(event?.gameType || '1D');
  type WinnerFormValues = z.infer<typeof formSchema>;

  const form = useForm<WinnerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      result: '',
    },
  });

  const onSubmit = (data: WinnerFormValues) => {
    if (!firestore || !event) return;

    const eventRef = doc(firestore, 'lotteryEvents', event.id);
    updateDocumentNonBlocking(eventRef, {
      result: data.result,
      status: 'Completed',
    });

    toast({
      title: 'Winner Declared',
      description: `The result for "${event.name}" has been set to ${data.result}.`,
    });
    onOpenChange(false);
    form.reset();
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Declare Winner for {event.name}</DialogTitle>
          <DialogDescription>
            Enter the winning number to complete this event. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Winning Number ({event.gameType})</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${parseInt(event.gameType.replace('D', ''))}-digit number`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Declaring...' : 'Declare Winner'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    