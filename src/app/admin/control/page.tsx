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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeclareWinnerDialog } from '@/components/admin/declare-winner-dialog';

const createEventSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters long.' }),
  eventDate: z.date({ required_error: 'An event date is required.' }),
  gameType: z.enum(['1D', '2D', '3D', '4D'], { required_error: 'Please select a game type.'}),
  unitPrice: z.coerce.number().min(1, { message: 'Unit price must be at least 1.'}),
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

export default function ControlPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<LotteryEvent | null>(null);
  const [isWinnerDialogOpen, setWinnerDialogOpen] = useState(false);

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'lotteryEvents');
  }, [firestore]);

  const { data: events, isLoading } = useCollection<LotteryEvent>(eventsQuery);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      unitPrice: 10,
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
      gameType: data.gameType,
      unitPrice: data.unitPrice,
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

  const openDeclareWinnerDialog = (event: LotteryEvent) => {
    setSelectedEvent(event);
    setWinnerDialogOpen(true);
  };


  return (
    <div className="space-y-6">
      <DeclareWinnerDialog event={selectedEvent} isOpen={isWinnerDialogOpen} onOpenChange={setWinnerDialogOpen} />
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Game Type</Label>
                    <Select onValueChange={(value) => form.setValue('gameType', value as '1D'|'2D'|'3D'|'4D')} defaultValue={form.getValues('gameType')}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1D">1D</SelectItem>
                            <SelectItem value="2D">2D</SelectItem>
                            <SelectItem value="3D">3D</SelectItem>
                            <SelectItem value="4D">4D</SelectItem>
                        </SelectContent>
                    </Select>
                     {form.formState.errors.gameType && <p className="text-sm text-destructive">{form.formState.errors.gameType.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price</Label>
                    <Input id="unitPrice" type="number" placeholder="e.g., 10" {...form.register('unitPrice')} />
                    {form.formState.errors.unitPrice && <p className="text-sm text-destructive">{form.formState.errors.unitPrice.message}</p>}
                </div>
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
            <CardDescription>Enable, disable, or declare winners for events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Loading events...</TableCell></TableRow>}
                {!isLoading && events && events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className='font-medium'>{event.name} <span className="text-xs text-muted-foreground">({event.gameType})</span></TableCell>
                    <TableCell><Badge variant={event.status === 'Open' ? 'success' : event.status === 'Completed' ? 'default' : 'secondary'}>{event.status}</Badge></TableCell>
                    <TableCell className="flex justify-end gap-2 items-center">
                       <Switch
                        checked={event.isEnabled}
                        onCheckedChange={() => handleToggleEnabled(event)}
                        aria-label="Toggle Event"
                        disabled={event.status === 'Completed'}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDeclareWinnerDialog(event)}
                        disabled={event.status !== 'Open' || !event.isEnabled}
                      >
                        Declare Result
                      </Button>
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
