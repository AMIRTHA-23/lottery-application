'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import type { Wallet } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Coins, Star, Trophy, ArrowUpRight, ShoppingBag, Zap, Info, CheckCircle2, Rocket, Crown, Flame, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AddFundsDialog } from '@/components/dashboard/add-funds-dialog';

export default function RewardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isBuyCoinsOpen, setBuyCoinsOpen] = useState(false);

  const walletQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'wallets'), limit(1));
  }, [user, firestore]);
  const { data: wallets, isLoading } = useCollection<Wallet>(walletQuery);
  const wallet = wallets?.[0];

  const currentLevel = wallet?.level || 1;
  const lifetimeCoins = wallet?.totalCoinsEarned || 0;
  const progressToNext = (lifetimeCoins % 1000) / 10;

  const roadmapSteps = [
    {
      title: "Coin Buyer",
      description: "Purchase your first pack of Special Coins to unlock pre-paid play modes.",
      icon: CreditCard,
      requirement: "Level 1",
      active: currentLevel >= 1,
    },
    {
      title: "Rising Star",
      description: "Spend 1,000 lifetime coins. Unlocks priority draw notifications and badges.",
      icon: Star,
      requirement: "Level 2",
      active: currentLevel >= 2,
    },
    {
      title: "High Roller",
      description: "Accumulate 5,000 total coins. Get 1.2x coin bonuses on large pack purchases.",
      icon: Flame,
      requirement: "Level 5",
      active: currentLevel >= 5,
    },
    {
      title: "Diamond VIP",
      description: "The ultimate tier. Reach Level 10 for exclusive access to high-limit Jackpot lots.",
      icon: Crown,
      requirement: "Level 10",
      active: currentLevel >= 10,
    }
  ];

  return (
    <>
    <AddFundsDialog isOpen={isBuyCoinsOpen} onOpenChange={setBuyCoinsOpen} />
    <div className="container py-6 space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#FF0055]">Special Coins Currency</h1>
        <p className="text-muted-foreground">Buy coins with money and use them to play any game instantly.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 overflow-hidden border-[#FF0055] shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
            <div className="p-8 bg-gradient-to-br from-[#FF0055] to-[#D40045] text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="h-6 w-6 text-yellow-300" />
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-90">Your Coins Balance</h3>
                </div>
                {isLoading ? (
                  <Skeleton className="h-12 w-24 bg-white/20" />
                ) : (
                  <>
                    <p className="text-5xl font-black mb-1">{wallet?.specialCoins || 0}</p>
                    <p className="text-xs font-medium opacity-80 uppercase tracking-tighter">Ready for {Math.floor((wallet?.specialCoins || 0) / 110)} basic entries</p>
                  </>
                )}
              </div>
              <Button onClick={() => setBuyCoinsOpen(true)} variant="secondary" className="mt-8 font-bold w-full bg-white text-[#FF0055] hover:bg-pink-50">
                Buy More Coins
              </Button>
            </div>
            
            <div className="p-8 flex flex-col justify-between bg-white dark:bg-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-6 w-6 text-[#FF0055] fill-[#FF0055]" />
                    <h3 className="text-sm font-black uppercase tracking-widest">VIP Level</h3>
                  </div>
                  <div className="bg-[#FF0055] text-white px-3 py-1 rounded-full text-xs font-black">LVL {currentLevel}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                    <span>Progress to Level {currentLevel + 1}</span>
                    <span>{Math.floor(progressToNext)}%</span>
                  </div>
                  <Progress value={progressToNext} className="h-3 bg-pink-100" indicatorClassName="bg-[#FF0055]" />
                  <p className="text-[10px] text-muted-foreground italic">
                    Acquire 1000 total coins to reach the next level. Higher levels get better exchange rates.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <p className="text-xs font-bold">Lifetime Coins: <span className="text-[#FF0055] font-black">{lifetimeCoins}</span></p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-pink-50 dark:bg-pink-950/10 border-pink-200">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-[#FF0055]">How it Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-[#FF0055] mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase">Purchase</p>
                <p className="text-[10px] text-muted-foreground">Buy coins with money. ₹100 gives you 1,000 Coins instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase">Play Fast</p>
                <p className="text-[10px] text-muted-foreground">Use coins at checkout for zero-hassle ticket purchases.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-[#FF0055]" />
          <h2 className="text-xl font-bold uppercase tracking-tight">Your Rewards Roadmap</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmapSteps.map((step, idx) => (
            <Card 
              key={idx} 
              className={cn(
                "relative border-2 transition-all duration-300", 
                step.active ? "border-[#FF0055] shadow-md bg-[#FF0055]/5" : "border-muted opacity-60 grayscale"
              )}
            >
              <CardHeader className="pb-2">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center mb-2",
                  step.active ? "bg-[#FF0055] text-white" : "bg-muted text-muted-foreground"
                )}>
                  <step.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-tight">{step.title}</CardTitle>
                <CardDescription className="text-[10px] font-black text-[#FF0055]">{step.requirement}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
    </>
  );
}
