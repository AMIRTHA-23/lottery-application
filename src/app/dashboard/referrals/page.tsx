'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Users, Gift, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReferralsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  const referralLink = `https://smswin.com/signup?ref=${user?.uid?.substring(0, 8) || 'friend'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
  };

  const stats = [
    { title: "Total Referrals", value: "0", icon: Users },
    { title: "Earnings", value: "₹0.00", icon: Gift },
    { title: "Bonus Rate", value: "5%", icon: TrendingUp },
  ];

  if (isLoading) {
      return (
          <div className="container py-6 space-y-6">
              <Skeleton className="h-10 w-48" />
              <div className="grid gap-6 md:grid-cols-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
              </div>
          </div>
      );
  }

  return (
    <div className="container space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Refer & Earn</h1>
        <p className="text-muted-foreground">Invite your friends and earn bonuses on their ticket purchases.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link with your friends to start earning.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={referralLink} readOnly className="font-mono bg-muted" />
            <Button onClick={copyToClipboard} className="shrink-0">
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                <h3 className="font-semibold">Share the link</h3>
                <p className="text-sm text-muted-foreground">Send your unique link to friends via WhatsApp or social media.</p>
            </div>
            <div className="space-y-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                <h3 className="font-semibold">Friends join</h3>
                <p className="text-sm text-muted-foreground">When your friends sign up and verify their accounts.</p>
            </div>
            <div className="space-y-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                <h3 className="font-semibold">Earn Bonuses</h3>
                <p className="text-sm text-muted-foreground">Get 5% bonus added to your wallet for every ticket they purchase.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
