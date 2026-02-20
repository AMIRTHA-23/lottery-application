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
        <Card>
            <CardContent className="p-4">
                 <Skeleton className="aspect-video w-full rounded-lg" />
            </CardContent>
        </Card>
    )
  }

  if (!liveDraws || liveDraws.length === 0) {
    return null; // Don't render anything if there are no live draws
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {liveDraws.map((event) => (
          <CarouselItem key={event.id}>
             <LiveDrawCard event={event} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}

    