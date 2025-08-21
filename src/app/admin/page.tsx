
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type SubmittedVideo = {
    id: number;
    url: string;
    submittedBy: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
};

// Admin specific data fetching
async function getAdminData() {
    const response = await fetch('/api/admin/data');
    if (!response.ok) {
        throw new Error('Failed to fetch admin data');
    }
    return response.json();
}

async function updateVideoStatus(videoId: number, status: 'approved' | 'rejected') {
    const response = await fetch('/api/admin/update-video-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, status }),
    });
    if (!response.ok) {
        throw new Error('Failed to update video status');
    }
    return response.json();
}

export default function AdminPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [submittedVideos, setSubmittedVideos] = useState<SubmittedVideo[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchAdminData();
    }, []);
    
    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const { videos } = await getAdminData();
            setSubmittedVideos(videos);
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch admin data.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleVideoStatusChange = async (videoId: number, newStatus: 'approved' | 'rejected') => {
        const originalVideos = submittedVideos;
        const updated = submittedVideos.map(video => 
            video.id === videoId ? { ...video, status: newStatus } : video
        );
        setSubmittedVideos(updated);

        try {
            await updateVideoStatus(videoId, newStatus);
            toast({
                title: `Video ${newStatus}`,
                description: `The video has been successfully ${newStatus}.`,
            });
        } catch (error) {
            setSubmittedVideos(originalVideos);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update video status.'
            });
        }
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
            <main className="flex-grow p-4 md:p-6 space-y-6">
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
                                        <div key={video.id}>
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
                                                        Submitted on {new Date(video.submittedAt).toLocaleDateString()}
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
                                                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleVideoStatusChange(video.id, 'approved')}>
                                                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleVideoStatusChange(video.id, 'rejected')}>
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
