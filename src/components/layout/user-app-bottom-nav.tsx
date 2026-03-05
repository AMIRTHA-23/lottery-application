'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gavel, ScrollText, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/play', label: 'Play', icon: Gavel },
  { href: '/dashboard/results', label: 'Results', icon: ScrollText },
  { href: '/dashboard/cart', label: 'Cart', icon: ShoppingCart },
];

export function UserAppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#FF0055] border-t border-white/20 flex items-center justify-around md:hidden z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center justify-center gap-1 text-white/70 flex-1 h-full transition-colors hover:text-white"
          >
            <item.icon className={cn('w-7 h-7 transition-transform', isActive && 'text-white scale-110')} />
          </Link>
        );
      })}
    </nav>
  );
}
