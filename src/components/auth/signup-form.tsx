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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, writeBatch, collection } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
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
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Update the user's profile with their name
      await updateProfile(user, {
        displayName: values.name,
      });

      // 3. Create a user document and a wallet in Firestore atomically
      const batch = writeBatch(firestore);

      const userDocRef = doc(firestore, 'users', user.uid);
      const [firstName, ...lastName] = values.name.split(' ');
      batch.set(userDocRef, {
        id: user.uid,
        username: values.name,
        firstName: firstName || '',
        lastName: lastName.join(' ') || '',
        email: user.email,
        phoneNumber: '',
        registrationDate: new Date().toISOString(),
      });

      // Create wallet for new user
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
        description: "You're all set! Welcome to SMSWIN.",
      });
      router.push('/dashboard');

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: 'This email is already registered. Please log in or use a different email.',
        });
      } else {
        console.error("Sign up error:", error);
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: error.message || 'Could not create your account. Please try again.',
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
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
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
