'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gavel, ShoppingCart, Ticket, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/dashboard/cart-context';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/play', label: 'Play', icon: Gavel },
  { href: '/dashboard/rewards', label: 'Rewards', icon: Star },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/cart', label: 'Cart', icon: ShoppingCart },
];

export function UserAppBottomNav() {
  const pathname = usePathname();
  const { cart } = useCart();
  const cartCount = cart.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#FF0055] dark:bg-card border-t border-white/20 dark:border-border flex items-center justify-around md:hidden z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative"
          >
            <div className="relative">
              <item.icon 
                className={cn(
                  'w-7 h-7 transition-all', 
                  isActive 
                    ? 'text-white dark:text-[#FF0055] scale-110' 
                    : 'text-white/60 dark:text-muted-foreground hover:text-white dark:hover:text-foreground'
                )} 
              />
              {item.label === 'Cart' && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-[#FF0055] dark:bg-[#FF0055] dark:text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#FF0055] dark:border-card animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </div>
            {isActive && <span className="w-1 h-1 rounded-full bg-white dark:bg-[#FF0055] mt-1" />}
          </Link>
        );
      })}
    </nav>
  );
}
