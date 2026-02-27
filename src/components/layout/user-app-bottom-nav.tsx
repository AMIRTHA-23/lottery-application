'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Ticket, Trophy, Wallet, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid },
  { href: '/dashboard/play', label: 'Play', icon: Ticket },
  { href: '/dashboard/results', label: 'Results', icon: Trophy },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/settings', label: 'Profile', icon: Settings },
];

export function UserAppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around md:hidden z-40 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground flex-1 h-full transition-colors hover:text-primary"
          >
            <item.icon className={cn('w-5 h-5 transition-transform', isActive && 'text-primary scale-110')} />
            <span className={cn('text-[10px] font-medium transition-colors', isActive && 'text-primary')}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
