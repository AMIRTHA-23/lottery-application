import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/auth/login-form';
import { SignUpForm } from '@/components/auth/signup-form';
import Link from 'next/link';
import Image from 'next/image';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-bg');

  return (
    <main className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col items-center justify-center bg-gray-100 p-10 text-white dark:bg-gray-800 lg:flex">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt="Lottery background"
            fill
            className="object-cover"
            data-ai-hint={loginBg.imageHint}
          />
        )}
         <div className="relative z-20 flex items-center text-lg font-medium">
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/20">
              <span className="text-3xl font-black tracking-tighter uppercase">Diamond Agency</span>
            </div>
          </div>
      </div>
      <div className="flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-2 text-primary">
              <span className="text-2xl font-bold font-headline">SMSWIN</span>
            </Link>
            <p className="text-muted-foreground">Welcome! Please enter your details.</p>
          </div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card className="border-t-0 rounded-t-none">
                <CardContent className="pt-6">
                  <LoginForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card className="border-t-0 rounded-t-none">
                <CardContent className="pt-6">
                  <SignUpForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Demo Accounts</AlertTitle>
            <AlertDescription>
              <p className="mb-2">To test the application, first go to the <strong>Sign Up</strong> tab and create the following accounts:</p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li><strong>Admin Account:</strong>
                  <br />- Name: `ADMIN`
                  <br />- Email: `admin@example.com`
                  <br />- Password: `admin123`
                </li>
                <li><strong>User Account:</strong>
                  <br />- Name: `USER`
                  <br />- Email: `user@example.com`
                  <br />- Password: `user123`
                </li>
              </ul>
               <p className="mt-2">After signing up, you can log in with these credentials.</p>
            </AlertDescription>
          </Alert>

        </div>
      </div>
    </main>
  );
}
