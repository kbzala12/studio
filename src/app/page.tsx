
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Flame, Video, User, Upload, UserPlus, Coins, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{name: string} | null>(null);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    // We need to check for window to ensure this runs only on the client
    if (typeof window !== 'undefined') {
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
            try {
                const user = JSON.parse(loggedInUser);
                setCurrentUser(user);
                const savedCoins = localStorage.getItem(`userCoins_${user.name}`);
                setCoins(savedCoins ? parseInt(savedCoins, 10) : 0);
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
                // If parsing fails, clear the invalid item
                localStorage.removeItem('currentUser');
            }
        }
    }
  }, []);

  const videos = [
    {
      id: 'JkzAlNEuiyk',
      title: 'YouTube Video 1',
      channel: 'Channel 1',
      views: '1.2K views',
      uploaded: '1 day ago',
    },
    {
      id: 'eteCs5_FAgU',
      title: 'YouTube Video 2',
      channel: 'Channel 2',
      views: '2.3K views',
      uploaded: '2 days ago',
    },
    {
      id: '1-2981cjwhM',
      title: 'YouTube Video 3',
      channel: 'Channel 3',
      views: '3.4K views',
      uploaded: '3 days ago',
    },
    {
      id: 'oLOST3vWR4g',
      title: 'YouTube Video 4',
      channel: 'Channel 4',
      views: '4.5K views',
      uploaded: '4 days ago',
    },
  ].map(v => ({...v, thumbnail: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}));

  const shorts = [
    { id: 'oV8exPIMdSY', title: 'YouTube Short 1', views: '10K views' },
    { id: 'QuAxFi9V7kg', title: 'YouTube Short 2', views: '12K views' },
    { id: 'dVUy6aWYgHI', title: 'YouTube Short 3', views: '15K views' },
    { id: 'DAcFJ-MmvhQ', title: 'YouTube Short 4', views: '20K views' },
  ].map(s => ({...s, thumbnail: `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`, channel: '@ShortsCreator', uploaded: '1 day ago'}));


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube w-8 h-8 text-red-500"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17Z"/><path d="m10 15 5-3-5-3z"/></svg>
          <h1 className="text-2xl font-bold font-headline text-red-500">my KB YT bot</h1>
        </div>
        <div className="flex items-center gap-2">
            <Link href="/profile" passHref>
            <Button variant="ghost" className="flex items-center gap-2">
                {currentUser ? (
                <>
                    <User className="w-6 h-6" />
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold truncate max-w-[80px]">{currentUser.name}</span>
                        <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs">{coins}</span>
                        </div>
                    </div>
                </>
                ) : (
                <>
                    <User className="w-6 h-6" />
                    <span className="text-sm">Profile</span>
                </>
                )}
            </Button>
            </Link>
        </div>
      </header>
      
      <main className="flex-grow p-6 pb-24">
        
        <section className="mb-10">
           <div className="flex items-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold">Shorts</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {shorts.map((short) => (
              <Link 
                href={`/watch/${short.id}?title=${encodeURIComponent(short.title)}&channel=${encodeURIComponent(short.channel)}&views=${encodeURIComponent(short.views)}&uploaded=${encodeURIComponent(short.uploaded)}&isShort=true`}
                key={short.id} 
                className="group"
              >
                <div>
                  <Card className="overflow-hidden rounded-lg">
                    <CardContent className="p-0">
                      <div className="relative aspect-[9/16]">
                        <Image
                          src={short.thumbnail}
                          alt={short.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint="youtube short thumbnail"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <div className="pt-2">
                      <h3 className="text-base font-semibold leading-tight truncate">{short.title}</h3>
                      <p className="text-sm text-muted-foreground">{short.views}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="border-t border-border my-6"></div>
        
        <section>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <Link 
                href={`/watch/${video.id}?title=${encodeURIComponent(video.title)}&channel=${encodeURIComponent(video.channel)}&views=${encodeURIComponent(video.views)}&uploaded=${encodeURIComponent(video.uploaded)}`}
                key={video.id} 
                className="group"
              >
                <div>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-video">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint="video thumbnail"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <div className="flex gap-4 pt-3">
                    <div className="flex-shrink-0">
                       <Image src="https://placehold.co/48x48.png" alt="channel avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-base font-semibold leading-tight">{video.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Subscribe to channel</p>
                      <p className="text-sm text-muted-foreground">
                        {video.views} &bull; {video.uploaded}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

       <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-black">
        <div className="container mx-auto px-4">
          <div className="flex justify-around items-center h-14">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-green-500 hover:bg-green-600">
                  <UserPlus className="w-6 h-6" />
                  <span className="text-xs">Invite</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Open Telegram?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will open the link to our Telegram bot. Do you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => window.open('https://t.me/Bingyt_bot', '_blank')}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {currentUser?.name === 'zala kb' && (
                 <Link href="/admin" passHref>
                    <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-blue-500 hover:bg-blue-600">
                        <Shield className="w-6 h-6" />
                        <span className="text-xs">Admin</span>
                    </Button>
                </Link>
            )}

            <Link href="/upload" passHref>
                <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-yellow-500 hover:bg-yellow-600">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">Submit URL</span>
                </Button>
            </Link>
             <Link href="/" passHref>
              <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-purple-500 hover:bg-purple-600" data-active={true}>
                <Video className="w-6 h-6" />
                <span className="text-xs">Video</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
