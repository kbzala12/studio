
'use client';

import { Button } from '@/components/ui/button';
import { Flame, UserCircle, Video, PlusCircle, Youtube, ThumbsUp, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ShortsPage() {
    const router = useRouter();
    const shorts = [
        { id: 'oV8exPIMdSY', title: 'YouTube Short 1', channel: '@ShortsCreator1' },
        { id: 'QuAxFi9V7kg', title: 'YouTube Short 2', channel: '@ShortsCreator2' },
        { id: 'dVUy6aWYgHI', title: 'YouTube Short 3', channel: '@ShortsCreator3' },
        { id: 'DAcFJ-MmvhQ', title: 'YouTube Short 4', channel: '@ShortsCreator4' },
    ].map(s => ({...s, thumbnail: `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`}));

    const handleShortClick = (shortId: string, title: string, channel: string) => {
        const url = `/watch/${shortId}?title=${encodeURIComponent(title)}&channel=${encodeURIComponent(channel)}&isShort=true`;
        router.push(url);
    };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 bg-black">
        <div className="flex items-center gap-3">
          <Youtube className="w-8 h-8 text-red-500" />
          <h1 className="text-xl font-bold font-headline">Shorts</h1>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-6 h-6" />
        </Button>
      </header>
      
      <main className="flex-grow snap-y snap-mandatory overflow-y-scroll scrollbar-hide pb-14">
        {shorts.map((short, index) => (
          <div key={index} className="relative w-full h-full snap-start flex-shrink-0">
            <iframe
              src={`https://www.youtube.com/embed/${short.id}?autoplay=1&mute=1&loop=1&playlist=${short.id}&controls=0&showinfo=0&autohide=1&modestbranding=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full object-cover"
            ></iframe>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-end">
                <div className="flex-grow">
                  <h3 className="text-base font-semibold">{short.title}</h3>
                  <p className="text-sm text-gray-300">{short.channel}</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Button variant="ghost" size="icon" className="flex-col h-auto text-white">
                    <ThumbsUp className="w-6 h-6"/>
                    <span className="text-xs">1.2K</span>
                  </Button>
                   <Button variant="ghost" size="icon" className="flex-col h-auto text-white" onClick={() => handleShortClick(short.id, short.title, short.channel)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins w-6 h-6 text-yellow-400"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.76A6 6 0 1 1 10.76 3.91"/><path d="m16 6 3 3-6 6-3-3 6-6"/></svg>
                    <span className="text-xs">Earn</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="flex-col h-auto text-white">
                    <MessageCircle className="w-6 h-6"/>
                    <span className="text-xs">10</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="flex-col h-auto text-white">
                    <Share2 className="w-6 h-6"/>
                    <span className="text-xs">Share</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>

       <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-black">
        <div className="container mx-auto px-4">
          <div className="flex justify-around items-center h-14">
            <Link href="/">
              <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-zinc-800 hover:bg-zinc-700">
                <Video className="w-6 h-6" />
                <span className="text-xs">Video</span>
              </Button>
            </Link>
            <Link href="/shorts">
              <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-green-500 hover:bg-green-600">
                <Flame className="w-6 h-6" />
                <span className="text-xs">Shorts</span>
              </Button>
            </Link>
             <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-blue-500 hover:bg-blue-600">
                <PlusCircle className="w-8 h-8" />
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-yellow-500 hover:bg-yellow-600">
              <UserCircle className="w-6 h-6" />
              <span className="text-xs">Channel</span>
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2 text-white bg-purple-500 hover:bg-purple-600">
              <Upload className="w-6 h-6" />
              <span className="text-xs">Upload</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}
