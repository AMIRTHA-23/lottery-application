'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NumberSelector } from './number-selector';
import type { LotteryGame } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface GameCardProps {
  game: LotteryGame;
}

export function GameCard({ game }: GameCardProps) {
    const { toast } = useToast();

    const handlePurchase = (numbers: string, quantity: number, total: number) => {
        toast({
            title: "Purchase Successful!",
            description: `You bought ${quantity} ticket(s) for number ${numbers}. Total: ₹${total}.`,
        });
        // In a real app, you would close the dialog here.
        // For now, we just show a toast.
    }

  return (
    <Dialog>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
                <Ticket className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{game.name}</CardTitle>
          </div>
          <CardDescription>{game.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow" />
        <CardFooter>
          <DialogTrigger asChild>
            <Button className="w-full">Play Now</Button>
          </DialogTrigger>
        </CardFooter>
      </Card>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Play {game.name}</DialogTitle>
        </DialogHeader>
        <NumberSelector game={game} onPurchase={handlePurchase}/>
      </DialogContent>
    </Dialog>
  );
}
