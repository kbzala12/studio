
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
import { Loader2, Upload, AlertCircle, Coins, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const UPLOAD_COST = 1250;

type Transaction = {
    type: 'watch_reward' | 'upload_fee' | 'daily_bonus' | 'initial';
    amount: number;
    date: string;
    description: string;
};

const formSchema = z.object({
  videoUrl: z.string().url({ message: "Please enter a valid YouTube URL." }).regex(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/, 'Must be a valid YouTube video URL.'),
});

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string} | null>(null);
  const [coins, setCoins] = useState(0);
  const [hasSufficientCoins, setHasSufficientCoins] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
     const loggedInUser = localStorage.getItem('currentUser');
     if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        const savedCoins = localStorage.getItem(`userCoins_${user.name}`);
        const userCoins = savedCoins ? parseInt(savedCoins, 10) : 0;
        setCoins(userCoins);
        setHasSufficientCoins(userCoins >= UPLOAD_COST);
     } else {
        setIsLoggedIn(false);
     }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: '',
    },
  });

  const addTransaction = (username: string, transaction: Omit<Transaction, 'date'>) => {
    const newTransaction = { ...transaction, date: new Date().toISOString() };
    const savedHistory = localStorage.getItem(`coinHistory_${username}`);
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    const updatedHistory = [newTransaction, ...history];
    localStorage.setItem(`coinHistory_${username}`, JSON.stringify(updatedHistory));
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser || !isLoggedIn) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "You need to be logged in to upload a video.",
        });
        router.push('/profile');
        return;
    }
      
    if (!hasSufficientCoins) {
        toast({
            variant: "destructive",
            title: "Insufficient Coins",
            description: `You need at least ${UPLOAD_COST} coins to upload a video.`,
        });
        return;
    }

    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const newTotalCoins = coins - UPLOAD_COST;
      setCoins(newTotalCoins);
      localStorage.setItem(`userCoins_${currentUser.name}`, newTotalCoins.toString());
      setHasSufficientCoins(newTotalCoins >= UPLOAD_COST);

      addTransaction(currentUser.name, {
          type: 'upload_fee',
          amount: -UPLOAD_COST,
          description: `Fee for submitting video: ${values.videoUrl.substring(0, 30)}...`
      });

      const submittedVideos = JSON.parse(localStorage.getItem('submittedVideos') || '[]');
      submittedVideos.push({ url: values.videoUrl, submittedBy: currentUser.name, submittedAt: new Date().toISOString(), status: 'pending' });
      localStorage.setItem('submittedVideos', JSON.stringify(submittedVideos));

      toast({
        title: "Video Submitted!",
        description: "Your video is now pending approval. This may take up to 24 hours.",
      });
      form.reset();

    } catch (error) {
        toast({
          variant: "destructive",
          title: "An error occurred",
          description: "Failed to submit your video. Please try again.",
        })
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-xl font-bold">Submit Video URL</h1>
            </div>
            {isLoggedIn && (
              <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-yellow-500" />
                  <span className="text-lg font-bold">{coins}</span>
              </div>
            )}
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 inline-flex">
                <Upload className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline">Promote Your Video</CardTitle>
            <CardDescription className="text-md">
              Submit your YouTube video to be featured in the app.
              Cost: <span className="font-bold text-primary">{UPLOAD_COST} coins</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoggedIn ? (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-muted rounded-lg">
                    <User className="w-12 h-12 text-destructive mb-4" />
                    <h3 className="text-xl font-bold">Please Log In</h3>
                    <p className="text-muted-foreground mb-4">
                        You need to be logged in to submit a video.
                    </p>
                    <Button onClick={() => router.push('/profile')}>Go to Login</Button>
                </div>
            ) : !hasSufficientCoins ? (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-muted rounded-lg">
                    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                    <h3 className="text-xl font-bold text-destructive">Not Enough Coins</h3>
                    <p className="text-muted-foreground">
                        You need at least {UPLOAD_COST} coins to upload a video.
                        Watch more videos or claim your daily bonus to earn coins.
                    </p>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="sr-only">YouTube Video URL</FormLabel>
                            <FormControl>
                                <Input className="text-base" placeholder="https://youtube.com/watch?v=..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : null}
                        {isLoading ? 'Submitting...' : `Submit for ${UPLOAD_COST} Coins`}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground pt-2">
                            After submission, your video will be reviewed by an admin. This can take up to 24 hours. Once approved, it will be live in the app.
                        </p>
                    </form>
                </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
