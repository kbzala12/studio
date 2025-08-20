'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Youtube } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const videos = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Sample Video Title ${i + 1}`,
    thumbnail: `https://placehold.co/600x400.png`,
    channel: `Channel ${i + 1}`,
    views: `${Math.floor(Math.random() * 100)}K views`,
    uploaded: `${Math.floor(Math.random() * 12) + 1} months ago`,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Youtube className="w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold font-headline text-red-500">My YouTube channel group 1k</h1>
        </div>
        <Button>
          <Upload className="mr-2" />
          Upload
        </Button>
      </header>

      <main className="flex-grow p-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <div key={video.id} className="group">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
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
                  <p className="mt-1 text-sm text-muted-foreground">{video.channel}</p>
                  <p className="text-sm text-muted-foreground">
                    {video.views} &bull; {video.uploaded}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
