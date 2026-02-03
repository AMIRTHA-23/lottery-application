'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useUser();

  if (!user) {
    return null; // Or a loading indicator
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user.displayName || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          This is your personal dashboard. More features coming soon!
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.uid}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
