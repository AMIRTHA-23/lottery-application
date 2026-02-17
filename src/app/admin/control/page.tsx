'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { LotteryEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const createEventSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters long.' }),
  eventDate: z.date({ required_error: 'An event date is required.' }),
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

export default function ControlPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'lotteryEvents');
  }, [firestore]);

  const { data: events, isLoading } = useCollection<LotteryEvent>(eventsQuery);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
    },
  });

  const handleCreateEvent: SubmitHandler<CreateEventFormValues> = async (data) => {
    if (!firestore) return;

    const newEvent: Omit<LotteryEvent, 'id'> = {
      name: data.name,
      eventDate: data.eventDate.toISOString(),
      result: '',
      status: 'Open',
      isEnabled: true,
    };

    addDocumentNonBlocking(collection(firestore, 'lotteryEvents'), newEvent);
    
    toast({
      title: 'Event Created',
      description: `The event "${data.name}" has been successfully created.`,
    });
    form.reset();
  };
  
  const handleToggleEnabled = (event: LotteryEvent) => {
    if (!firestore) return;
    const eventRef = doc(firestore, 'lotteryEvents', event.id);
    updateDocumentNonBlocking(eventRef, { isEnabled: !event.isEnabled });
     toast({
      title: 'Event Updated',
      description: `"${event.name}" has been ${!event.isEnabled ? 'enabled' : 'disabled'}.`,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Game Control</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <form onSubmit={form.handleSubmit(handleCreateEvent)}>
            <CardHeader>
              <CardTitle>Create New Lottery Event</CardTitle>
              <CardDescription>Set up a new event for users to join.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" placeholder="e.g., Daily Draw" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !form.watch('eventDate') && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('eventDate') ? format(form.watch('eventDate'), 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch('eventDate')}
                      onSelect={(date) => form.setValue('eventDate', date as Date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                 {form.formState.errors.eventDate && <p className="text-sm text-destructive">{form.formState.errors.eventDate.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Event"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Events</CardTitle>
            <CardDescription>Enable or disable ongoing lottery events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Loading events...</TableCell></TableRow>}
                {!isLoading && events && events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className='font-medium'>{event.name}</TableCell>
                    <TableCell><Badge variant={event.status === 'Open' ? 'success' : 'secondary'}>{event.status}</Badge></TableCell>
                    <TableCell className="text-right">
                       <Switch
                        checked={event.isEnabled}
                        onCheckedChange={() => handleToggleEnabled(event)}
                        aria-label="Toggle Event"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && (!events || events.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                        No events found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
