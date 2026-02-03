import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/auth/login-form';
import { SignUpForm } from '@/components/auth/signup-form';
import { Ticket } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col items-center justify-center bg-gray-100 p-10 text-white dark:bg-gray-800 lg:flex">
        <Image
          src="https://picsum.photos/seed/login-lotto/1080/1920"
          alt="Lottery app illustration"
          fill
          className="object-cover"
          data-ai-hint="lottery app illustration"
        />
         <div className="relative z-20 flex items-center text-lg font-medium">
            <Ticket className="mr-2 h-8 w-8" />
            <span className="text-2xl font-bold">Lotto</span>
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2 rounded-lg bg-black/50 p-4">
              <p className="text-lg">
                “Playing the lottery is all about the thrill of possibility. You never know when your lucky day might be.”
              </p>
              <footer className="text-sm">A Lottery Enthusiast</footer>
            </blockquote>
          </div>
      </div>
      <div className="flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-2 text-primary">
              <Ticket className="h-8 w-8" />
              <span className="text-2xl font-bold font-headline">Lotto</span>
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
        </div>
      </div>
    </main>
  );
}
