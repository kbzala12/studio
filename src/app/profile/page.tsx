
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
import { Loader2, User, Coins, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type UserData = {
    name: string;
};

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [coins, setCoins] = useState(0);
  const [isLoginView, setIsLoginView] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      
      const savedCoins = localStorage.getItem('userCoins');
      setCoins(savedCoins ? parseInt(savedCoins, 10) : 0);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      password: '',
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    try {
        if (isLoginView) {
            // Login logic
            const existingUser = localStorage.getItem(`user_${values.name}`);
            if (existingUser) {
                const user = JSON.parse(existingUser);
                if (user.password === values.password) {
                    localStorage.setItem('currentUser', JSON.stringify({ name: user.name }));
                    setCurrentUser({ name: user.name });
                    setIsLoggedIn(true);
                    const savedCoins = localStorage.getItem('userCoins');
                    setCoins(savedCoins ? parseInt(savedCoins, 10) : 0);
                    toast({ title: "Login Successful!" });
                } else {
                    toast({ variant: "destructive", title: "Invalid credentials" });
                }
            } else {
                 toast({ variant: "destructive", title: "User not found" });
            }
        } else {
            // Signup logic
            const existingUser = localStorage.getItem(`user_${values.name}`);
            if (existingUser) {
                toast({ variant: "destructive", title: "User already exists", description: "Please choose a different name or log in." });
            } else {
                const newUser = { name: values.name, password: values.password };
                localStorage.setItem(`user_${values.name}`, JSON.stringify(newUser));
                localStorage.setItem('currentUser', JSON.stringify({ name: values.name }));
                // Initialize coins for new user if not present
                if (!localStorage.getItem('userCoins')) {
                    localStorage.setItem('userCoins', '0');
                }
                setCurrentUser({ name: values.name });
                setIsLoggedIn(true);
                setCoins(0);
                toast({ title: "Account Created!", description: "You are now logged in." });
            }
        }
    } catch (error) {
        toast({ variant: "destructive", title: "An error occurred" });
    } finally {
        setIsLoading(false);
        form.reset();
    }
  }

  if (isLoggedIn && currentUser) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" passHref>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">Profile</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut />
                </Button>
            </header>
            <main className="flex-grow flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="items-center text-center">
                        <User className="w-20 h-20 text-primary p-3 bg-primary/10 rounded-full" />
                        <CardTitle className="text-3xl font-bold mt-4">{currentUser.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="text-4xl font-bold flex items-center justify-center gap-3">
                            <Coins className="w-10 h-10 text-yellow-500" />
                            <span>{coins}</span>
                        </div>
                        <p className="text-muted-foreground mt-2">Your Coin Balance</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
         <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
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
            <CardTitle className="text-3xl font-bold font-headline">{isLoginView ? 'Welcome Back!' : 'Create an Account'}</CardTitle>
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
                    <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isLoading ? 'Processing...' : (isLoginView ? 'Login' : 'Sign Up')}
                    </Button>
                </form>
            </Form>
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
