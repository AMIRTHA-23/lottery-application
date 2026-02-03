'use client';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LotteryGame } from '@/lib/types';

interface NumberSelectorProps {
  game: LotteryGame;
  onPurchase: (numbers: string, quantity: number, total: number) => void;
}

export function NumberSelector({ game, onPurchase }: NumberSelectorProps) {
  const [numbers, setNumbers] = useState<string[]>(Array(game.digit).fill(''));
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const pricePerTicket = 10;
  const totalPrice = useMemo(() => quantity * pricePerTicket, [quantity]);

  const handleNumberChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newNumbers = [...numbers];
      newNumbers[index] = value;
      setNumbers(newNumbers);

      // Auto-focus next input
      if (value && index < game.digit - 1) {
        const nextInput = document.getElementById(`num-input-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handlePurchase = () => {
    if (numbers.some(n => n === '')) {
      toast({
        variant: 'destructive',
        title: 'Invalid Number',
        description: 'Please fill in all digits.',
      });
      return;
    }
    const finalNumber = numbers.join('');
    onPurchase(finalNumber, quantity, totalPrice);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2">
        {Array.from({ length: game.digit }).map((_, index) => (
          <Input
            key={index}
            id={`num-input-${index}`}
            type="text"
            maxLength={1}
            value={numbers[index]}
            onChange={(e) => handleNumberChange(index, e.target.value)}
            className="h-16 w-14 text-center text-3xl font-bold"
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input id="quantity" readOnly value={quantity} className="w-16 text-center" />
          <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-xl font-bold">
        Total: <span className="text-primary font-mono">₹{totalPrice.toFixed(2)}</span>
      </div>

      <Button onClick={handlePurchase} className="w-full" size="lg">
        Confirm Purchase
      </Button>
    </div>
  );
}
