
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
import { Loader2, ArrowLeft, KeyRound, User, Save } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
    newName: z.string().min(3, { message: "New name must be at least 3 characters." }),
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
}).refine((data) => {
    if (data.newPassword || data.confirmNewPassword) {
        return data.newPassword === data.confirmNewPassword;
    }
    return true;
}, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
}).refine((data) => {
    if (data.newPassword) {
        return data.newPassword.length >= 6;
    }
    return true;
}, {
    message: "New password must be at least 6 characters.",
    path: ["newPassword"],
});

type UserData = {
    name: string;
};

const ADMIN_USERNAME = 'Zala kb 101';

export default function EditProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
            try {
                const user = JSON.parse(loggedInUser);
                setCurrentUser(user);
                form.setValue('newName', user.name);
            } catch (e) {
                console.error("Failed to parse user data from localStorage", e);
                router.push('/profile');
            }
        } else {
            router.push('/profile');
        }
    }, [router]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newName: '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!currentUser) return;
        
        const isCurrentUserAdmin = currentUser.name.toLowerCase() === ADMIN_USERNAME.toLowerCase();

        try {
            const userAccountKey = `user_${currentUser.name}`;
            const existingUserRaw = localStorage.getItem(userAccountKey);
            
            if (!existingUserRaw) {
                toast({ variant: "destructive", title: "Error", description: "Could not find your account data." });
                return;
            }

            const userAccount = JSON.parse(existingUserRaw);

            if (userAccount.password !== values.currentPassword) {
                toast({ variant: "destructive", title: "Incorrect Password", description: "The current password you entered is incorrect." });
                form.setError("currentPassword", { type: "manual", message: "Incorrect password" });
                return;
            }

            let updatedUserData = { ...userAccount };
            let updatedUsername = currentUser.name;

            if (values.newName && values.newName !== currentUser.name) {
                // Prevent normal users from taking admin name
                if (values.newName.toLowerCase() === ADMIN_USERNAME.toLowerCase() && !isCurrentUserAdmin) {
                     toast({ variant: "destructive", title: "Name Taken", description: "This name is reserved. Please choose another." });
                     form.setError("newName", { type: "manual", message: "Name is reserved" });
                     return;
                }
                 // Prevent admin from changing their name
                if (isCurrentUserAdmin && values.newName.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
                    toast({ variant: "destructive", title: "Action Not Allowed", description: "Admin username cannot be changed." });
                    form.setError("newName", { type: "manual", message: "Admin name cannot be changed" });
                    return;
                }

                const newUsernameKey = `user_${values.newName}`;
                if (localStorage.getItem(newUsernameKey)) {
                    toast({ variant: "destructive", title: "Name Taken", description: "This name is already in use. Please choose another." });
                    form.setError("newName", { type: "manual", message: "Name already taken" });
                    return;
                }
                
                updatedUserData.name = values.newName;
                updatedUsername = values.newName;
                
                localStorage.setItem(newUsernameKey, JSON.stringify(updatedUserData));
                localStorage.removeItem(userAccountKey); 

                const oldCoinKey = `userCoins_${currentUser.name}`;
                const newCoinKey = `userCoins_${values.newName}`;
                const coins = localStorage.getItem(oldCoinKey);
                if (coins) {
                    localStorage.setItem(newCoinKey, coins);
                    localStorage.removeItem(oldCoinKey);
                }
            }
            
            if (values.newPassword) {
                updatedUserData.password = values.newPassword;
            }
            
            localStorage.setItem(`user_${updatedUsername}`, JSON.stringify(updatedUserData));
            localStorage.setItem('currentUser', JSON.stringify({ name: updatedUsername }));
            
            toast({ title: "Profile Updated!", description: "Your changes have been saved successfully." });
            router.push('/profile');

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "An error occurred", description: "Could not update your profile." });
        } finally {
            setIsLoading(false);
        }
    }
    
    if (!currentUser) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                <Link href="/profile" passHref>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">Edit Profile</h1>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center p-4">
                <Card className="w-full max-w-lg shadow-2xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 inline-flex">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold font-headline">Update Your Info</CardTitle>
                    <CardDescription className="text-md">
                        Change your name or password. Emojis are welcome! 😊
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="newName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your new name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <hr className="my-4 border-border" />
                            
                            <p className="text-sm font-medium text-muted-foreground">To change your password, enter your current and new password below.</p>
                            
                             <FormField
                                control={form.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Current Password (required)</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your current password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>New Password (optional)</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter a new password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmNewPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Confirm your new password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                </Card>
            </main>
        </div>
    );
}
