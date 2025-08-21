
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
import { Loader2, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  videoUrl: z.string().url({ message: "Please enter a valid YouTube URL." }).regex(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/, 'Must be a valid YouTube video URL.'),
});

async function submitVideo(videoUrl: string) {
    const response = await fetch('/api/videos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Submission failed');
    }
    return result;
}

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function checkLogin() {
        const res = await fetch('/api/sessions');
        if (!res.ok) {
            toast({
                variant: "destructive",
                title: "Login Required",
                description: "You must be logged in to submit a video.",
            });
            router.push('/profile');
        }
    }
    checkLogin();
  }, [router, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await submitVideo(values.videoUrl);
      toast({
        title: "Video Submitted!",
        description: "Your video is now pending approval. This may take up to 24 hours.",
      });
      form.reset();
    } catch (error: any) {
        toast({
          variant: "destructive",
          title: "An error occurred",
          description: error.message || "Failed to submit your video. Please try again.",
        })
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-xl font-bold">Submit Video URL</h1>
            </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 inline-flex">
                <Upload className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold font-headline">Promote Your Video</CardTitle>
            <CardDescription className="text-md">
              Submit your YouTube video to be featured in the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="sr-only">YouTube Video URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : null}
                    {isLoading ? 'Submitting...' : 'Submit Video'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground pt-2">
                        After submission, your video will be reviewed by an admin. This can take up to 24 hours. Once approved, it will be live in the app.
                    </p>
                </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
