
'use client';

import {Youtube, ArrowLeft, Bell} from 'lucide-react';
import {useParams, useSearchParams} from 'next/navigation';
import {useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// YouTube Player states
const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

export default function WatchPage() {
  const {id} = useParams();
  const searchParams = useSearchParams();
  const videoId = Array.isArray(id) ? id[0] : id;
  
  const videoTitle = searchParams.get('title') || 'Video Title';
  const videoChannel = searchParams.get('channel') || 'Channel';
  const videoViews = searchParams.get('views') || '0 views';
  const videoUploaded = searchParams.get('uploaded') || '...';
  const isShort = searchParams.get('isShort') === 'true';

  const playerRef = useRef<any>(null);

  // Load YouTube Player API and initialize player
  useEffect(() => {
    const onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: (event: any) => event.target.playVideo(),
        },
      });
    };
    
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
    } else {
        onYouTubeIframeAPIReady();
    }

    return () => {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
        }
    }
  }, [videoId]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-4">
           <Link href="/" passHref>
             <Button variant="ghost" size="icon">
                <ArrowLeft />
             </Button>
           </Link>
          <h1 className="text-xl font-bold">Watch Video</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 flex flex-col gap-6">
        <div className="grid lg:grid-cols-3 gap-6">
             <div className={cn("lg:col-span-3", isShort ? "lg:col-span-3" : "lg:col-span-2")}>
                <Card className="overflow-hidden">
                    <div className={cn(isShort ? "relative aspect-[9/16] max-h-[80vh] mx-auto max-w-sm" : "relative aspect-video", "bg-black")}>
                        <div id="youtube-player" className="w-full h-full"></div>
                    </div>
                </Card>
             </div>
             
             <div className="lg:col-span-3 lg:col-start-1 lg:row-start-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg md:text-xl">{videoTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                            <Youtube className="w-12 h-12 text-red-500" />
                            </a>
                            <div className="flex-grow">
                                <p className="font-semibold">{videoChannel}</p>
                                <p className="text-sm text-muted-foreground">
                                {videoViews} &bull; {videoUploaded}
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant={'default'}>
                                    <Bell className="mr-2 h-4 w-4" />
                                    Subscribe
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Subscribe to {videoChannel}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will open the YouTube channel in a new tab. Do you want to continue?
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => window.open(`https://www.youtube.com/channel/${videoChannel}`, '_blank')}>
                                        Continue
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
             </div>
        </div>
      </main>
    </div>
  );
}
