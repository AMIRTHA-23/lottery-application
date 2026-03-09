'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/components/dashboard/cart-context';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle, Trash2, Home, User, Loader2, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, runTransaction, collection, query, limit } from 'firebase/firestore';
import type { Wallet } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function CartPage() {
  const { cart, totalAmount, clearCart, removeFromCart } = useCart();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [payWithCoins, setPayWithCoins] = useState(false);
  const [today, setToday] = useState<string>('');

  useEffect(() => {
    setToday(new Date().toLocaleDateString());
  }, []);

  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'), limit(1));
  }, [user, firestore]);
  const { data: wallets, isLoading: isWalletLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  // Coin usage logic: ₹1 = 10 coins
  const totalCoinsNeeded = totalAmount * 10;
  const hasEnoughCoins = wallet ? wallet.specialCoins >= totalCoinsNeeded : false;
  const hasEnoughCash = wallet ? wallet.balance >= totalAmount : false;

  const handleCheckout = async () => {
    if (!user || !firestore || cart.length === 0 || !wallet) return;

    if (payWithCoins && !hasEnoughCoins) {
      toast({ title: "Insufficient Coins", description: "Buy more coins to use this payment method.", variant: 'destructive' });
      return;
    }

    if (!payWithCoins && !hasEnoughCash) {
      toast({ title: "Insufficient Balance", description: "Top up your wallet to continue.", variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      await runTransaction(firestore, async (transaction) => {
        const walletRef = doc(firestore, 'users', user.uid, 'wallets', wallet.id);
        
        // 1. Update Wallet
        if (payWithCoins) {
          transaction.update(walletRef, {
            specialCoins: wallet.specialCoins - totalCoinsNeeded
          });
        } else {
          transaction.update(walletRef, {
            balance: wallet.balance - totalAmount
          });
        }

        // 2. Record Transaction
        const transactionRef = doc(collection(firestore, 'users', user.uid, 'wallets', wallet.id, 'transactions'));
        transaction.set(transactionRef, {
          id: transactionRef.id,
          userId: user.uid,
          walletId: wallet.id,
          transactionDate: new Date().toISOString(),
          amount: payWithCoins ? -totalCoinsNeeded : -totalAmount,
          type: payWithCoins ? 'Redemption' : 'Purchase',
          description: `Purchase of ${cart.length} tickets using ${payWithCoins ? 'Special Coins' : 'Cash Balance'}`
        });

        // 3. Record Lottery Numbers
        cart.forEach(item => {
          const numberRef = doc(collection(firestore, 'users', user.uid, 'lotteryNumbers'));
          transaction.set(numberRef, {
            id: numberRef.id,
            userId: user.uid,
            lotteryEventId: item.eventId,
            eventName: item.eventName,
            number: item.number,
            purchaseDate: new Date().toISOString(),
            unitPrice: item.price,
            unitsPurchased: item.unit,
            board: item.board,
            agency: item.agency,
            amount: item.amount,
            paidWith: payWithCoins ? 'Coins' : 'Cash'
          });
        });
      });

      toast({ 
        title: "Purchase Confirmed!", 
        description: `Successfully paid with ${payWithCoins ? totalCoinsNeeded + ' Coins' : '₹' + totalAmount.toFixed(2)}.` 
      });
      clearCart();
      router.push('/dashboard/tickets');
    } catch (e: any) {
      toast({ title: "Checkout Failed", description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full bg-[#FF0055] p-4 flex justify-between items-center text-white shadow-md">
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6" />
          <h1 className="text-xl font-bold uppercase tracking-tight">Diamond Cart</h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <p className="text-[10px] opacity-80 uppercase">Coins Balance</p>
                <p className="text-sm font-bold">{wallet?.specialCoins || 0}</p>
            </div>
            <User className="h-8 w-8 bg-white text-[#FF0055] rounded-full p-1" />
        </div>
      </div>

      <div className="w-full max-w-2xl p-4 space-y-4 mb-24">
        {/* Payment Method Switch */}
        <div className="bg-white p-4 rounded-xl border-2 border-[#FF0055] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-pink-50 p-2 rounded-full">
              {payWithCoins ? <Coins className="h-6 w-6 text-[#FF0055]" /> : <Home className="h-6 w-6 text-[#FF0055]" />}
            </div>
            <div>
              <p className="text-sm font-bold uppercase">Payment Method</p>
              <p className="text-xs text-muted-foreground">
                {payWithCoins ? `Using Special Coins (${wallet?.specialCoins || 0} avail.)` : `Using Cash Balance (₹${wallet?.balance.toFixed(2) || '0.00'} avail.)`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="pay-method" className="text-[10px] font-bold uppercase text-muted-foreground">CASH</Label>
            <Switch 
              id="pay-method" 
              checked={payWithCoins} 
              onCheckedChange={setPayWithCoins}
            />
            <Label htmlFor="pay-method" className="text-[10px] font-bold uppercase text-[#FF0055]">COINS</Label>
          </div>
        </div>

        <div className="bg-white p-2 rounded-lg border-2 border-[#FF0055] shadow-xl">
          <table className="diamond-table">
            <thead>
              <tr className="bg-gray-50">
                <td colSpan={3} className="font-semibold text-[#FF0055]">Name: {user?.displayName || 'Player'}</td>
                <td colSpan={2} className="text-right font-semibold">Date: {today || 'Loading...'}</td>
              </tr>
              <tr className="font-bold text-center bg-pink-50 text-[#FF0055]">
                <td>Lot Details</td>
                <td>Number</td>
                <td>Unit</td>
                <td>{payWithCoins ? 'Coins' : '₹'}</td>
                <td>Total</td>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{item.eventName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{item.board} Board</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="text-center font-mono font-bold text-xl text-[#FF0055]">{item.number}</td>
                  <td className="text-center font-semibold">{item.unit}</td>
                  <td className="text-center">{payWithCoins ? item.price * 10 : '₹' + item.price}</td>
                  <td className="text-right font-bold">{payWithCoins ? (item.amount * 10) : '₹' + item.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-bold text-lg bg-pink-50">
                <td colSpan={3} className="text-right text-[#FF0055] p-4 uppercase">Grand Total:</td>
                <td colSpan={2} className="text-right text-[#FF0055] p-4 border-l-2 border-[#FF0055] text-2xl">
                    {payWithCoins ? `${totalCoinsNeeded} COINS` : `₹${totalAmount.toFixed(2)}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="bg-[#FF0055] hover:bg-[#D40045] h-16 rounded-xl text-xl font-bold shadow-lg"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing || isWalletLoading}
          >
            {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle className="mr-2" />}
            Confirm Pay
          </Button>
          <Button 
            variant="outline" 
            className="border-[#FF0055] text-[#FF0055] hover:bg-pink-50 h-16 rounded-xl text-xl font-bold"
            onClick={clearCart}
            disabled={cart.length === 0 || isProcessing}
          >
            <Trash2 className="mr-2" /> Clear All
          </Button>
        </div>
      </div>

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-[#FF0055] p-3 text-center text-white z-40 border-t border-white/20">
         <p className="text-sm font-bold tracking-widest uppercase">Special Coins: Pay with Points, Win Big Cash!</p>
      </div>
    </div>
  );
}
