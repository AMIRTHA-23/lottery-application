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
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            A list of all users in the system. Click on a username to view details.
          </CardDescription>
           <div className="pt-4">
            <Input 
                placeholder="Search by username or email..."
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
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registration Date</TableHead>
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
                    <TableCell className="font-medium">
                       <Link href={`/admin/users/${user.id}`} className="hover:underline text-primary">
                        {user.username}
                      </Link>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.registrationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success">Active</Badge>
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
