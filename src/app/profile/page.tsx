
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Coins, LogOut, ArrowLeft, Edit, Shield, Bot } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import type { DatabaseUser } from '@/lib/auth';

const signupSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const loginSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }),
    password: z.string().min(1, { message: "Password is required." }),
});

async function handleLoginRequest(values: z.infer<typeof loginSchema>) {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message);
    }
    return result;
}

async function handleSignupRequest(values: z.infer<typeof signupSchema>) {
     const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message);
    }
    return result;
}

async function handleLogoutRequest() {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message);
    }
}

async function getCurrentUser() {
    try {
        const response = await fetch('/api/user', { cache: 'no-store' });
        if(response.status === 204) return null;
        if(response.ok) {
            return await response.json();
        }
        return null;
    } catch (e) {
        return null;
    }
}


export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [currentUser, setCurrentUser] = useState<DatabaseUser | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function checkUserStatus() {
        const user = await getCurrentUser();
        setCurrentUser(user);
        setIsCheckingStatus(false);
    }
    checkUserStatus();
  }, []);

  const currentFormSchema = isLoginView ? loginSchema : signupSchema;

  const form = useForm<z.infer<typeof currentFormSchema>>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      name: '',
      password: '',
      ...(isLoginView ? {} : { confirmPassword: '' }),
    },
  });

   useEffect(() => {
    form.reset();
  }, [isLoginView, form]);


  const handleLogout = async () => {
    setIsLoading(true);
    try {
        await handleLogoutRequest();
        setCurrentUser(null);
        toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
        });
        router.refresh();
    } catch (error: any) {
         toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof currentFormSchema>) {
    setIsLoading(true);
    try {
        let result;
        if (isLoginView) {
            result = await handleLoginRequest(values as z.infer<typeof loginSchema>);
            toast({ title: "Login Successful!" });
        } else {
            result = await handleSignupRequest(values as z.infer<typeof signupSchema>);
            toast({ title: "Account Created!", description: "You are now logged in." });
        }
        setCurrentUser(result.user);
        form.reset();
        router.refresh();

    } catch (error: any) {
        toast({ variant: "destructive", title: isLoginView ? "Login Failed" : "Signup Failed", description: error.message });
    } finally {
        setIsLoading(false);
    }
  }

  if (isCheckingStatus) {
     return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
     )
  }


  if (currentUser) {
    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
             <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b md:px-6 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" passHref>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">Profile</h1>
                </div>
            </header>
            <main className="flex-grow flex flex-col items-center justify-between p-4 gap-4 overflow-y-auto">
                <div className="w-full max-w-md">
                    <Card className="w-full shadow-2xl">
                        <CardHeader className="items-center text-center">
                            <User className="w-20 h-20 text-primary p-3 bg-primary/10 rounded-full" />
                            <CardTitle className="text-3xl font-bold mt-4">{currentUser.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <div className="text-4xl font-bold flex items-center justify-center gap-3">
                                <Coins className="w-10 h-10 text-yellow-500" />
                                <span>{currentUser.coins}</span>
                            </div>
                            <p className="text-muted-foreground -mt-2">Your Coin Balance</p>
                        </CardContent>
                    </Card>

                    {currentUser.isAdmin && (
                        <Link href="/admin" passHref>
                            <Button variant="secondary" className="w-full mt-4">
                                <Shield className="mr-2 h-4 w-4" /> Admin Panel
                            </Button>
                        </Link>
                    )}

                    <Link href="/profile/edit" passHref>
                        <Button variant="outline" className="w-full mt-2">
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </Button>
                    </Link>
                </div>
                
                <div className="w-full max-w-md">
                    <Separator className="my-4" />
                    <Button variant="destructive" className="w-full" onClick={handleLogout} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />} 
                        {isLoading ? 'Logging out...' : 'Logout'}
                    </Button>
                </div>
            </main>
        </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
         <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b md:px-6 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
            <Link href="/" passHref>
                <Button variant="ghost" size="icon">
                    <ArrowLeft />
                </Button>
            </Link>
            <h1 className="text-xl font-bold">{isLoginView ? 'Login' : 'Sign Up'}</h1>
            </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
             <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 inline-flex">
                <User className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold font-headline">{isLoginView ? 'Welcome Back!' : 'Create an Account'}</CardTitle>
            <CardDescription className="text-md">
              {isLoginView ? 'Log in to continue.' : 'Sign up to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                              <Input placeholder="Enter your name" {...field} />
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
                              <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    {!isLoginView && (
                         <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Confirm your password" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isLoading ? 'Processing...' : (isLoginView ? 'Login' : 'Sign Up')}
                    </Button>
                </form>
            </Form>

            {isLoginView && (
                <>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full text-lg py-6" onClick={() => window.open('https://t.me/Bingyt_bot', '_blank')}>
                       <Bot className="mr-2 h-5 w-5" />
                       Login with Telegram
                    </Button>
                </>
            )}
            
            <p className="text-center text-sm text-muted-foreground mt-6">
                {isLoginView ? "Don't have an account?" : "Already have an account?"}
                <Button variant="link" onClick={() => setIsLoginView(!isLoginView)}>
                    {isLoginView ? 'Sign Up' : 'Login'}
                </Button>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
