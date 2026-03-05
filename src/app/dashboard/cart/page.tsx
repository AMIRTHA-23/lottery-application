'use client';

import React, { useState } from 'react';
import { useCart } from '@/components/dashboard/cart-context';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle, Trash2, Home, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, runTransaction, collection, query, limit } from 'firebase/firestore';
import type { Wallet } from '@/lib/types';

export default function CartPage() {
  const { cart, totalAmount, clearCart, removeFromCart } = useCart();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Wallet to verify balance
  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'), limit(1));
  }, [user, firestore]);
  const { data: wallets, isLoading: isWalletLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  const handleCheckout = async () => {
    if (!user || !firestore || cart.length === 0 || !wallet) return;

    if (wallet.balance < totalAmount) {
      toast({ 
        title: "Insufficient Balance", 
        description: `You need ₹${(totalAmount - wallet.balance).toFixed(2)} more.`, 
        variant: 'destructive' 
      });
      return;
    }

    setIsProcessing(true);
    try {
      await runTransaction(firestore, async (transaction) => {
        const walletRef = doc(firestore, 'users', user.uid, 'wallets', wallet.id);
        
        // 1. Update Wallet Balance
        transaction.update(walletRef, {
          balance: wallet.balance - totalAmount
        });

        // 2. Record Transaction
        const transactionRef = doc(collection(firestore, 'users', user.uid, 'wallets', wallet.id, 'transactions'));
        transaction.set(transactionRef, {
          id: transactionRef.id,
          userId: user.uid,
          walletId: wallet.id,
          transactionDate: new Date().toISOString(),
          amount: -totalAmount,
          type: 'Purchase',
          description: `Purchase of ${cart.length} tickets`
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
            amount: item.amount
          });
        });
      });

      toast({ title: "Purchase Confirmed!", description: "Good luck with your tickets." });
      clearCart();
      router.push('/dashboard/results');
    } catch (e: any) {
      toast({ title: "Checkout Failed", description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const today = new Date().toLocaleDateString();

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

        {/* The Diamond Table */}
        <div className="bg-white p-2 rounded-lg border-2 border-[#FF0055] shadow-xl">
          <table className="diamond-table">
            <thead>
              <tr className="bg-gray-50">
                <td colSpan={3} className="font-semibold text-[#FF0055]">Name: {user?.displayName || 'Player'}</td>
                <td colSpan={2} className="text-right font-semibold">Date: {today}</td>
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
              <tr className="font-bold text-lg bg-pink-50">
                <td colSpan={3} className="text-right text-[#FF0055] p-4">TOTAL PAYABLE AMOUNT:</td>
                <td colSpan={2} className="text-right text-[#FF0055] p-4 border-l-2 border-[#FF0055]">₹{totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
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
