'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { LotteryEvent, AppSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function PlayPage() {
    const firestore = useFirestore();

    const eventsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'lotteryEvents');
    }, [firestore]);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'app') : null, [firestore]);

    const { data: allEvents, isLoading: isLoadingEvents } = useCollection<LotteryEvent>(eventsQuery);
    const { data: settings, isLoading: isLoadingSettings } = useDoc<AppSettings>(settingsRef);
    
    const isLoading = isLoadingEvents || isLoadingSettings;

    const eventsByGameType = useMemo(() => {
        if (!allEvents) return {};
        const openEvents = allEvents.filter(event => event.status === 'Open' && event.isEnabled);
        
        return openEvents.reduce((acc, event) => {
            const gameType = event.gameType;
            if (!acc[gameType]) {
                acc[gameType] = [];
            }
            acc[gameType].push(event);
            return acc;
        }, {} as Record<string, LotteryEvent[]>);
    }, [allEvents]);
    
    const gameTypes = Object.keys(eventsByGameType).sort((a,b) => {
        if (a === 'LuckyDraw') return 1;
        if (b === 'LuckyDraw') return -1;
        return a.localeCompare(b);
    });
    
    const getPrize = (gameType: LotteryEvent['gameType'], eventPrize: string | undefined) => {
        if (gameType === 'LuckyDraw') return eventPrize;
        if (!settings) return '...';
        
        const prizeMap: { [key: string]: number } = {
            '1D': settings.prize1D,
            '2D': settings.prize2D,
            '3D': settings.prize3D,
            '4D': settings.prize4D,
        };

        const amount = prizeMap[gameType];
        if (amount === undefined) return '...';
        
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    }


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
            ) : gameTypes.length > 0 ? (
                <Tabs defaultValue={gameTypes[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4">
                        {gameTypes.map(type => (
                            <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
                        ))}
                    </TabsList>
                    {gameTypes.map(type => (
                        <TabsContent key={type} value={type}>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {eventsByGameType[type]
                                    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                                    .map((event) => {
                                        const prize = getPrize(event.gameType, event.prize);
                                        return (
                                            <Card key={event.id}>
                                                <CardHeader>
                                                    <CardTitle className="flex justify-between items-center">
                                                        {event.name}
                                                        <Badge variant="success">{event.gameType}</Badge>
                                                    </CardTitle>
                                                    <CardDescription>Draw on: {new Date(event.eventDate).toLocaleDateString()}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="flex justify-between items-center font-semibold text-lg text-primary">
                                                        <span>Win</span>
                                                        <span>{prize}</span>
                                                    </div>
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
                                        );
                                    })}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">No Active Lotteries</h3>
                    <p className="text-muted-foreground mt-2">There are no open lottery events right now. Please check back later!</p>
                </div>
            )}
        </div>
    );
}

    