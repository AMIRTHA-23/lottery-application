'use client';
import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { LotteryEvent, LiveDraw } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { LiveDrawCard } from './live-draw-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '../ui/card';

export function LiveDrawCarousel() {
  const firestore = useFirestore();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for open, enabled "LuckyDraw" events
    return query(
        collection(firestore, 'lotteryEvents'), 
        where('gameType', '==', 'LuckyDraw'),
        where('status', '==', 'Open'),
        where('isEnabled', '==', true)
    );
  }, [firestore]);

  const { data: events, isLoading } = useCollection<LotteryEvent>(eventsQuery);

  const liveDraws: LiveDraw[] = useMemo(() => {
    if (!events) return [];
    const placeholderImages = PlaceHolderImages.filter(img => img.id.startsWith('live-draw'));

    return events.map((event, index) => ({
      ...event,
      image: placeholderImages[index % placeholderImages.length].imageUrl,
      imageHint: placeholderImages[index % placeholderImages.length].imageHint,
    }));
  }, [events]);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="aspect-video w-full rounded-2xl" />
        </div>
    )
  }

  if (!liveDraws || liveDraws.length === 0) {
    return null; 
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#FF0055]">Exciting Live Draws</h2>
        <span className="text-[10px] font-bold text-muted-foreground uppercase">Swipe for more</span>
      </div>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full relative group/carousel"
      >
        <CarouselContent>
          {liveDraws.map((event) => (
            <CarouselItem key={event.id} className="pl-0">
               <div className="px-1">
                <LiveDrawCard event={event} />
               </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity">
            <CarouselPrevious className="pointer-events-auto h-10 w-10 bg-white/20 backdrop-blur-xl border-white/30 text-white hover:bg-[#FF0055] hover:text-white" />
            <CarouselNext className="pointer-events-auto h-10 w-10 bg-white/20 backdrop-blur-xl border-white/30 text-white hover:bg-[#FF0055] hover:text-white" />
        </div>
      </Carousel>
    </div>
  );
}
