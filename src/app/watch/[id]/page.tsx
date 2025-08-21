
'use client';

import {Coins, Timer, CheckCircle, Youtube, Gift, PartyPopper, ArrowLeft, Bell} from 'lucide-react';
import {useParams, useSearchParams} from 'next/navigation';
import {useEffect, useState, useMemo, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {useToast} from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const REWARD_AMOUNT = 30;
const DAILY_COIN_LIMIT = 650;
const DAILY_GIFT_AMOUNT = 10;
const SUBSCRIBE_REWARD = 5;
const DAILY_SUBSCRIBE_COIN_LIMIT = 150;


// YouTube Player states
const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

// Mock server actions, replace with real API calls
async function fetchWatchPageData(username: string, videoId: string) {
    // In a real app, this would fetch from a database
    const savedCoins = localStorage.getItem(`userCoins_${username}`);
    const coins = savedCoins ? parseInt(savedCoins, 10) : 0;
    
    const dailyDataRaw = localStorage.getItem(`dailyCoinData_${username}`);
    let dailyCoinsEarned = 0;
    if (dailyDataRaw) {
        const { date, amount } = JSON.parse(dailyDataRaw);
        const today = new Date().toISOString().split('T')[0];
        if (date === today) {
            dailyCoinsEarned = amount;
        }
    }

    const giftDataRaw = localStorage.getItem(`dailyGiftData_${username}`);
    let nextGiftTimestamp: number | null = null;
    if(giftDataRaw) {
        const timestamp = JSON.parse(giftDataRaw).nextGiftTimestamp;
        if (timestamp && new Date().getTime() < timestamp) {
            nextGiftTimestamp = timestamp;
        }
    }

    const lastClaimedRaw = localStorage.getItem(`videoClaim_${username}_${videoId}`);
    let rewardClaimedForVideo = false;
    if (lastClaimedRaw) {
        const lastClaimDate = new Date(lastClaimedRaw);
        const today = new Date();
        if (lastClaimDate.toDateString() === today.toDateString()) {
            rewardClaimedForVideo = true;
        }
    }

    const subscribedChannelsRaw = localStorage.getItem(`subscribedChannels_${username}`);
    const subscribedChannels = subscribedChannelsRaw ? JSON.parse(subscribedChannelsRaw) : [];
    
    const dailySubDataRaw = localStorage.getItem(`dailySubscribeCoinData_${username}`);
    let dailySubscribeCoinsEarned = 0;
    if (dailySubDataRaw) {
        const { date, amount } = JSON.parse(dailySubDataRaw);
        const today = new Date().toISOString().split('T')[0];
        if(date === today) {
            dailySubscribeCoinsEarned = amount;
        }
    }


    return { coins, dailyCoinsEarned, nextGiftTimestamp, rewardClaimedForVideo, subscribedChannels, dailySubscribeCoinsEarned };
}

async function claimDailyGift(username: string) {
    const savedCoins = localStorage.getItem(`userCoins_${username}`);
    const coins = savedCoins ? parseInt(savedCoins, 10) : 0;
    const newTotalCoins = coins + DAILY_GIFT_AMOUNT;
    localStorage.setItem(`userCoins_${username}`, newTotalCoins.toString());
    
    const nextTimestamp = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem(`dailyGiftData_${username}`, JSON.stringify({ nextGiftTimestamp: nextTimestamp }));

     const currentUserRaw = localStorage.getItem('currentUser');
    if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        currentUser.coins = newTotalCoins;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    return { newTotalCoins, nextGiftTimestamp: nextTimestamp };
}

async function claimVideoReward(username: string, videoId: string) {
    const savedCoins = localStorage.getItem(`userCoins_${username}`);
    const coins = savedCoins ? parseInt(savedCoins, 10) : 0;
    const newTotalCoins = coins + REWARD_AMOUNT;
    localStorage.setItem(`userCoins_${username}`, newTotalCoins.toString());
    
    const today = new Date();
    localStorage.setItem(`videoClaim_${username}_${videoId}`, today.toISOString());

    const dailyDataRaw = localStorage.getItem(`dailyCoinData_${username}`);
    let dailyCoinsEarned = 0;
    if (dailyDataRaw) {
        const { date, amount } = JSON.parse(dailyDataRaw);
        const todayStr = new Date().toISOString().split('T')[0];
        if (date === todayStr) {
            dailyCoinsEarned = amount;
        }
    }
    const newDailyAmount = dailyCoinsEarned + REWARD_AMOUNT;
    localStorage.setItem(`dailyCoinData_${username}`, JSON.stringify({ date: today.toISOString().split('T')[0], amount: newDailyAmount }));
    
    const currentUserRaw = localStorage.getItem('currentUser');
    if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        currentUser.coins = newTotalCoins;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    return { newTotalCoins, newDailyAmount };
}

async function claimSubscriptionReward(username: string, channelId: string) {
    const savedCoins = localStorage.getItem(`userCoins_${username}`);
    const coins = savedCoins ? parseInt(savedCoins, 10) : 0;
    const newTotalCoins = coins + SUBSCRIBE_REWARD;
    localStorage.setItem(`userCoins_${username}`, newTotalCoins.toString());

    // Update daily subscription coins
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dailySubDataRaw = localStorage.getItem(`dailySubscribeCoinData_${username}`);
    let dailySubscribeCoinsEarned = 0;
    if (dailySubDataRaw) {
        const { date, amount } = JSON.parse(dailySubDataRaw);
        if(date === todayStr) {
            dailySubscribeCoinsEarned = amount;
        }
    }
    const newDailySubAmount = dailySubscribeCoinsEarned + SUBSCRIBE_REWARD;
    localStorage.setItem(`dailySubscribeCoinData_${username}`, JSON.stringify({ date: todayStr, amount: newDailySubAmount }));
    
    // Add channel to subscribed list
    const subscribedChannelsRaw = localStorage.getItem(`subscribedChannels_${username}`);
    const subscribedChannels = subscribedChannelsRaw ? JSON.parse(subscribedChannelsRaw) : [];
    if(!subscribedChannels.includes(channelId)) {
        subscribedChannels.push(channelId);
        localStorage.setItem(`subscribedChannels_${username}`, JSON.stringify(subscribedChannels));
    }
    
    // Update total coins in currentUser object
    const currentUserRaw = localStorage.getItem('currentUser');
    if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        currentUser.coins = newTotalCoins;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    return { newTotalCoins, newDailySubAmount };
}



export default function WatchPage() {
  const {id} = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = Array.isArray(id) ? id[0] : id;
  
  const videoTitle = searchParams.get('title') || 'Video Title';
  const videoChannel = searchParams.get('channel') || 'Channel';
  const videoViews = searchParams.get('views') || '0 views';
  const videoUploaded = searchParams.get('uploaded') || '...';
  const isShort = searchParams.get('isShort') === 'true';

  const REWARD_DURATION_SECONDS = isShort ? 60 : 180;

  const [currentUser, setCurrentUser] = useState<{name: string, coins: number} | null>(null);
  const [timeWatched, setTimeWatched] = useState(0);
  const [rewardClaimedForVideo, setRewardClaimedForVideo] = useState(false);
  const [dailyCoinsEarned, setDailyCoinsEarned] = useState(0);
  const [dailySubscribeCoinsEarned, setDailySubscribeCoinsEarned] = useState(0);
  const [nextGiftTimestamp, setNextGiftTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const [isTimerPaused, setIsTimerPaused] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const {toast, dismiss} = useToast();
  const toastId = useRef<string | null>(null);
  const playerRef = useRef<any>(null);

  const progress = useMemo(() => (timeWatched / REWARD_DURATION_SECONDS) * 100, [timeWatched, REWARD_DURATION_SECONDS]);
  const isTimerComplete = useMemo(() => timeWatched >= REWARD_DURATION_SECONDS, [timeWatched, REWARD_DURATION_SECONDS]);
  const hasReachedDailyLimit = useMemo(() => dailyCoinsEarned >= DAILY_COIN_LIMIT, [dailyCoinsEarned]);
  const hasReachedDailySubLimit = useMemo(() => dailySubscribeCoinsEarned >= DAILY_SUBSCRIBE_COIN_LIMIT, [dailySubscribeCoinsEarned]);

  const isGiftClaimed = useMemo(() => nextGiftTimestamp !== null && new Date().getTime() < nextGiftTimestamp, [nextGiftTimestamp]);

  
  useEffect(() => {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        setCurrentUser(user);
        loadUserData(user.name);
    }
  }, [videoId]);

  const loadUserData = async (username: string) => {
    const data = await fetchWatchPageData(username, videoId);
    setCurrentUser(prev => prev ? {...prev, coins: data.coins} : null);
    setDailyCoinsEarned(data.dailyCoinsEarned);
    setDailySubscribeCoinsEarned(data.dailySubscribeCoinsEarned);
    setNextGiftTimestamp(data.nextGiftTimestamp);
    setRewardClaimedForVideo(data.rewardClaimedForVideo);
    if(data.subscribedChannels.includes(videoChannel)) {
        setSubscribed(true);
    } else {
        setSubscribed(false);
    }

    if(data.rewardClaimedForVideo) {
        setTimeWatched(REWARD_DURATION_SECONDS);
    }
  }

  // Countdown timer effect for daily gift
  useEffect(() => {
    if (!nextGiftTimestamp) {
        setCountdown('');
        return;
    }

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = nextGiftTimestamp - now;

        if (distance <= 0) {
            clearInterval(interval);
            setCountdown('');
            setNextGiftTimestamp(null);
            if(currentUser) {
                // In real app, this state would be managed by the server
                localStorage.removeItem(`dailyGiftData_${currentUser.name}`);
            }
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextGiftTimestamp, currentUser]);


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
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
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


  // Main timer interval for video reward
  useEffect(() => {
    if (!currentUser || rewardClaimedForVideo || isTimerComplete || isTimerPaused || hasReachedDailyLimit) {
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
  }, [currentUser, rewardClaimedForVideo, isTimerComplete, isTimerPaused, REWARD_DURATION_SECONDS, hasReachedDailyLimit]);

  // Handle browser tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
       
      if (isHidden) {
         setIsTimerPaused(true);
         const { id } = toast({
          title: "Timer Paused",
          description: "Come back to this tab to continue earning.",
          duration: Infinity,
        });
        toastId.current = id;
      } else {
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
  
  const handleClaimDailyGift = async () => {
    if (!currentUser || isGiftClaimed) return;

    try {
        const { newTotalCoins, nextGiftTimestamp } = await claimDailyGift(currentUser.name);
        setCurrentUser(prev => prev ? {...prev, coins: newTotalCoins} : null);
        setNextGiftTimestamp(nextGiftTimestamp);
        toast({
            title: "Daily Gift Claimed!",
            description: `You've earned ${DAILY_GIFT_AMOUNT} coins.`,
            action: <CheckCircle className="text-green-500" />
        });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not claim gift.'})
    }
  }

  const handleClaimReward = async () => {
    if (!currentUser) return;

    if (hasReachedDailyLimit) {
        toast({
            variant: "destructive",
            title: "Daily Limit Reached",
            description: `You can only earn ${DAILY_COIN_LIMIT} coins per day from watching.`,
        });
        return;
    }
      
    try {
        const { newTotalCoins, newDailyAmount } = await claimVideoReward(currentUser.name, videoId);
        setCurrentUser(prev => prev ? {...prev, coins: newTotalCoins} : null);
        setDailyCoinsEarned(newDailyAmount);
        setRewardClaimedForVideo(true);

        toast({
            title: "Reward Claimed!",
            description: `You've earned ${REWARD_AMOUNT} coins.`,
            action: <CheckCircle className="text-green-500" />
        });

    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not claim reward.'})
    }
  };

  const getButtonText = () => {
    if (!currentUser) return "Login to Earn";
    if (rewardClaimedForVideo) return "Reward Claimed Today";
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
  
  const handleSubscribe = async () => {
    if (!currentUser || subscribed || hasReachedDailySubLimit) {
        if (!currentUser) router.push('/profile');
        if (hasReachedDailySubLimit) {
            toast({
                variant: 'destructive',
                title: 'Subscription Limit Reached',
                description: `You can only earn ${DAILY_SUBSCRIBE_COIN_LIMIT} coins from subscriptions per day.`
            })
        }
        return;
    }
    
    try {
        const {newTotalCoins, newDailySubAmount} = await claimSubscriptionReward(currentUser.name, videoChannel);
        setCurrentUser(prev => prev ? {...prev, coins: newTotalCoins} : null);
        setDailySubscribeCoinsEarned(newDailySubAmount);
        setSubscribed(true);
        toast({
            title: "Subscribed!",
            description: `You earned ${SUBSCRIBE_REWARD} coins.`
        });
        // This is a simplified version. A real app would need the actual channel URL.
        // For now, we just open the video on YouTube.
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    } catch(e) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not process subscription.'
        })
    }
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-4">
           <Link href="/" passHref>
             <Button variant="ghost" size="icon">
                <ArrowLeft />
             </Button>
           </Link>
          <h1 className="text-xl font-bold">Watch & Earn</h1>
        </div>
        {currentUser && (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Coins className="w-6 h-6 text-yellow-500" />
                    <span className="text-lg font-bold">{currentUser.coins}</span>
                </div>
            </div>
        )}
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 flex flex-col gap-6">
        <div className="grid lg:grid-cols-2 gap-6">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Rewards</CardTitle>
                    <Timer className="w-6 h-6 text-primary"/>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="text-center space-y-4">
                        <p className="text-lg">Watch for {REWARD_DURATION_SECONDS / 60} minute{REWARD_DURATION_SECONDS / 60 > 1 ? 's' : ''} to earn</p>
                        <p className="text-4xl font-bold flex items-center justify-center gap-2">
                           {REWARD_AMOUNT} <Coins className="w-8 h-8 text-yellow-500" />
                        </p>
                         <Progress value={progress} className="h-4 [&>div]:bg-red-500" />
                        <p className="text-sm text-muted-foreground">
                            {formatTime(timeWatched)} / {formatTime(REWARD_DURATION_SECONDS)}
                        </p>
                        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                           <span>Watch Coins: {dailyCoinsEarned} / {DAILY_COIN_LIMIT}</span>
                           <span>Sub Coins: {dailySubscribeCoinsEarned} / {DAILY_SUBSCRIBE_COIN_LIMIT}</span>
                        </div>
                    </div>
                    <Button 
                        className="w-full mt-4" 
                        disabled={!currentUser || !isTimerComplete || rewardClaimedForVideo || hasReachedDailyLimit}
                        onClick={currentUser ? handleClaimReward : () => router.push('/profile')}
                    >
                        {getButtonText()}
                    </Button>
                </CardContent>
             </Card>
            
             <div className={cn("order-first lg:order-last", isShort && 'lg:row-span-2')}>
                <Card className="overflow-hidden">
                    <div className={cn(isShort ? "relative aspect-[9/16] max-h-[80vh] mx-auto max-w-sm" : "relative aspect-video", "bg-black")}>
                        <div id="youtube-player" className="w-full h-full"></div>
                    </div>
                </Card>
             </div>
             
             <Card className="lg:col-start-2">
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
                                <Button 
                                    disabled={!currentUser || subscribed || hasReachedDailySubLimit}
                                    variant={subscribed ? 'secondary' : 'default'}
                                    className={cn("w-full md:w-auto", subscribed && "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300")}
                                >
                                   <Bell className="mr-2 h-4 w-4" />
                                   {subscribed ? 'Subscribed' : 'Subscribe & Earn'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Subscribe to {videoChannel}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will open the YouTube video in a new tab. You will earn {SUBSCRIBE_REWARD} coins for subscribing. Do you want to continue?
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSubscribe}>
                                    Continue
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <p className="mt-4 text-muted-foreground text-sm">
                        Rewards are only provided for actions taken within this app.
                    </p>
                </CardContent>
            </Card>
        </div>

        {currentUser && (
            <Card>
                <CardHeader>
                    <CardTitle>Daily Gift</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <p className="text-lg">YT kb bot</p>
                    
                    {isGiftClaimed ? (
                         <>
                            <PartyPopper className="w-20 h-20 text-muted-foreground opacity-50" />
                            <p className="text-lg font-bold">{countdown}</p>
                            <p className="text-sm text-muted-foreground">
                                You've claimed your gift! Come back later.
                            </p>
                         </>
                    ) : (
                        <>
                            <button onClick={handleClaimDailyGift} className="disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                                <Gift className="w-20 h-20 text-primary transition-transform hover:scale-110" />
                            </button>
                            <p className="text-sm text-muted-foreground">
                                Click the gift to get {DAILY_GIFT_AMOUNT} coins!
                            </p>
                        </>
                    )}

                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}

    