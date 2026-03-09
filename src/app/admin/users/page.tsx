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
import { UserCheck, Clock, ShieldAlert, Filter } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UsersPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let result = users;

    // Filter by tab status
    if (filter === 'pending') {
      result = result.filter(u => u.kycStatus === 'Pending');
    } else if (filter === 'verified') {
      result = result.filter(u => u.kycStatus === 'Verified');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(user => 
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [users, searchQuery, filter]);

  const getKycBadge = (status: UserProfile['kycStatus']) => {
    switch (status) {
      case 'Verified':
        return (
          <div className="flex items-center gap-1 text-xs text-success font-medium">
            <UserCheck className="h-3 w-3" />
            Verified
          </div>
        );
      case 'Pending':
        return (
          <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
            <Clock className="h-3 w-3" />
            Needs Review
          </div>
        );
      case 'Rejected':
        return (
          <div className="flex items-center gap-1 text-xs text-destructive font-medium">
            <ShieldAlert className="h-3 w-3" />
            Rejected
          </div>
        );
      default:
        return <span className="text-xs text-muted-foreground">Not Started</span>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Player Directory</CardTitle>
          <CardDescription>
            Browse all registered players and manage verification status.
          </CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 items-center justify-between">
            <Input 
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
            />
            <Tabs defaultValue="all" onValueChange={setFilter} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800">
                  Needs Review
                </TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Account Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {!isLoading && filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.kycStatus === 'Pending' ? 'bg-yellow-50/30' : ''}>
                    <TableCell>
                       <Link href={`/admin/users/${user.id}`} className="flex flex-col hover:underline">
                        <span className="font-medium text-primary">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                        {getKycBadge(user.kycStatus)}
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
                       {searchQuery || filter !== 'all' ? 'No users match your criteria.' : 'No users found.'}
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
