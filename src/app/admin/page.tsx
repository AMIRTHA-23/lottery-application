'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query } from 'firebase/firestore';
import type { Transaction, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from '@/components/admin/sales-chart';
import { CreditCard, Landmark, Users, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  // Reactive fetching for all transactions (Collection Group)
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'transactions'));
  }, [firestore]);
  const { data: allTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  // Reactive fetching for all users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);

  const stats = useMemo(() => {
    if (!allTransactions || !users) return { totalSales: 0, totalPayouts: 0, activeUsers: 0, netProfit: 0 };

    let sales = 0;
    let payouts = 0;
    allTransactions.forEach((tx) => {
      if (tx.type === 'Purchase') {
        sales += Math.abs(tx.amount);
      } else if (tx.type === 'Payout') {
        payouts += tx.amount;
      }
    });

    return {
      totalSales: sales,
      totalPayouts: payouts,
      activeUsers: users.length,
      netProfit: sales - payouts,
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
    },
    {
      title: 'Total Payouts',
      value: formatCurrency(stats.totalPayouts),
      icon: Landmark,
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toString(),
      icon: Users,
    },
    {
      title: 'Net Profit',
      value: formatCurrency(stats.netProfit),
      icon: TrendingUp,
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
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
      </div>

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