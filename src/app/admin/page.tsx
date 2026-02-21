'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, collectionGroup, getDocs, query } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from '@/components/admin/sales-chart';
import { CreditCard, Landmark, Users, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPayouts: 0,
    activeUsers: 0,
    netProfit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch transactions
        const transactionsQuery = query(collectionGroup(firestore, 'transactions'));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        let sales = 0;
        let payouts = 0;
        transactionsSnapshot.forEach((doc) => {
          const tx = doc.data() as Transaction;
          if (tx.type === 'Purchase') {
            sales += Math.abs(tx.amount);
          } else if (tx.type === 'Payout') {
            payouts += tx.amount;
          }
        });

        // Fetch users
        const usersQuery = query(collection(firestore, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersCount = usersSnapshot.size;

        setStats({
          totalSales: sales,
          totalPayouts: payouts,
          activeUsers: usersCount,
          netProfit: sales - payouts,
        });
      } catch (error) {
        console.error('Failed to fetch admin dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore]);

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
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-20 mt-2" />
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

      {/* Sales vs Payouts Chart */}
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
