'use client';

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { LotteryNumber, LotteryEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, Calendar, Hash, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MyTicketsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch all user's lottery numbers
  const numbersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'lotteryNumbers'), orderBy('purchaseDate', 'desc'));
  }, [user, firestore]);
  const { data: tickets, isLoading: isTicketsLoading } = useCollection<LotteryNumber>(numbersQuery);

  // Fetch all events to correlate status
  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'lotteryEvents');
  }, [firestore]);
  const { data: events, isLoading: isEventsLoading } = useCollection<LotteryEvent>(eventsQuery);

  const isLoading = isTicketsLoading || isEventsLoading;

  const categorizedTickets = useMemo(() => {
    if (!tickets || !events) return { upcoming: [], past: [] };

    const eventMap = new Map(events.map((e) => [e.id, e]));

    const upcoming: (LotteryNumber & { event?: LotteryEvent })[] = [];
    const past: (LotteryNumber & { event?: LotteryEvent })[] = [];

    tickets.forEach((ticket) => {
      const event = eventMap.get(ticket.lotteryEventId);
      if (event?.status === 'Completed') {
        past.push({ ...ticket, event });
      } else {
        upcoming.push({ ...ticket, event });
      }
    });

    return { upcoming, past };
  }, [tickets, events]);

  const TicketTable = ({ data }: { data: (LotteryNumber & { event?: LotteryEvent })[] }) => (
    <div className="bg-white rounded-lg border-2 border-[#FF0055] overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-pink-50">
          <TableRow className="border-b-[#FF0055]">
            <TableHead className="text-[#FF0055] font-bold uppercase text-xs">Lot details</TableHead>
            <TableHead className="text-[#FF0055] font-bold uppercase text-xs text-center">Number</TableHead>
            <TableHead className="text-[#FF0055] font-bold uppercase text-xs text-center">Units</TableHead>
            <TableHead className="text-[#FF0055] font-bold uppercase text-xs text-right">Amount (₹)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                <Ticket className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="uppercase tracking-widest text-xs">No tickets found</p>
              </TableCell>
            </TableRow>
          ) : (
            data.map((ticket) => (
              <TableRow key={ticket.id} className="border-b-[#FF0055]/20 hover:bg-pink-50/50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{ticket.eventName || ticket.event?.name || 'Unknown Event'}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-[#FF0055] text-[#FF0055]">
                        {ticket.board} BOARD
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {ticket.agency}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono font-bold text-xl text-[#FF0055]">{ticket.number}</span>
                </TableCell>
                <TableCell className="text-center font-semibold">{ticket.unitsPurchased}</TableCell>
                <TableCell className="text-right font-bold">
                  ₹{(ticket.amount || (ticket.unitPrice * ticket.unitsPurchased)).toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#FF0055] flex items-center gap-2">
          <Ticket className="h-8 w-8" /> MY TICKETS
        </h1>
        <p className="text-muted-foreground">View your active entries and past draw history.</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-pink-50 mb-6 border border-[#FF0055]/20">
          <TabsTrigger 
            value="upcoming" 
            className="data-[state=active]:bg-[#FF0055] data-[state=active]:text-white font-bold"
          >
            ACTIVE ENTRIES ({categorizedTickets.upcoming.length})
          </TabsTrigger>
          <TabsTrigger 
            value="past" 
            className="data-[state=active]:bg-[#FF0055] data-[state=active]:text-white font-bold"
          >
            PAST DRAWS ({categorizedTickets.past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <TicketTable data={categorizedTickets.upcoming} />
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
           {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <TicketTable data={categorizedTickets.past} />
          )}
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-pink-50 border border-[#FF0055]/20 rounded-lg">
        <h3 className="text-[#FF0055] font-bold text-sm mb-2 uppercase tracking-wide">Diamond Agency Support</h3>
        <p className="text-xs text-muted-foreground italic">
          ** Tickets are valid only for the specific draw time mentioned. In case of any disputes, the decision of Diamond Agency management will be final. Check Results page for official winning numbers.
        </p>
      </div>
    </div>
  );
}
