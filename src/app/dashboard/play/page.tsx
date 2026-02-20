'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { LotteryEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlayPage() {
    const firestore = useFirestore();

    const eventsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'lotteryEvents');
    }, [firestore]);

    const { data: allEvents, isLoading } = useCollection<LotteryEvent>(eventsQuery);

    const lotteryEvents = useMemo(() => {
        if (!allEvents) return [];
        return allEvents
            .filter(event => event.status === 'Open' && event.isEnabled)
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    }, [allEvents]);


    return (
        <div className="container py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Play Lottery</h1>
                <p className="text-muted-foreground">Choose an active lottery to place your bet.</p>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : lotteryEvents && lotteryEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {lotteryEvents.map((event) => (
                        <Card key={event.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {event.name}
                                    <Badge variant="success">{event.gameType}</Badge>
                                </CardTitle>
                                <CardDescription>Draw on: {new Date(event.eventDate).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Price per unit</span>
                                    <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(event.unitPrice)}</span>
                                </div>
                                <Button asChild className="w-full">
                                    <Link href={`/dashboard/play/${event.id}`}>
                                        <Ticket className="mr-2 h-4 w-4" />
                                        Place Bet
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">No Active Lotteries</h3>
                    <p className="text-muted-foreground mt-2">There are no open lottery events right now. Please check back later!</p>
                </div>
            )}
        </div>
    );
}
