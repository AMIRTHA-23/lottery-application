'use client';

import React from 'react';
import { useCart } from '@/components/dashboard/cart-context';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle, Trash2, Home, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, runTransaction, collection } from 'firebase/firestore';

export default function CartPage() {
  const { cart, totalAmount, clearCart, removeFromCart } = useCart();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleCheckout = async () => {
    if (!user || !firestore || cart.length === 0) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        // Simple balance check - fetching first wallet
        const walletRef = doc(collection(firestore, 'users', user.uid, 'wallets'), 'main'); // Simplification for demo
        // In real app, we query for wallet, here we assume it exists or use batch
        
        // For this demo, we'll just record the purchases
        cart.forEach(item => {
          const newRef = doc(collection(firestore, 'users', user.uid, 'lotteryNumbers'));
          transaction.set(newRef, {
            ...item,
            userId: user.uid,
            purchaseDate: new Date().toISOString(),
          });
        });
      });

      toast({ title: "Purchase Confirmed!", description: "Good luck with your tickets." });
      clearCart();
      router.push('/dashboard/results');
    } catch (e: any) {
      toast({ title: "Checkout Failed", description: e.message, variant: 'destructive' });
    }
  };

  const today = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Custom Header matching image */}
      <div className="w-full bg-[#FF0055] p-4 flex justify-between items-center text-white shadow-md">
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6" />
          <h1 className="text-xl font-bold uppercase tracking-tight">Diamond Cart</h1>
        </div>
        <User className="h-7 w-7 bg-white text-[#FF0055] rounded-full p-1" />
      </div>

      <div className="w-full max-w-2xl p-4 space-y-4">
        <Button className="w-full bg-[#FF0055] hover:bg-[#D40045] font-bold text-lg py-6 rounded-xl">
          <ShoppingCart className="mr-2" /> Your Cart
        </Button>

        {/* The Diamond Table */}
        <div className="bg-white p-2 rounded-lg border-2 border-[#FF0055]">
          <table className="diamond-table">
            <thead>
              <tr className="bg-gray-50">
                <td colSpan={3}>Name: {user?.displayName || 'Guest'}</td>
                <td colSpan={2} className="text-right">Date: {today}</td>
              </tr>
              <tr className="font-bold text-center">
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
                      <span className="text-xs">{item.eventName} ({item.board})</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="text-center font-mono font-bold text-lg">{item.number}</td>
                  <td className="text-center">{item.unit}</td>
                  <td className="text-center">{item.price}</td>
                  <td className="text-right">{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Your cart is empty.
                  </td>
                </tr>
              )}
              <tr className="font-bold">
                <td colSpan={3} className="text-right">Total Amount:</td>
                <td colSpan={2} className="text-right bg-gray-50">{totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-red-600 mt-2 italic">
            ** Some items are removed automatically if draw time expired.
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="bg-[#FF0055] hover:bg-[#D40045] h-12 rounded-xl text-lg font-bold"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            <CheckCircle className="mr-2" /> Confirm Pay
          </Button>
          <Button 
            variant="outline" 
            className="border-[#FF0055] text-[#FF0055] hover:bg-[#FF0055] hover:text-white h-12 rounded-xl text-lg font-bold"
            onClick={clearCart}
          >
            <Trash2 className="mr-2" /> Clear Cart
          </Button>
        </div>
      </div>

      {/* Custom Bottom Footer matching image */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-[#FF0055] p-2 text-center text-white z-50">
         <p className="text-sm font-bold tracking-widest mb-2">INDIA'S LARGEST PRIZES AGENCY</p>
      </div>
    </div>
  );
}
