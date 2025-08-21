
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
import { Loader2, ArrowLeft, User, Save } from 'lucide-react';
import Link from 'next/link';
import type { DatabaseUser } from '@/lib/auth';


const formSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters." }),
    currentPassword: z.string().min(1, { message: "Current password is required to save changes." }),
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

async function updateUserProfile(values: z.infer<typeof formSchema>) {
    const response = await fetch('/api/profile/update', {
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


export default function EditProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingUser, setIsCheckingUser] = useState(true);
    const [currentUser, setCurrentUser] = useState<DatabaseUser | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            if (user) {
                setCurrentUser(user);
                form.setValue('name', user.name);
            } else {
                router.push('/profile');
            }
            setIsCheckingUser(false);
        };
        fetchUser();
    }, [router, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await updateUserProfile(values);
            toast({ title: "Profile Updated!", description: "Your changes have been saved successfully." });
            router.push('/profile');
            router.refresh();

        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || "Could not update your profile.";
            
            if (errorMessage.toLowerCase().includes("password")) {
                 form.setError("currentPassword", { type: "manual", message: errorMessage });
            } else if (errorMessage.toLowerCase().includes("name")) {
                 form.setError("name", { type: "manual", message: errorMessage });
            } else {
                 toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
            }
        } finally {
            setIsLoading(false);
        }
    }
    
    if (isCheckingUser) {
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
                        Change your name or password.
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

    