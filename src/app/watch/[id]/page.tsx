
'use client';

import {Coins, Timer, CheckCircle, Youtube} from 'lucide-react';
import {useParams, useSearchParams} from 'next/navigation';
import {useEffect, useState, useMemo, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {useToast} from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

const REWARD_AMOUNT = 30;
const DAILY_COIN_LIMIT = 650;

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

  const REWARD_DURATION_SECONDS = isShort ? 60 : 180;

  const [coins, setCoins] = useState(0);
  const [timeWatched, setTimeWatched] = useState(0);
  const [rewardClaimedForVideo, setRewardClaimedForVideo] = useState(false);
  const [dailyCoinsEarned, setDailyCoinsEarned] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(true); // Start as paused
  const {toast, dismiss} = useToast();
  const toastId = useRef<string | null>(null);
  const playerRef = useRef<any>(null);

  const progress = useMemo(() => (timeWatched / REWARD_DURATION_SECONDS) * 100, [timeWatched, REWARD_DURATION_SECONDS]);
  const isTimerComplete = useMemo(() => timeWatched >= REWARD_DURATION_SECONDS, [timeWatched, REWARD_DURATION_SECONDS]);
  const hasReachedDailyLimit = useMemo(() => dailyCoinsEarned >= DAILY_COIN_LIMIT, [dailyCoinsEarned]);

  // Load user data from localStorage
  useEffect(() => {
    const savedCoins = localStorage.getItem('userCoins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    }
    
    // Check daily earnings
    const dailyData = localStorage.getItem('dailyCoinData');
    if (dailyData) {
        const { date, amount } = JSON.parse(dailyData);
        const today = new Date().toISOString().split('T')[0];
        if (date === today) {
            setDailyCoinsEarned(amount);
        } else {
            // Reset for the new day
            localStorage.setItem('dailyCoinData', JSON.stringify({ date: today, amount: 0 }));
        }
    } else {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('dailyCoinData', JSON.stringify({ date: today, amount: 0 }));
    }


    const lastClaimed = localStorage.getItem(`videoClaim_${videoId}`);
    if (lastClaimed) {
        const lastClaimDate = new Date(lastClaimed);
        const today = new Date();
        if (lastClaimDate.getFullYear() === today.getFullYear() &&
            lastClaimDate.getMonth() === today.getMonth() &&
            lastClaimDate.getDate() === today.getDate()) {
            setRewardClaimedForVideo(true);
            setTimeWatched(REWARD_DURATION_SECONDS);
        }
    }
  }, [videoId]);
  
  // Load YouTube Player API and initialize player
  useEffect(() => {
    const onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
        },
        events: {
          onReady: (event: any) => {
             // Autoplay might not work on all browsers, so we explicitly play it.
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === YT_PLAYER_STATE.PLAYING) {
              setIsTimerPaused(false);
            } else {
              setIsTimerPaused(true);
            }
          },
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


  // Main timer interval
  useEffect(() => {
    if (rewardClaimedForVideo || isTimerComplete || isTimerPaused || hasReachedDailyLimit) {
      return;
    }

    const timer = setInterval(() => {
      setTimeWatched(prevTime => {
        if (prevTime < REWARD_DURATION_SECONDS) {
          return prevTime + 1;
        }
        clearInterval(timer);
        return prevTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rewardClaimedForVideo, isTimerComplete, isTimerPaused, REWARD_DURATION_SECONDS, hasReachedDailyLimit]);

  // Handle browser tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
       
      if (isHidden) {
         setIsTimerPaused(true);
         const { id } = toast({
          title: "टाइमर रोक दिया गया",
          description: "कमाना जारी रखने के लिए इस टैब पर वापस आएँ।",
          duration: Infinity,
        });
        toastId.current = id;
      } else {
        // Only unpause if the video is supposed to be playing
        if (playerRef.current && playerRef.current.getPlayerState() === YT_PLAYER_STATE.PLAYING) {
           setIsTimerPaused(false);
        }
        if (toastId.current) {
            dismiss(toastId.current);
            toastId.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (toastId.current) {
        dismiss(toastId.current);
      }
    };
  }, [toast, dismiss]);


  const handleClaimReward = () => {
    if (hasReachedDailyLimit) {
        toast({
            variant: "destructive",
            title: "Daily Limit Reached",
            description: `You can only earn ${DAILY_COIN_LIMIT} coins per day.`,
        });
        return;
    }
      
    const newTotalCoins = coins + REWARD_AMOUNT;
    setCoins(newTotalCoins);
    localStorage.setItem('userCoins', newTotalCoins.toString());
    
    const today = new Date();
    localStorage.setItem(`videoClaim_${videoId}`, today.toISOString());
    setRewardClaimedForVideo(true);

    const newDailyAmount = dailyCoinsEarned + REWARD_AMOUNT;
    setDailyCoinsEarned(newDailyAmount);
    localStorage.setItem('dailyCoinData', JSON.stringify({ date: today.toISOString().split('T')[0], amount: newDailyAmount }));

    toast({
        title: "Reward Claimed!",
        description: `You've earned ${REWARD_AMOUNT} coins.`,
        action: <CheckCircle className="text-green-500" />
    });
  };

  const getButtonText = () => {
    if (rewardClaimedForVideo) return "Reward Claimed";
    if (hasReachedDailyLimit) return "Daily Limit Reached";
    if (isTimerComplete) return "Claim Reward";
    if (isTimerPaused) return "Timer Paused";
    return "Watch to Unlock";
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
           <Link href="/" passHref>
             <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
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

      <main className="flex-grow container mx-auto p-4 md:p-6 flex flex-col gap-6">
        <div className="w-full">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Rewards</CardTitle>
                    <Timer className="w-6 h-6 text-primary"/>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-8 space-y-4">
                        <p className="text-lg">Watch for {REWARD_DURATION_SECONDS / 60} minute{REWARD_DURATION_SECONDS / 60 > 1 ? 's' : ''} to earn</p>
                        <p className="text-4xl font-bold flex items-center justify-center gap-2">
                           {REWARD_AMOUNT} <Coins className="w-8 h-8 text-yellow-500" />
                        </p>
                         <Progress value={progress} className="h-4" />
                        <p className="text-sm text-muted-foreground">
                            {formatTime(timeWatched)} / {formatTime(REWARD_DURATION_SECONDS)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Daily Coins: {dailyCoinsEarned} / {DAILY_COIN_LIMIT}
                        </p>
                    </div>
                    <Button 
                        className="w-full" 
                        disabled={!isTimerComplete || rewardClaimedForVideo || hasReachedDailyLimit}
                        onClick={handleClaimReward}
                    >
                        {getButtonText()}
                    </Button>
                </CardContent>
             </Card>
        </div>
        <div>
            <Card className="overflow-hidden">
                 <div className={isShort ? "relative aspect-[9/16] max-h-[70vh] mx-auto" : "relative aspect-video"}>
                    <div id="youtube-player"></div>
                </div>
            </Card>
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>{videoTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                          <Youtube className="w-12 h-12 text-red-500" />
                        </a>
                        <div>
                            <a href={`https://www.youtube.com/channel/${videoChannel.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{videoChannel}</a>
                            <p className="text-sm text-muted-foreground">
                              {videoViews} &bull; {videoUploaded}
                            </p>
                        </div>
                    </div>
                    <p className="mt-4">
                        Video description will go here. You can add more details about the video.
                    </p>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );

    