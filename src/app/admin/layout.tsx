import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppBottomNav } from '@/components/layout/app-bottom-nav';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
