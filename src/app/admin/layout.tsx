'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppBottomNav } from '@/components/layout/app-bottom-nav';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.email !== 'admin@example.com') {
      router.push('/dashboard');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user || user.email !== 'admin@example.com') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Authenticating Admin...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <AppBottomNav />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
