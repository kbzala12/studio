'use client';

import {Coins, Home, Timer} from 'lucide-react';
import {useParams} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import Link from 'next/link';

export default function WatchPage() {
  const {id} = useParams();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    // Load coins from local storage
    const savedCoins = localStorage.getItem('userCoins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
                <Home className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Watch & Earn</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-bold">{coins}</span>
            </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card className="overflow-hidden">
                 <div className="relative aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full"
                    ></iframe>
                </div>
            </Card>
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Video Title Placeholder</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Channel &bull; Views &bull; Uploaded</p>
                    <p className="mt-4">
                        Video description will go here. You can add more details about the video.
                    </p>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Rewards</CardTitle>
                    <Timer className="w-6 h-6 text-primary"/>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-8 space-y-4">
                        <p className="text-lg">Watch for 3 minutes to earn</p>
                        <p className="text-4xl font-bold flex items-center justify-center gap-2">
                           30 <Coins className="w-8 h-8 text-yellow-500" />
                        </p>
                         <div className="w-full bg-muted rounded-full h-4">
                           <div className="bg-primary h-4 rounded-full" style={{ width: '0%' }}></div>
                         </div>
                        <p className="text-sm text-muted-foreground">00:00 / 03:00</p>
                    </div>
                    <Button className="w-full" disabled>
                        Claim Reward
                    </Button>
                </CardContent>
             </Card>
        </div>
      </main>
    </div>
  );
}
