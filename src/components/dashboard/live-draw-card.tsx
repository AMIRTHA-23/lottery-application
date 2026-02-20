'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { LiveDraw } from '@/lib/types';
import Link from 'next/link';
import { useCountdown } from '@/hooks/use-countdown';
import { Badge } from '@/components/ui/badge';
import { Ticket } from 'lucide-react';

const CountdownItem = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-xl lg:text-2xl font-bold">{String(value).padStart(2, '0')}</span>
    <span className="text-xs uppercase text-white/70">{label}</span>
  </div>
);

export function LiveDrawCard({ event }: { event: LiveDraw }) {
  const { days, hours, minutes, seconds, isFinished } = useCountdown(event.eventDate);

  return (
    <div className="relative rounded-lg overflow-hidden aspect-video flex flex-col justify-end text-white">
      <Image
        src={event.image}
        alt={event.name}
        fill
        className="object-cover -z-10"
        data-ai-hint={event.imageHint}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent -z-10" />

      <div className="p-4 space-y-3">
        <div>
          <Badge>Live Draw</Badge>
          <h3 className="text-2xl font-bold tracking-tight">{event.name}</h3>
          <p className="text-lg font-semibold text-primary">{event.prize}</p>
        </div>

        {isFinished ? (
            <div className='text-center py-4 bg-black/50 rounded-md'>
                <p className='font-bold text-lg'>Draw Completed!</p>
                <Button asChild variant="secondary" size="sm" className='mt-2'>
                    <Link href="/dashboard/results">Check Results</Link>
                </Button>
            </div>
        ) : (
             <div className="grid grid-cols-4 gap-2 text-center bg-black/50 p-2 rounded-md">
                <CountdownItem value={days} label="Days" />
                <CountdownItem value={hours} label="Hours" />
                <CountdownItem value={minutes} label="Mins" />
                <CountdownItem value={seconds} label="Secs" />
            </div>
        )}

        <Button asChild className="w-full" disabled={isFinished}>
          <Link href={`/dashboard/play/${event.id}`}>
            <Ticket className="mr-2 h-4 w-4" />
            Buy Ticket
          </Link>
        </Button>
      </div>
    </div>
  );
}

    