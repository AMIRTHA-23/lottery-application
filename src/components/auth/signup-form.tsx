'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, writeBatch, collection } from 'firebase/firestore';
import { ShieldCheck } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phoneNumber: z.string().min(10, { message: 'Enter a valid phone number.' }),
  dob: z.string().min(1, { message: 'Date of birth is required.' }),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say'], { required_error: 'Please select a gender.' }),
  referralSource: z.string().optional(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  isAgeVerified: z.boolean().refine(val => val === true, { message: 'You must be 18 or older to play.' }),
  captcha: z.boolean().refine(val => val === true, { message: 'Please confirm you are not a bot.' }),
});

export function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      dob: '',
      gender: 'prefer-not-to-say',
      referralSource: '',
      password: '',
      isAgeVerified: false,
      captcha: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: values.name,
      });

      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const nameParts = values.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      batch.set(userDocRef, {
        id: user.uid,
        username: values.name,
        firstName,
        lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        dob: values.dob,
        gender: values.gender,
        referralSource: values.referralSource || '',
        isAgeVerified: values.isAgeVerified,
        kycStatus: 'Pending',
        registrationDate: new Date().toISOString(),
        status: 'Active',
      });

      const walletRef = doc(collection(firestore, 'users', user.uid, 'wallets'));
      batch.set(walletRef, {
        id: walletRef.id,
        userId: user.uid,
        balance: 0,
        currency: 'INR'
      });

      await batch.commit();

      toast({
        title: 'Account Created',
        description: "Welcome to SMSWIN! Your account has been successfully verified.",
      });
      router.push('/dashboard');

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: 'This email is already registered.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: error.message || 'Could not create account.',
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder="+91..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <FormField
          control={form.control}
          name="referralSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How did you hear about us?</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Friend, Advertisement, Social Media" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Create Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 pt-2">
          <FormField
            control={form.control}
            name="isAgeVerified"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Age Verification
                  </FormLabel>
                  <FormDescription>
                    I confirm that I am 18 years of age or older.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="captcha"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Bot Prevention
                  </FormLabel>
                  <FormDescription>
                    I am not a robot.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full mt-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Processing..." : "Create Verified Account"}
        </Button>
      </form>
    </Form>
  );
}
