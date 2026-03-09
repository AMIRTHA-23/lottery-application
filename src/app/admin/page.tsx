'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query } from 'firebase/firestore';
import type { Transaction, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from '@/components/admin/sales-chart';
import { CreditCard, Landmark, Users, TrendingUp, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  // Fetch all transactions using Collection Group Query
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'transactions'));
  }, [firestore]);
  const { data: allTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  // Fetch all users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);

  const stats = useMemo(() => {
    if (!allTransactions || !users) return { totalSales: 0, totalPayouts: 0, activeUsers: 0, netProfit: 0, pendingKyc: 0 };

    let sales = 0;
    let payouts = 0;
    allTransactions.forEach((tx) => {
      if (tx.type === 'Purchase') {
        sales += Math.abs(tx.amount);
      } else if (tx.type === 'Payout') {
        payouts += tx.amount;
      }
    });

    const pendingKyc = users.filter(u => u.kycStatus === 'Pending').length;

    return {
      totalSales: sales,
      totalPayouts: payouts,
      activeUsers: users.length,
      netProfit: sales - payouts,
      pendingKyc
    };
  }, [allTransactions, users]);

  const isLoading = isTransactionsLoading || isUsersLoading;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);

  const statCards = [
    {
      title: 'Total Sales',
      value: formatCurrency(stats.totalSales),
      icon: CreditCard,
      color: 'text-foreground'
    },
    {
      title: 'Total Payouts',
      value: formatCurrency(stats.totalPayouts),
      icon: Landmark,
      color: 'text-foreground'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toString(),
      icon: Users,
      color: 'text-foreground'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(stats.netProfit),
      icon: TrendingUp,
      color: 'text-green-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      {stats.pendingKyc > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-bold text-yellow-800 dark:text-yellow-200">KYC Verification Required</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">There are {stats.pendingKyc} user(s) awaiting verification review.</p>
              </div>
            </div>
            <Link href="/admin/users">
              <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100">
                View Queue
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sales vs Payouts</CardTitle>
          <div className="text-muted-foreground text-sm">
            Weekly performance analytics (Sample Data)
          </div>
        </CardHeader>
        <CardContent>
          <SalesChart />
        </CardContent>
      </Card>
    </div>
  );
}
