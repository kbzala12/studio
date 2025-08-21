
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus, LogOut, User, Coins, Bot } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const loginSchema = z.object({
  name: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  name: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type User = {
  id: string;
  name: string;
  coins: number;
  isAdmin: boolean;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { name: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', password: '', confirmPassword: '' },
  });
  
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const { user } = await res.json();
          setUser(user);
        } else {
          setUser(null);
          // Check for saved username in local storage
          const savedUsername = localStorage.getItem('lastUsername');
          if (savedUsername) {
            loginForm.setValue('name', savedUsername);
          }
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, [router, loginForm]);

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Login failed');
      }
      const { user } = await res.json();
      setUser(user);
      // Save username to local storage
      localStorage.setItem('lastUsername', user.name);
      router.refresh();
      router.push('/');
      toast({ title: 'Login Successful', description: `Welcome back, ${user.name}!` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.name, password: values.password }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Signup failed');
      }
      const { user } = await res.json();
      setUser(user);
      // Save username to local storage
      localStorage.setItem('lastUsername', user.name);
      router.refresh();
      router.push('/');
      toast({ title: 'Signup Successful', description: `Welcome, ${user.name}!` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      router.refresh();
      router.push('/');
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to log out.' });
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="container mx-auto max-w-2xl p-4 md:p-6">
        <Card>
          <CardHeader className="text-center">
            <User className="mx-auto h-16 w-16 mb-4 rounded-full bg-primary/10 p-4 text-primary" />
            <CardTitle className="text-3xl">{user.name}</CardTitle>
            {user.isAdmin && <Badge>Admin</Badge>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center text-2xl font-bold">
                <Coins className="w-8 h-8 mr-2 text-yellow-500" />
                <span>{user.coins} Coins</span>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <Link href="/upload" passHref>
                <Button className="w-full">Submit a Video</Button>
              </Link>
              {user.isAdmin && (
                <Link href="/admin" passHref>
                    <Button variant="secondary" className="w-full">Admin Panel</Button>
                </Link>
              )}
              <Button variant="destructive" onClick={handleLogout} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <LogOut className="mr-2" />}
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isLoginView ? 'Login' : 'Sign Up'}</CardTitle>
          <CardDescription>
            {isLoginView ? 'Enter your credentials to access your account.' : 'Create a new account to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoginView ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField control={loginForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input placeholder="yourname" {...field} autoComplete="username" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2" />}
                  Login
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <FormField control={signupForm.control} name="name" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input placeholder="choose a username" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={signupForm.control} name="password" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="create a password" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="confirm your password" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2" />}
                  Sign Up
                </Button>
              </form>
            </Form>
          )}
          <Separator className="my-4" />
          <div className="space-y-2">
            <a href="https://t.me/Bingyt_bot" target="_blank" rel="noopener noreferrer" className='w-full'>
                <Button variant="outline" className="w-full bg-blue-500 text-white hover:bg-blue-600">
                    <Bot className="mr-2" /> Login with Telegram
                </Button>
            </a>
             <Button variant="link" className="w-full" onClick={() => setIsLoginView(!isLoginView)}>
                {isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Login'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
