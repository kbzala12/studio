'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, UserCircle, Video, PlusCircle, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ShortsPage() {
  const shorts = [
    { id: 'oV8exPIMdSY', title: 'YouTube Short 1' },
    { id: 'QuAxFi9V7kg', title: 'YouTube Short 2' },
    { id: 'dVUy6aWYgHI', title: 'YouTube Short 3' },
    { id: 'Dacfj-mmvhE', title: 'YouTube Short 4' }, // Assuming the last part was incomplete and added E
  ].map(s => ({...s, thumbnail: `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`}));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Youtube className="w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold font-headline text-red-500">my KB YT bot - Shorts</h1>
        </div>
      </header>
      
      <main className="flex-grow p-6 pb-24">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shorts.map((short) => (
            <Link 
              href={`/watch/${short.id}?title=${encodeURIComponent(short.title)}&channel=Shorts&views=&uploaded=`}
              key={short.id} 
              className="group"
            >
              <div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-[9/16]">
                      <Image
                        src={short.thumbnail}
                        alt={short.title}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint="youtube short"
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="pt-2">
                  <h3 className="text-sm font-semibold leading-tight">{short.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

       <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-around items-center">
            <Link href="/">
              <Button variant="outline" className="flex-col h-auto py-2 bg-white text-black hover:bg-gray-100">
                <Video className="w-6 h-6" />
                <span className="text-xs">Video</span>
              </Button>
            </Link>
            <Link href="/shorts">
              <Button variant="outline" className="flex-col h-auto py-2 bg-white text-black hover:bg-gray-100">
                <Flame className="w-6 h-6" />
                <span className="text-xs">Shorts</span>
              </Button>
            </Link>
            <Button variant="outline" className="flex-col h-auto py-2 bg-white text-black hover:bg-gray-100">
              <UserCircle className="w-6 h-6" />
              <span className="text-xs">Channel</span>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-2 bg-white text-black hover:bg-gray-100">
              <PlusCircle className="w-6 h-6" />
              <span className="text-xs">Upload</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}
