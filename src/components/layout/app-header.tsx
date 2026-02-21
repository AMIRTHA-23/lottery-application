"use client";
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { ThemeToggleButton } from '../theme-toggle-button';

export function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            <Menu className="h-6 w-6 text-foreground" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">SMSWIN Dashboard</h1>
          <p className="text-xs text-muted-foreground">Admin Control Panel</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
         <ThemeToggleButton />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-foreground">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col">
                <span>New user signed up!</span>
                <span className="text-xs text-muted-foreground">5 minutes ago</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
            <Menu className="h-6 w-6 text-foreground" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
      </div>
    </header>
  );
}
