
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
    isAdmin: boolean;
};

const ADMIN_USERNAME = 'Zala kb 101';

// FAKE server action - replace with actual API call
async function updateUserProfile(data: any) {
    console.log("Updating profile with", data);
    // Simulate API delay
    await new Promise(res => setTimeout(res, 1000));

    const { currentName, newName, currentPassword, newPassword } = data;

    // In a real app, this logic is on the server.
    // We are mocking it here with localStorage for demonstration.
    const userAccountKey = `user_${currentName}`;
    const existingUserRaw = localStorage.getItem(userAccountKey);
    if (!existingUserRaw) {
        throw new Error("Could not find your account data.");
    }
    
    const userAccount = JSON.parse(existingUserRaw);
    if (userAccount.password !== currentPassword) {
        throw new Error("The current password you entered is incorrect.");
    }
    
    const isCurrentUserAdmin = userAccount.name.toLowerCase() === ADMIN_USERNAME.toLowerCase();

    // Prevent admin from changing their name
    if (isCurrentUserAdmin && newName.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
         throw new Error("Admin username cannot be changed.");
    }

    // Prevent normal user from taking admin name
    if (newName.toLowerCase() === ADMIN_USERNAME.toLowerCase() && !isCurrentUserAdmin) {
        throw new Error("This name is reserved. Please choose another.");
    }

    let updatedUserData = { ...userAccount };
    let updatedUsername = currentName;

    // Handle name change
    if (newName && newName !== currentName) {
        const newUsernameKey = `user_${newName}`;
        if (localStorage.getItem(newUsernameKey)) {
            throw new Error("This name is already in use. Please choose another.");
        }
        updatedUserData.name = newName;
        updatedUsername = newName;
    }
    
    // Handle password change
    if (newPassword) {
        updatedUserData.password = newPassword;
    }

    // Update storage
    localStorage.setItem(`user_${updatedUsername}`, JSON.stringify(updatedUserData));
    if (newName && newName !== currentName) {
        localStorage.removeItem(userAccountKey);
        // also migrate coins
        const oldCoinKey = `userCoins_${currentName}`;
        const newCoinKey = `userCoins_${newName}`;
        const coins = localStorage.getItem(oldCoinKey);
        if (coins) {
            localStorage.setItem(newCoinKey, coins);
            localStorage.removeItem(oldCoinKey);
        }
    }
    
    const finalUserData = { name: updatedUsername, isAdmin: updatedUserData.isAdmin };
    localStorage.setItem('currentUser', JSON.stringify(finalUserData));
    return finalUserData;
}


export default function EditProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newName: '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

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
    }, [router, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        
        if (!currentUser) return;

        try {
            const updatedUser = await updateUserProfile({
                currentName: currentUser.name,
                newName: values.newName,
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            });
            
            toast({ title: "Profile Updated!", description: "Your changes have been saved successfully." });
            router.push('/profile');
            router.refresh();

        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || "Could not update your profile.";
            
            if (errorMessage.includes("password")) {
                 form.setError("currentPassword", { type: "manual", message: errorMessage });
            } else if (errorMessage.includes("name")) {
                 form.setError("newName", { type: "manual", message: errorMessage });
            }

            toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
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
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b md:px-6 bg-background/80 backdrop-blur-sm">
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
                    <CardTitle className="text-2xl md:text-3xl font-bold font-headline">Update Your Info</CardTitle>
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
