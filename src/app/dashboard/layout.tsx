'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UserAppHeader } from '@/components/layout/user-app-header';
import { Skeleton } from '@/skeleton';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserAppSidebar } from '@/components/layout/user-app-sidebar';
import { UserAppBottomNav } from '@/components/layout/user-app-bottom-nav';
import { CartProvider } from '@/components/dashboard/cart-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const content = (isUserLoading || !user) ? (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 w-full max-sm p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
      </div>
    </div>
  ) : (
    <SidebarProvider>
      <UserAppSidebar />
      <UserAppBottomNav />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <UserAppHeader />
          <main className="flex-1 bg-muted/20 pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );

  return (
    <CartProvider>
      {content}
    </CartProvider>
  );
}
