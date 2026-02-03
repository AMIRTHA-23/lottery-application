'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Ticket, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/tickets', label: 'My Tickets', icon: Ticket, isCentral: true },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around md:hidden z-40">
      {navItems.map((item, index) => {
        const isActive = pathname === item.href;
        if (item.isCentral) {
          return (
            <div key={item.href} className="flex-shrink-0 w-20 flex justify-center">
              <Link href={item.href} className="relative flex flex-col items-center -mt-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg border-4 border-background">
                  <item.icon className="w-8 h-8" />
                </div>
                <span className={cn(
                    "text-xs mt-1 block text-center font-medium",
                    isActive ? 'text-primary' : 'text-muted-foreground'
                )}>{item.label}</span>
              </Link>
            </div>
          );
        }
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-muted-foreground flex-1">
            <item.icon className={cn('w-6 h-6', isActive && 'text-primary')} />
            <span className={cn('text-xs font-medium', isActive && 'text-primary')}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
