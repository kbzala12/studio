
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Youtube, Video, Flame, UserCircle, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ShortsPage() {
    const shorts = [
        { id: 'oV8exPIMdSY', title: 'YouTube Short 1', channel: '@ShortsCreator1' },
        { id: 'QuAxFi9V7kg', title: 'YouTube Short 2', channel: '@ShortsCreator2' },
        { id: 'dVUy6aWYgHI', title: 'YouTube Short 3', channel: '@ShortsCreator3' },
        { id: 'DAcFJ-MmvhQ', title: 'YouTube Short 4', channel: '@ShortsCreator4' },
    ].map(s => ({...s, thumbnail: `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`, views: '10K views', uploaded: '1 day ago'}));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Youtube className="w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold font-headline text-red-500">my KB YT bot</h1>
        </div>
      </header>
      
      <main className="flex-grow p-6 pb-24">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shorts.map((short) => (
            <Link 
              href={`/watch/${short.id}?title=${encodeURIComponent(short.title)}&channel=${encodeURIComponent(short.channel)}&views=${encodeURIComponent(short.views)}&uploaded=${encodeURIComponent(short.uploaded)}&isShort=true`}
              key={short.id} 
              className="group"
            >
              <div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-video">
                      <Image
                        src={short.thumbnail}
                        alt={short.title}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint="youtube short thumbnail"
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-4 pt-3">
                  <div className="flex-shrink-0">
                     <Image src="https://placehold.co/48x48.png" alt="channel avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-semibold leading-tight">{short.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{short.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      {short.views} &bull; {short.uploaded}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
