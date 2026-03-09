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
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Clock, FileCheck, AlertCircle } from "lucide-react";

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
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

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
      await updateProfile(auth.currentUser, {
        displayName: data.name,
      });

      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
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

  const handleKycSubmission = () => {
    if (!firestore || !user) return;
    setIsSubmittingKyc(true);
    
    // Simulate document submission by changing status to 'Pending'
    // In a real app, this would involve uploading files
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      kycStatus: 'Pending'
    });

    setTimeout(() => {
      toast({
        title: "KYC Submitted",
        description: "Your profile has been sent for administrative review.",
      });
      setIsSubmittingKyc(false);
    }, 1000);
  };

  const getKycBadge = (status: UserProfile['kycStatus']) => {
    switch (status) {
      case 'Verified':
        return <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> Rejected</Badge>;
      case 'Pending':
        return <Badge variant="secondary" className="gap-1 bg-yellow-500 text-white"><Clock className="h-3 w-3" /> Awaiting Review</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> Not Submitted</Badge>;
    }
  };

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        {profile && getKycBadge(profile.kycStatus)}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
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
                </CardContent>
                <CardFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                </CardFooter>
            </form>
            </Form>
        </Card>

        <div className="space-y-6">
            <Card className={profile?.kycStatus === 'Verified' ? 'border-success' : 'border-primary/20'}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm uppercase font-bold tracking-wider">
                        <FileCheck className="h-4 w-4" /> Verification Center
                    </CardTitle>
                    <CardDescription>Identity and Age Verification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Age (18+)</span>
                        {profile?.isAgeVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="outline">Pending</Badge>}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Status</span>
                        {profile && getKycBadge(profile.kycStatus)}
                    </div>
                    
                    {profile?.kycStatus !== 'Verified' && profile?.kycStatus !== 'Pending' && (
                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-4">
                          Verification is required for large payouts and VIP levels. Click below to submit your profile for admin review.
                        </p>
                        <Button 
                          className="w-full bg-[#FF0055] hover:bg-[#D40045]" 
                          onClick={handleKycSubmission}
                          disabled={isSubmittingKyc}
                        >
                          {isSubmittingKyc ? 'Submitting...' : 'Submit for Verification'}
                        </Button>
                      </div>
                    )}

                    {profile?.kycStatus === 'Pending' && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 flex items-start gap-2">
                        <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <p className="text-[10px] text-yellow-700">
                          Your profile is currently under review by our team. This usually takes 24-48 hours.
                        </p>
                      </div>
                    )}

                    {profile?.kycStatus === 'Rejected' && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-600 mt-0.5" />
                        <p className="text-[10px] text-red-700">
                          Your verification was rejected. Please update your profile details and try again.
                        </p>
                      </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm uppercase font-bold tracking-wider">Referral Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm font-medium">How you joined:</p>
                    <p className="text-sm text-muted-foreground">{profile?.referralSource || 'Direct'}</p>
                    <Button variant="outline" className="w-full mt-4" asChild>
                        <a href="/dashboard/referrals">View My Referrals</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
