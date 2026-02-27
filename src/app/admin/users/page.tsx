'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { UserCheck } from 'lucide-react';

export default function UsersPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;

    return users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Verified Users</CardTitle>
          <CardDescription>
            Browse all registered players. Verified accounts (18+) are highlighted.
          </CardDescription>
           <div className="pt-4">
            <Input 
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                       <Link href={`/admin/users/${user.id}`} className="flex flex-col hover:underline">
                        <span className="font-medium text-primary">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                        {user.isAgeVerified ? (
                            <div className="flex items-center gap-1 text-xs text-success font-medium">
                                <UserCheck className="h-3 w-3" />
                                18+ Verified
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.registrationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.status === 'Frozen' ? 'destructive' : 'success'}>
                        {user.status || 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                       {searchQuery ? 'No users match your search.' : 'No users found.'}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
