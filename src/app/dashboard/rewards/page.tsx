'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import type { Wallet } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Coins, Star, Trophy, ArrowUpRight, ShoppingBag, Zap, Info } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function RewardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'), limit(1));
  }, [user, firestore]);
  const { data: wallets, isLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  const currentLevel = wallet?.level || 1;
  const lifetimeCoins = wallet?.totalCoinsEarned || 0;
  const progressToNext = (lifetimeCoins % 1000) / 10;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#FF0055]">Special Coins Rewards</h1>
        <p className="text-muted-foreground">India's most rewarding lottery loyalty program.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Balance & Level Summary */}
        <Card className="md:col-span-2 overflow-hidden border-[#FF0055] shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
            <div className="p-8 bg-gradient-to-br from-[#FF0055] to-[#D40045] text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="h-6 w-6 text-yellow-300" />
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-90">Your Special Coins</h3>
                </div>
                {isLoading ? (
                  <Skeleton className="h-12 w-24 bg-white/20" />
                ) : (
                  <>
                    <p className="text-5xl font-black mb-1">{wallet?.specialCoins || 0}</p>
                    <p className="text-sm font-medium opacity-80">Redeemable for ₹{((wallet?.specialCoins || 0) / 100).toFixed(2)}</p>
                  </>
                )}
              </div>
              <Button asChild variant="secondary" className="mt-8 font-bold w-full bg-white text-[#FF0055] hover:bg-pink-50">
                <Link href="/dashboard/play">Earn More Now</Link>
              </Button>
            </div>
            
            <div className="p-8 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-6 w-6 text-[#FF0055] fill-[#FF0055]" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">VIP Player Level</h3>
                  </div>
                  <div className="bg-[#FF0055] text-white px-3 py-1 rounded-full text-xs font-black">LVL {currentLevel}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                    <span>Progress to Level {currentLevel + 1}</span>
                    <span>{Math.floor(progressToNext)}%</span>
                  </div>
                  <Progress value={progressToNext} className="h-3 bg-pink-100" indicatorClassName="bg-[#FF0055]" />
                  <p className="text-[10px] text-muted-foreground italic">
                    Earn 1000 total coins to reach the next level. Each level unlocks bigger prize pools.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <p className="text-xs font-bold text-gray-700">Lifetime Coins Earned: <span className="text-[#FF0055]">{lifetimeCoins}</span></p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Help Card */}
        <Card className="bg-pink-50 border-pink-200">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-[#FF0055]">Quick Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase">Earning Rate</p>
                <p className="text-[10px] text-muted-foreground">Get 1 Coin for every ₹10 spent on any lottery lot.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShoppingBag className="h-5 w-5 text-[#FF0055] mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase">Redemption Rate</p>
                <p className="text-[10px] text-muted-foreground">Use 100 Coins to get ₹1 instant discount at checkout.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-[#FF0055]" />
              How to Earn Special Coins
            </CardTitle>
            <CardDescription>Simple steps to maximize your rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-100 text-[#FF0055] rounded-full flex items-center justify-center font-black">1</div>
                <div>
                  <p className="font-bold text-sm">Purchase Tickets</p>
                  <p className="text-xs text-muted-foreground">Every ticket you buy automatically tracks your spending. For example, a ₹100 purchase grants 10 Special Coins instantly.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-100 text-[#FF0055] rounded-full flex items-center justify-center font-black">2</div>
                <div>
                  <p className="font-bold text-sm">Refer Friends</p>
                  <p className="text-xs text-muted-foreground">Share your referral link. When your friends play, you earn bonus coins based on their participation.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-100 text-[#FF0055] rounded-full flex items-center justify-center font-black">3</div>
                <div>
                  <p className="font-bold text-sm">Level Up</p>
                  <p className="text-xs text-muted-foreground">As you earn more coins over time, your Player Level increases. Higher levels get bonus coin multipliers on special events.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-[#FF0055]" />
              How to Redeem Coins
            </CardTitle>
            <CardDescription>Turn your loyalty into winning opportunities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
               <p className="text-xs leading-relaxed">
                 During the <strong>Checkout</strong> process in your <strong>Diamond Cart</strong>, look for the <strong>"Use Special Coins"</strong> switch. 
                 <br/><br/>
                 If you have at least 100 coins, you can toggle this to apply your balance as a discount. The system will automatically calculate the maximum possible discount based on your current coins and the total cart value.
               </p>
               <div className="mt-4 flex justify-center">
                  <Button asChild size="sm" variant="outline" className="border-[#FF0055] text-[#FF0055]">
                    <Link href="/dashboard/cart">Go to Cart</Link>
                  </Button>
               </div>
             </div>
             <p className="text-[10px] text-center text-muted-foreground italic">
               Note: Special Coins cannot be withdrawn as cash. They can only be used to purchase lottery tickets within the Diamond Agency platform.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
