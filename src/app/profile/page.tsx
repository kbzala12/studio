
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
import { Loader2, User, Coins, LogOut, ArrowLeft, Gift, History } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const loginSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }),
    password: z.string().min(1, { message: "Password is required." }),
});

type UserData = {
    name: string;
};

type Transaction = {
    type: 'watch_reward' | 'upload_fee' | 'daily_bonus' | 'initial';
    amount: number;
    date: string;
    description: string;
};

const DAILY_BONUS_AMOUNT = 10;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [coins, setCoins] = useState(0);
  const [coinHistory, setCoinHistory] = useState<Transaction[]>([]);
  const [isLoginView, setIsLoginView] = useState(true);
  const [hasClaimedDailyBonus, setHasClaimedDailyBonus] = useState(false);
  const { toast } = useToast();

  const loadUserData = (username: string) => {
    const savedCoins = localStorage.getItem(`userCoins_${username}`);
    const userCoins = savedCoins ? parseInt(savedCoins, 10) : 0;
    setCoins(userCoins);

    const savedHistory = localStorage.getItem(`coinHistory_${username}`);
    const userHistory = savedHistory ? JSON.parse(savedHistory) : [];
    setCoinHistory(userHistory);

    const dailyBonusData = localStorage.getItem(`dailyBonus_${username}`);
    if (dailyBonusData) {
        const lastClaimDate = new Date(dailyBonusData);
        const today = new Date();
        if (lastClaimDate.toDateString() === today.toDateString()) {
            setHasClaimedDailyBonus(true);
        } else {
            setHasClaimedDailyBonus(false);
        }
    } else {
        setHasClaimedDailyBonus(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in from localStorage
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      try {
        const user = JSON.parse(loggedInUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        loadUserData(user.name);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const addTransaction = (username: string, transaction: Omit<Transaction, 'date'>) => {
    const newTransaction = { ...transaction, date: new Date().toISOString() };
    const savedHistory = localStorage.getItem(`coinHistory_${username}`);
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    const updatedHistory = [newTransaction, ...history];
    localStorage.setItem(`coinHistory_${username}`, JSON.stringify(updatedHistory));
    setCoinHistory(updatedHistory);
  };
  
  const updateUserCoins = (username: string, newCoinValue: number) => {
      setCoins(newCoinValue);
      localStorage.setItem(`userCoins_${username}`, newCoinValue.toString());
  }


  const handleClaimDailyBonus = () => {
    if (!currentUser || hasClaimedDailyBonus) return;

    const newCoins = coins + DAILY_BONUS_AMOUNT;
    updateUserCoins(currentUser.name, newCoins);
    
    addTransaction(currentUser.name, {
        type: 'daily_bonus',
        amount: DAILY_BONUS_AMOUNT,
        description: 'Daily login bonus'
    });

    localStorage.setItem(`dailyBonus_${currentUser.name}`, new Date().toISOString());
    setHasClaimedDailyBonus(true);

    toast({
        title: "Daily Bonus Claimed!",
        description: `You've received ${DAILY_BONUS_AMOUNT} coins.`,
    });
  };

  const currentFormSchema = isLoginView ? loginSchema : formSchema;

  const form = useForm<z.infer<typeof currentFormSchema>>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      name: '',
      password: '',
      ...(isLoginView ? {} : { confirmPassword: '' }),
    },
  });

   useEffect(() => {
    form.reset({
      name: '',
      password: '',
      ...(isLoginView ? {} : { confirmPassword: '' }),
    });
  }, [isLoginView, form]);


  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCoins(0);
    setCoinHistory([]);
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
  };

  async function onSubmit(values: z.infer<typeof currentFormSchema>) {
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
                    loadUserData(user.name);
                    toast({ title: "Login Successful!" });
                } else {
                    toast({ variant: "destructive", title: "Invalid credentials" });
                }
            } else {
                 toast({ variant: "destructive", title: "User not found" });
            }
        } else {
            // Signup logic
            const signupValues = values as z.infer<typeof formSchema>;
            const existingUser = localStorage.getItem(`user_${signupValues.name}`);
            if (existingUser) {
                toast({ variant: "destructive", title: "User already exists", description: "Please choose a different name or log in." });
            } else {
                const newUser = { name: signupValues.name, password: signupValues.password };
                const username = signupValues.name;
                
                localStorage.setItem(`user_${username}`, JSON.stringify(newUser));
                localStorage.setItem('currentUser', JSON.stringify({ name: username }));
                localStorage.setItem(`userCoins_${username}`, '0');
                 // Initialize with an empty history
                localStorage.setItem(`coinHistory_${username}`, JSON.stringify([]));

                setCurrentUser({ name: username });
                setIsLoggedIn(true);
                loadUserData(username);
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
        <div className="flex flex-col h-screen bg-background text-foreground">
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
            <main className="flex-grow flex flex-col items-center p-4 gap-4 overflow-y-auto">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="items-center text-center">
                        <User className="w-20 h-20 text-primary p-3 bg-primary/10 rounded-full" />
                        <CardTitle className="text-3xl font-bold mt-4">{currentUser.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="text-4xl font-bold flex items-center justify-center gap-3">
                            <Coins className="w-10 h-10 text-yellow-500" />
                            <span>{coins}</span>
                        </div>
                        <p className="text-muted-foreground -mt-2">Your Coin Balance</p>
                         <Button onClick={handleClaimDailyBonus} disabled={hasClaimedDailyBonus}>
                            <Gift className="mr-2 h-4 w-4" />
                            {hasClaimedDailyBonus ? "Bonus Claimed Today" : `Claim Daily Bonus (+${DAILY_BONUS_AMOUNT})`}
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="w-full max-w-md shadow-2xl flex-grow flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <History className="w-6 h-6"/> Coin History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                        <ScrollArea className="h-full">
                            {coinHistory.length > 0 ? (
                                <div className="space-y-4">
                                {coinHistory.map((tx, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{tx.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(tx.date).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                           {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                        </p>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center pt-8">No transaction history yet.</p>
                            )}
                        </ScrollArea>
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
