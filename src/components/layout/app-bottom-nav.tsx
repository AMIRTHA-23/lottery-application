'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, Dice5, BarChart2, Settings, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/control', label: 'Control', icon: Dice5 },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { href: '/admin/announcements', label: 'Announce', icon: Megaphone },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around md:hidden z-40">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin');
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
