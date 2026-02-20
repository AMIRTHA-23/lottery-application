'use client';

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { salesVsPayoutsData } from '@/lib/data';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--chart-1))',
  },
  payouts: {
    label: 'Payouts',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function SalesChart() {
  return (
    <div className="h-[350px]">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <LineChart
          data={salesVsPayoutsData}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value / 1000}k`}
          />
          <ChartTooltip
            cursor={{
              stroke: 'hsl(var(--primary))',
              strokeWidth: 1,
              strokeDasharray: '3 3',
            }}
            content={<ChartTooltipContent />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="var(--color-sales)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="payouts"
            stroke="var(--color-payouts)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
