import type { AdminStat, SalesChartData, GamePopularity } from './types';
import { CreditCard, Landmark, Users, TrendingUp } from 'lucide-react';

export const adminStats: AdminStat[] = [
  {
    title: 'Total Sales',
    value: '₹1,24,500',
    change: '+12.5%',
    changeType: 'increase',
    icon: CreditCard,
  },
  {
    title: 'Payouts',
    value: '₹82,300',
    change: '+8.2%',
    changeType: 'increase',
    icon: Landmark,
  },
  {
    title: 'Active Users',
    value: '15,240',
    change: '+5.1%',
    changeType: 'increase',
    icon: Users,
  },
  {
    title: 'Net Profit',
    value: '₹42,200',
    change: '+15.4%',
    changeType: 'increase',
    icon: TrendingUp,
  },
];

export const salesVsPayoutsData: SalesChartData[] = [
    { name: 'MON', sales: 4000, payouts: 2400 },
    { name: 'TUE', sales: 3000, payouts: 1398 },
    { name: 'WED', sales: 5000, payouts: 4800 },
    { name: 'THU', sales: 2780, payouts: 3908 },
    { name: 'FRI', sales: 1890, payouts: 4800 },
    { name: 'SAT', sales: 6390, payouts: 3800 },
    { name: 'SUN', sales: 4490, payouts: 4300 },
];

export const gamePopularityData: GamePopularity[] = [
    { id: '1d', name: '1D', type: '1D Lottery', units: '4,230 Units', progress: 45, color: 'blue-500' },
    { id: '2d', name: '2D', type: '2D Lottery', units: '8,150 Units', progress: 85, color: 'orange-500' },
    { id: '3d', name: '3D', type: '3D Lottery', units: '5,920 Units', progress: 60, color: 'green-500' },
    { id: '4d', name: '4D', type: '4D Lottery', units: '2,840 Units', progress: 30, color: 'purple-500' },
];

export const user = {
    name: "Admin",
    email: "admin@example.com",
    avatarUrl: "https://picsum.photos/seed/avatar-admin/40/40",
};
