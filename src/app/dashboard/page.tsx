import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { adminStats, gamePopularityData } from '@/lib/data';
import { SalesChart } from '@/components/admin/sales-chart';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.changeType === 'increase'
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales vs Payouts Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales vs Payouts</CardTitle>
          <div className="text-muted-foreground text-sm">
            Weekly performance analytics
          </div>
          <div className="flex items-baseline gap-4 pt-4">
            <div className="text-3xl font-bold">$206,800</div>
            <div className="text-sm text-green-500">+10.5% Last 7 Days</div>
          </div>
        </CardHeader>
        <CardContent>
          <SalesChart />
        </CardContent>
      </Card>

      {/* Game Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Game Popularity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Units purchased by game type
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {gamePopularityData.map((game) => (
            <div key={game.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-md ${game.color.replace('bg-', 'bg-opacity-20 ')}`}>
                    <span className={`text-lg font-bold ${game.color.replace('bg-','text-')}`}>{game.name}</span>
                  </div>
                  <span className="font-medium">{game.type}</span>
                </div>
                <span className="font-semibold">{game.units}</span>
              </div>
              <Progress value={game.progress} indicatorClassName={game.color} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
