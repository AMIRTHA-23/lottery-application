import type { SalesChartData } from './types';

export const salesVsPayoutsData: SalesChartData[] = [
    { name: 'MON', sales: 4000, payouts: 2400 },
    { name: 'TUE', sales: 3000, payouts: 1398 },
    { name: 'WED', sales: 5000, payouts: 4800 },
    { name: 'THU', sales: 2780, payouts: 3908 },
    { name: 'FRI', sales: 1890, payouts: 4800 },
    { name: 'SAT', sales: 6390, payouts: 3800 },
    { name: 'SUN', sales: 4490, payouts: 4300 },
];

export const user = {
    name: "Admin",
    email: "admin@example.com",
    avatarUrl: "https://picsum.photos/seed/avatar-admin/40/40",
};
