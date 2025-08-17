'use client';

import { useState } from 'react';
import { UrlInputForm } from '@/components/url-input-form';
import { ChatInterface } from '@/components/chat-interface';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isIngested, setIsIngested] = useState(false);

  const handleIngestionSuccess = (url: string) => {
    setRepoUrl(url);
    setIsIngested(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-grid-white/[0.05] bg-grid-black/[0.02] relative">
       <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-background bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <main className="flex-grow flex flex-col items-center justify-center p-4 z-10">
        {!isIngested ? (
          <UrlInputForm onIngestionSuccess={handleIngestionSuccess} />
        ) : (
          <ChatInterface repoUrl={repoUrl} />
        )}
      </main>
    </div>
  );
}
