import { user, liveDraws } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Hello, {user.name}!</h1>
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Account Status: {user.status}</span>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-card/70 border-border overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Wallet Balance</p>
            <p className="text-3xl font-bold font-mono">₹{user.walletBalance.toFixed(2)}</p>
            <div className="flex items-center gap-1 text-sm text-yellow-400">
                <TrendingUp className="w-4 h-4" />
                <span>Last win: +₹{user.lastWin}</span>
            </div>
            <Button size="sm" className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              + Add Funds
            </Button>
          </div>
          <Image
            src="https://picsum.photos/seed/coins/150/100"
            width={150}
            height={100}
            alt="Coins"
            data-ai-hint="stacked coins"
            className="rounded-lg object-cover"
          />
        </CardContent>
      </Card>
      
      {/* Game Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Game Categories</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
            {['1D', '2D', '3D', '4D'].map((d, i) => (
                <div key={d}>
                    <div className="flex items-center justify-center p-4 bg-card rounded-lg border border-primary/50 aspect-square">
                        <span className="text-2xl font-bold text-primary">{d}</span>
                    </div>
                    <span className="text-xs mt-2 block text-muted-foreground">{['Single', 'Double', 'Three', 'Four'][i]}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Live Draw Centers */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Live Draw Centers</h2>
          <Link href="#" className="text-sm text-primary font-medium">View All</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liveDraws.map(draw => (
                <Card key={draw.id} className="bg-card border-border overflow-hidden">
                    <div className="relative">
                        {draw.isHot && <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">HOT</div>}
                        <Image src={draw.image} alt={draw.title} width={400} height={200} className="w-full h-32 object-cover" data-ai-hint={draw.imageHint}/>
                        {draw.countdown && 
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3"/> {draw.countdown}
                            </div>
                        }
                    </div>
                    <CardContent className="p-3">
                        <h3 className="font-semibold truncate">{draw.title}</h3>
                        <p className="text-xs text-muted-foreground">Draw Date: {draw.drawDate}</p>
                        <p className="text-lg font-bold text-yellow-400 mt-1">{draw.prize}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
