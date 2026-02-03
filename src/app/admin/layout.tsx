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
      return; // Wait for user state to be determined
    }

    if (!user) {
      // Not logged in, redirect to login page
      router.push('/login');
      return;
    }

    if (user.email !== 'admin@example.com') {
      // Logged in, but not an admin, redirect to user dashboard
      router.push('/dashboard');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user || user.email !== 'admin@example.com') {
    // Show a loading state or a blank page while redirecting
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="md:hidden">
        <AppBottomNav />
      </div>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 md:pb-6 pb-24">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
