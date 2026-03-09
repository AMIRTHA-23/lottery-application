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
  const [useSpecialCoins, setUseSpecialCoins] = useState(false);
  const [today, setToday] = useState<string>('');

  // Handle hydration mismatch for dates
  useEffect(() => {
    setToday(new Date().toLocaleDateString());
  }, []);

  // Fetch Wallet to verify balance and coins
  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'), limit(1));
  }, [user, firestore]);
  const { data: wallets, isLoading: isWalletLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  // Redemption logic: 100 coins = ₹1
  const redemptionValue = wallet ? Math.floor(wallet.specialCoins / 100) : 0;
  const appliedDiscount = useSpecialCoins ? Math.min(redemptionValue, totalAmount) : 0;
  const finalPayable = totalAmount - appliedDiscount;
  const coinsToRedeem = appliedDiscount * 100;

  // Earning logic: 1 coin per ₹10 spent
  const coinsEarned = Math.floor(totalAmount / 10);

  const handleCheckout = async () => {
    if (!user || !firestore || cart.length === 0 || !wallet) return;

    if (wallet.balance < finalPayable) {
      toast({ 
        title: "Insufficient Balance", 
        description: `You need ₹${(finalPayable - wallet.balance).toFixed(2)} more.`, 
        variant: 'destructive' 
      });
      return;
    }

    setIsProcessing(true);
    try {
      await runTransaction(firestore, async (transaction) => {
        const walletRef = doc(firestore, 'users', user.uid, 'wallets', wallet.id);
        
        const newSpecialCoins = (wallet.specialCoins || 0) - coinsToRedeem + coinsEarned;
        const newTotalEarned = (wallet.totalCoinsEarned || 0) + coinsEarned;
        const newLevel = Math.floor(newTotalEarned / 1000) + 1;

        // 1. Update Wallet (Balance, Coins, Level)
        transaction.update(walletRef, {
          balance: wallet.balance - finalPayable,
          specialCoins: newSpecialCoins,
          totalCoinsEarned: newTotalEarned,
          level: newLevel
        });

        // 2. Record Main Transaction
        const transactionRef = doc(collection(firestore, 'users', user.uid, 'wallets', wallet.id, 'transactions'));
        transaction.set(transactionRef, {
          id: transactionRef.id,
          userId: user.uid,
          walletId: wallet.id,
          transactionDate: new Date().toISOString(),
          amount: -finalPayable,
          type: 'Purchase',
          description: `Purchase of ${cart.length} tickets${appliedDiscount > 0 ? ` (₹${appliedDiscount} discount from coins)` : ''}`
        });

        // 3. Record Coin Reward Transaction
        if (coinsEarned > 0) {
          const rewardTxRef = doc(collection(firestore, 'users', user.uid, 'wallets', wallet.id, 'transactions'));
          transaction.set(rewardTxRef, {
            id: rewardTxRef.id,
            userId: user.uid,
            walletId: wallet.id,
            transactionDate: new Date().toISOString(),
            amount: coinsEarned,
            type: 'Reward',
            description: `Earned ${coinsEarned} Special Coins from purchase`
          });
        }

        // 4. Record Lottery Numbers
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
            amount: item.amount
          });
        });
      });

      toast({ 
        title: "Purchase Confirmed!", 
        description: `Paid ₹${finalPayable.toFixed(2)} and earned ${coinsEarned} coins.` 
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
      {/* Custom Header matching Diamond Agency branding */}
      <div className="w-full bg-[#FF0055] p-4 flex justify-between items-center text-white shadow-md">
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6" />
          <h1 className="text-xl font-bold uppercase tracking-tight">Diamond Cart</h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <p className="text-[10px] opacity-80 uppercase">Balance</p>
                <p className="text-sm font-bold">₹{wallet?.balance.toFixed(2) || '0.00'}</p>
            </div>
            <User className="h-8 w-8 bg-white text-[#FF0055] rounded-full p-1" />
        </div>
      </div>

      <div className="w-full max-w-2xl p-4 space-y-4 mb-24">
        <Button className="w-full bg-[#FF0055] hover:bg-[#D40045] font-bold text-lg py-6 rounded-xl pointer-events-none">
          <ShoppingCart className="mr-2" /> Your Shopping Cart
        </Button>

        {/* Reward Redemption UI */}
        {wallet && wallet.specialCoins >= 100 && (
          <div className="bg-white p-4 rounded-xl border border-dashed border-[#FF0055] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Coins className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-bold">Use Special Coins</p>
                <p className="text-xs text-muted-foreground">You have {wallet.specialCoins} coins (₹{redemptionValue} available)</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="use-coins" 
                checked={useSpecialCoins} 
                onCheckedChange={setUseSpecialCoins}
              />
              <Label htmlFor="use-coins" className="text-xs font-bold text-[#FF0055]">APPLY</Label>
            </div>
          </div>
        )}

        {/* The Diamond Table */}
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
                <td>₹</td>
                <td>Amount ₹</td>
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500 hover:bg-red-50"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="text-center font-mono font-bold text-xl text-[#FF0055]">{item.number}</td>
                  <td className="text-center font-semibold">{item.unit}</td>
                  <td className="text-center">₹{item.price}</td>
                  <td className="text-right font-bold">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="font-semibold uppercase tracking-widest">Cart is Empty</p>
                  </td>
                </tr>
              )}
              {appliedDiscount > 0 && (
                 <tr className="text-sm italic text-green-600 bg-green-50">
                   <td colSpan={3} className="text-right">Special Coins Redemption ({coinsToRedeem} coins):</td>
                   <td colSpan={2} className="text-right font-bold">-₹{appliedDiscount.toFixed(2)}</td>
                 </tr>
              )}
              <tr className="font-bold text-lg bg-pink-50">
                <td colSpan={3} className="text-right text-[#FF0055] p-4">TOTAL PAYABLE AMOUNT:</td>
                <td colSpan={2} className="text-right text-[#FF0055] p-4 border-l-2 border-[#FF0055]">₹{finalPayable.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="p-3 bg-yellow-50 mt-2 rounded border border-yellow-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-600" />
              <p className="text-[10px] text-yellow-800 font-bold uppercase">Estimated Rewards for this purchase:</p>
            </div>
            <p className="text-xs font-bold text-yellow-700">{coinsEarned} Coins</p>
          </div>

          <div className="p-3 bg-red-50 mt-2 rounded border border-red-100">
            <p className="text-[10px] text-red-600 italic">
              ** IMPORTANT: Lottery tickets are subject to availability. jackpot lots must be purchased at least 15 minutes before draw time.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="bg-[#FF0055] hover:bg-[#D40045] h-16 rounded-xl text-xl font-bold shadow-lg"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing || isWalletLoading}
          >
            {isProcessing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CheckCircle className="mr-2 h-6 w-6" />}
            Confirm Pay
          </Button>
          <Button 
            variant="outline" 
            className="border-[#FF0055] text-[#FF0055] hover:bg-pink-50 h-16 rounded-xl text-xl font-bold"
            onClick={clearCart}
            disabled={cart.length === 0 || isProcessing}
          >
            <Trash2 className="mr-2 h-6 w-6" /> Clear All
          </Button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-[#FF0055] p-3 text-center text-white z-40 border-t border-white/20">
         <p className="text-sm font-bold tracking-widest">INDIA'S LARGEST PRIZES AGENCY - DIAMOND LOTTERY</p>
      </div>
    </div>
  );
}
