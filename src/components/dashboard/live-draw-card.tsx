'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { LiveDraw } from '@/lib/types';
import Link from 'next/link';
import { useCountdown } from '@/hooks/use-countdown';
import { Badge } from '@/components/ui/badge';
import { Ticket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const CountdownItem = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-lg p-2 min-w-[60px] border border-white/20">
    <span className="text-xl lg:text-3xl font-black tabular-nums">{String(value).padStart(2, '0')}</span>
    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">{label}</span>
  </div>
);

export function LiveDrawCard({ event }: { event: LiveDraw }) {
  const { days, hours, minutes, seconds, isFinished } = useCountdown(event.eventDate);

  return (
    <div className="group relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-video flex flex-col justify-end text-white shadow-2xl transition-all duration-500 hover:shadow-primary/20 border border-white/10">
      <Image
        src={event.image}
        alt={event.name}
        fill
        className="object-cover -z-10 transition-transform duration-700 group-hover:scale-110"
        data-ai-hint={event.imageHint}
      />
      
      {/* Dynamic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent -z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF0055]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#FF0055] hover:bg-[#FF0055] text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 animate-pulse">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                Live Now
              </Badge>
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{event.gameType} Premium</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">{event.name}</h3>
            <p className="text-lg sm:text-xl font-bold text-[#FF0055] flex items-center gap-2">
              <Zap className="h-5 w-5 fill-[#FF0055]" />
              {event.prize}
            </p>
          </div>
        </div>

        {isFinished ? (
            <div className='text-center py-6 bg-black/60 backdrop-blur-md rounded-xl border border-white/10'>
                <p className='font-black text-xl text-yellow-400 uppercase tracking-tighter'>Draw Completed!</p>
                <Button asChild variant="link" size="sm" className='text-white hover:text-[#FF0055] mt-1'>
                    <Link href="/dashboard/results">View Final Winners</Link>
                </Button>
            </div>
        ) : (
             <div className="flex justify-between gap-2">
                <CountdownItem value={days} label="Days" />
                <CountdownItem value={hours} label="Hours" />
                <CountdownItem value={minutes} label="Mins" />
                <CountdownItem value={seconds} label="Secs" />
            </div>
        )}

        <Button 
          asChild 
          className={cn(
            "w-full h-14 text-lg font-black rounded-xl shadow-xl transition-all duration-300",
            isFinished 
              ? "bg-white/10 text-white/40 pointer-events-none" 
              : "bg-[#FF0055] hover:bg-[#D40045] hover:scale-[1.02] active:scale-95"
          )}
          disabled={isFinished}
        >
          <Link href={`/dashboard/play/${event.id}`}>
            <Ticket className="mr-2 h-6 w-6 rotate-12" />
            BUY YOUR TICKET NOW
          </Link>
        </Button>
      </div>
    </div>
  );
}
