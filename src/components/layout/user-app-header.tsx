'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutGrid, LogOut, User as UserIcon, BookOpen, LifeBuoy, Menu, Gamepad2 } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export function UserAppHeader() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const userInitial = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <Menu className="h-6 w-6 text-foreground" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
         <Link href="/dashboard" className="text-xl font-bold font-headline md:hidden">
          SMSWIN
        </Link>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard')}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => router.push('/dashboard/sample-game')}>
              <Gamepad2 className="mr-2 h-4 w-4" />
              <span>Fun Game</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => router.push('/dashboard/rules')}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Game Rules</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => router.push('/dashboard/support')}>
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
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
