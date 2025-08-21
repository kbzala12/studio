
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Shield, CheckCircle, XCircle, Users, Coins } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const ADMIN_USERNAME = 'Zala kb 101';

type SubmittedVideo = {
    url: string;
    submittedBy: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
};

type UserData = {
    name: string;
    coins: number;
};

export default function AdminPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{name: string} | null>(null);
    const [submittedVideos, setSubmittedVideos] = useState<SubmittedVideo[]>([]);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
            const user = JSON.parse(loggedInUser);
            setCurrentUser(user);
            if (user.name.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
                setIsAuthorized(true);
                loadSubmittedVideos();
                loadAllUsersData();
            }
        }
        setIsLoading(false);
    }, []);

    const loadSubmittedVideos = () => {
        const videos = JSON.parse(localStorage.getItem('submittedVideos') || '[]');
        setSubmittedVideos(videos);
    };
    
    const loadAllUsersData = () => {
        const users: UserData[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('user_') && key.substring(5).toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
                const userName = key.substring(5);
                const userCoins = localStorage.getItem(`userCoins_${userName}`);
                users.push({
                    name: userName,
                    coins: userCoins ? parseInt(userCoins, 10) : 0,
                });
            }
        }
        setAllUsers(users);
    };

    const handleVideoStatusChange = (videoUrl: string, newStatus: 'approved' | 'rejected') => {
        const updatedVideos = submittedVideos.map(video => 
            video.url === videoUrl ? { ...video, status: newStatus } : video
        );
        
        if (newStatus === 'approved') {
            const videoToApprove = submittedVideos.find(v => v.url === videoUrl);
            if (videoToApprove) {
                console.log(`Video ${videoUrl} approved. Add it to the main list.`);
            }
        }
        
        localStorage.setItem('submittedVideos', JSON.stringify(updatedVideos));
        setSubmittedVideos(updatedVideos);

        toast({
            title: `Video ${newStatus}`,
            description: `The video has been successfully ${newStatus}.`,
        });
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


    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!isAuthorized) {
        return (
            <div className="flex flex-col min-h-screen bg-background text-foreground">
                <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm md:px-6">
                     <div className="flex items-center gap-4">
                        <Link href="/" passHref>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                    </div>
                </header>
                <main className="flex-grow flex items-center justify-center p-4 text-center">
                    <Card className="p-8">
                        <Shield className="w-16 h-16 mx-auto text-destructive" />
                        <h2 className="mt-4 text-2xl font-bold">Access Denied</h2>
                        <p className="text-muted-foreground">You do not have permission to view this page.</p>
                        <Button className="mt-6" onClick={() => router.push('/')}>Go to Homepage</Button>
                    </Card>
                </main>
            </div>
        );
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
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                </div>
                <Badge variant="secondary">Welcome, {currentUser?.name}</Badge>
            </header>
            <main className="flex-grow p-4 md:p-6 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> All Users</CardTitle>
                        <CardDescription>View all registered users and their coin balances.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                           {allUsers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No other users found.</p>
                           ) : (
                                <div className="divide-y divide-border rounded-lg border">
                                {allUsers.map((user, index) => (
                                    <div key={index} className="flex items-center justify-between p-3">
                                        <span className="font-medium truncate">{user.name}</span>
                                        <div className="flex items-center gap-2">
                                            <Coins className="w-5 h-5 text-yellow-500" />
                                            <span className="font-semibold">{user.coins}</span>
                                        </div>
                                    </div>
                                ))}
                                </div>
                           )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Submitted Videos</CardTitle>
                        <CardDescription>Review and approve or reject user-submitted videos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-6">
                            {submittedVideos.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No videos have been submitted yet.</p>
                            ) : (
                                submittedVideos.map((video, index) => {
                                    const videoId = getYoutubeVideoId(video.url);
                                    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://placehold.co/120x90.png';

                                    return (
                                        <div key={index}>
                                            <div className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-lg bg-muted/50">
                                                <Image 
                                                    src={thumbnailUrl} 
                                                    alt="Video thumbnail"
                                                    width={120}
                                                    height={90}
                                                    className="rounded-md object-cover flex-shrink-0"
                                                />
                                                <div className="flex-grow text-center md:text-left">
                                                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline break-all">{video.url}</a>
                                                    <p className="text-sm text-muted-foreground">
                                                        Submitted by: <span className="font-medium">{video.submittedBy}</span> on {new Date(video.submittedAt).toLocaleDateString()}
                                                    </p>
                                                     <Badge 
                                                        variant={video.status === 'approved' ? 'default' : video.status === 'rejected' ? 'destructive' : 'secondary'}
                                                        className="mt-2"
                                                    >
                                                        {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                                    {video.status === 'pending' && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleVideoStatusChange(video.url, 'approved')}>
                                                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleVideoStatusChange(video.url, 'rejected')}>
                                                                <XCircle className="mr-2 h-4 w-4" /> Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                     {video.status !== 'pending' && (
                                                        <Button size="sm" variant="ghost" disabled>Action Taken</Button>
                                                     )}
                                                </div>
                                            </div>
                                            {index < submittedVideos.length - 1 && <Separator className="my-2" />}
                                        </div>
                                    )
                                })
                            )}
                       </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
