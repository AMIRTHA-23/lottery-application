'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gavel, ShoppingCart, Ticket, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/play', label: 'Play', icon: Gavel },
  { href: '/dashboard/rewards', label: 'Rewards', icon: Star },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/cart', label: 'Cart', icon: ShoppingCart },
];

export function UserAppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#FF0055] dark:bg-card border-t border-white/20 dark:border-border flex items-center justify-around md:hidden z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
          >
            <item.icon 
              className={cn(
                'w-7 h-7 transition-all', 
                isActive 
                  ? 'text-white dark:text-[#FF0055] scale-110' 
                  : 'text-white/60 dark:text-muted-foreground hover:text-white dark:hover:text-foreground'
              )} 
            />
            {isActive && <span className="w-1 h-1 rounded-full bg-white dark:bg-[#FF0055] mt-1" />}
          </Link>
        );
      })}
    </nav>
  );
}
