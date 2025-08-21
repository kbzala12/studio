'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Coins, User, Video, Gift, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type User = {
  id: string;
  name: string;
  coins: number;
  isAdmin: boolean;
};

type Video = {
  id: number;
  url: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
};

const getYoutubeVideoId = (url: string) => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            return urlObj.searchParams.get('v');
        }
        return null;
    } catch (e) {
        return null;
    }
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = useCallback(async () => {
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
    }
  }, []);

  const fetchVideos = useCallback(async () => {
      try {
          const res = await fetch('/api/videos');
          if (res.ok) {
              const allVideos = await res.json();
              const approvedVideos = allVideos.filter((v: Video) => v.status === 'approved');
              setVideos(approvedVideos);
          }
      } catch (error) {
          console.error("Failed to fetch videos", error);
      }
  }, []);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchUserData(), fetchVideos()]);
        setIsLoading(false);
    }
    loadData();
  }, [fetchUserData, fetchVideos]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm md:px-6">
            <Link href="/" className="flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Bingyt</h1>
            </Link>
            <div className="flex items-center gap-2">
                {user ? (
                    <Button variant="ghost" onClick={() => router.push('/profile')}>
                        <User className="mr-2" />
                        {user.name}
                    </Button>
                ) : (
                    <Button onClick={() => router.push('/profile')}>Login</Button>
                )}
            </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
            <div className="space-y-6">
                {user && (
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>My Wallet</CardTitle>
                            <Link href="/profile">
                                <Button variant="outline">Profile</Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <Coins className="w-10 h-10 text-yellow-500" />
                            <div>
                                <p className="text-3xl font-bold">{user.coins}</p>
                                <p className="text-muted-foreground">Coins</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Featured Videos</h2>
                    <Link href="/upload" passHref>
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" /> Submit Video
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="w-full h-40" />
                                <CardContent className="p-3">
                                    <Skeleton className="h-4 w-3/4 mb-2" />
                                    <Skeleton className="h-3 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : videos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {videos.map(video => {
                            const videoId = getYoutubeVideoId(video.url);
                            const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://placehold.co/320x180.png';
                            
                            return (
                                <Link key={video.id} href={`/watch/${videoId}`} passHref>
                                    <Card className="overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-xl cursor-pointer">
                                        <Image
                                            src={thumbnailUrl}
                                            alt="Video thumbnail"
                                            width={320}
                                            height={180}
                                            className="object-cover w-full h-40"
                                        />
                                        <CardContent className="p-3">
                                            <p className="font-semibold truncate">Video by {video.submittedBy}</p>
                                            <p className="text-sm text-muted-foreground">Click to watch</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No videos available right now. Check back later!</p>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
}
