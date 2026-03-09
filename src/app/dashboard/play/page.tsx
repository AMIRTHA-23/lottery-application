'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { LotteryEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Gavel, Clock, ShieldCheck, Info, Scale } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlayPage() {
    const firestore = useFirestore();

    const eventsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'lotteryEvents'), where('status', '==', 'Open'), where('isEnabled', '==', true));
    }, [firestore]);

    const { data: allEvents, isLoading } = useCollection<LotteryEvent>(eventsQuery);

    const categories = ['Kerala', 'Dear', 'Jackpot'];

    return (
        <div className="container py-6 space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-[#FF0055]">DIAMOND AGENCY</h1>
                <p className="text-muted-foreground italic">India's Largest Prize Agency - Select your Lot</p>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            ) : (
                <>
                    {categories.map(cat => (
                        <div key={cat} className="space-y-4">
                            <div className="flex items-center gap-2 border-b-2 border-[#FF0055] pb-2">
                                <Badge className="bg-[#FF0055] text-white text-lg px-4">{cat} Lottery</Badge>
                                {cat === 'Jackpot' && <span className="text-xs text-muted-foreground"><Clock className="inline h-3 w-3 mr-1" /> Draws every hour</span>}
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {allEvents?.filter(e => (e.agency || 'Kerala') === cat).map(event => (
                                    <Card key={event.id} className="border-t-4 border-t-[#FF0055] shadow-md hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <CardTitle>{event.name}</CardTitle>
                                            <CardDescription>Draw: {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="bg-pink-50 p-2 rounded text-sm">
                                                <p className="font-bold text-[#FF0055]">Game Types:</p>
                                                <p>1D, 2D, 3D {cat === 'Kerala' ? '& 4D' : ''}</p>
                                            </div>
                                            <Button asChild className="w-full bg-[#FF0055] hover:bg-[#D40045] font-bold">
                                                <Link href={`/dashboard/play/${event.id}`}>
                                                    <Gavel className="mr-2 h-4 w-4" /> Place Bet
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                                {allEvents?.filter(e => (e.agency || 'Kerala') === cat).length === 0 && (
                                    <p className="text-muted-foreground text-sm italic col-span-3 py-4 border border-dashed rounded-lg text-center">No active {cat} lots at this moment.</p>
                                )}
                            </div>
                        </div>
                    ))}

                    <Card className="bg-muted/30 border-dashed border-[#FF0055]/30">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 text-[#FF0055] mt-1 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-sm uppercase">100% Secure</h4>
                                        <p className="text-xs text-muted-foreground">Your selections are encrypted and private. We ensure fair play for all users.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Scale className="h-5 w-5 text-[#FF0055] mt-1 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-sm uppercase">Fair Payouts</h4>
                                        <p className="text-xs text-muted-foreground">Winnings are calculated instantly based on official state lottery results.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Info className="h-5 w-5 text-[#FF0055] mt-1 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-sm uppercase">Responsible Play</h4>
                                        <p className="text-xs text-muted-foreground">Only play what you can afford. This platform is strictly for users aged 18+.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
