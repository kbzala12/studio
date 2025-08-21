'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User, Coins, Bot } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const { user } = await res.json();
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, [router]);


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
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Use your Telegram account to login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a href="https://t.me/Bingyt_bot" target="_blank" rel="noopener noreferrer" className='w-full'>
                <Button variant="outline" className="w-full bg-blue-500 text-white hover:bg-blue-600">
                    <Bot className="mr-2" /> Login with Telegram
                </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}