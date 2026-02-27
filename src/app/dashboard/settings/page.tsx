'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email(),
  phoneNumber: z.string().min(10, "Invalid phone number."),
  gender: z.string(),
  dob: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      gender: "prefer-not-to-say",
      dob: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.username || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        gender: profile.gender || "prefer-not-to-say",
        dob: profile.dob || "",
      });
    }
  }, [profile, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!auth.currentUser || !firestore || !user) return;
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: data.name,
      });

      // Update Firestore Profile
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await updateDoc(doc(firestore, 'users', user.uid), {
        username: data.name,
        firstName,
        lastName,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        dob: data.dob,
      });

      toast({
        title: "Profile updated",
        description: "Your information has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update profile.",
      });
    }
  }

  if (isProfileLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-20 w-full" /></CardHeader>
          <CardContent className="space-y-4"><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Manage your profile details and verification information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Email" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Mobile Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {profile && (
                 <div className="pt-4 border-t space-y-2">
                    <p className="text-sm font-medium">Account Metadata</p>
                    <div className="grid grid-cols-2 text-xs text-muted-foreground">
                        <div>Registration Source: {profile.referralSource || 'Direct'}</div>
                        <div>Verified Status: {profile.isAgeVerified ? 'Age Verified (18+)' : 'Pending'}</div>
                    </div>
                 </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
