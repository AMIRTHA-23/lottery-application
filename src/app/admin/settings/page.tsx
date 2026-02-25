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
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import type { AppSettings } from "@/lib/types";
import { doc } from "firebase/firestore";
import { useEffect } from "react";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email(),
});

const prizeFormSchema = z.object({
    prize1D: z.coerce.number().min(0, "Prize cannot be negative."),
    prize2D: z.coerce.number().min(0, "Prize cannot be negative."),
    prize3D: z.coerce.number().min(0, "Prize cannot be negative."),
    prize4D: z.coerce.number().min(0, "Prize cannot be negative."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PrizeFormValues = z.infer<typeof prizeFormSchema>;

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
      displayName: user?.displayName || "",
      email: user?.email || "",
    },
  });

  const prizeForm = useForm<PrizeFormValues>({
    resolver: zodResolver(prizeFormSchema),
  });

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'app') : null, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<AppSettings>(settingsRef);
  
  useEffect(() => {
    if (settings) {
      prizeForm.reset({
        prize1D: settings.prize1D,
        prize2D: settings.prize2D,
        prize3D: settings.prize3D,
        prize4D: settings.prize4D,
      });
    }
  }, [settings, prizeForm]);


  async function onProfileSubmit(data: ProfileFormValues) {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
      });
      toast({
        title: "Profile updated",
        description: "Your name has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not update your profile.",
      });
    }
  }

  function onPrizeSubmit(data: PrizeFormValues) {
    if (!firestore) return;
    const settingsDocRef = doc(firestore, 'settings', 'app');
    setDocumentNonBlocking(settingsDocRef, data, { merge: true });
    toast({
        title: "Settings Saved",
        description: "Prize configuration has been updated.",
    });
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <CardHeader>
                <CardTitle>Admin Profile</CardTitle>
                <CardDescription>
                  Update your administrator account details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
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
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
            <Form {...prizeForm}>
                <form onSubmit={prizeForm.handleSubmit(onPrizeSubmit)} className="space-y-6">
                    <CardHeader>
                        <CardTitle>Prize Configuration</CardTitle>
                        <CardDescription>
                            Set the winning prize amounts for each game type.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={prizeForm.control}
                            name="prize1D"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Single Digit (1D) Prize</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 100" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={prizeForm.control}
                            name="prize2D"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Double Digit (2D) Prize</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 1000" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={prizeForm.control}
                            name="prize3D"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Three Digit (3D) Prize</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 100000" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={prizeForm.control}
                            name="prize4D"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Four Digit (4D) Prize</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 500000" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={prizeForm.formState.isSubmitting || isLoadingSettings}>
                            {prizeForm.formState.isSubmitting ? 'Saving...' : 'Save Prize Settings'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
      </div>
    </div>
  );
}

    