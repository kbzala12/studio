
'use client';

import { useState } from 'react';
import { UrlInputForm } from '@/components/url-input-form';
import { ChatInterface } from '@/components/chat-interface';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  const handleIngestionSuccess = (url: string) => {
    setRepoUrl(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 md:p-6">
      {!repoUrl ? (
        <UrlInputForm onIngestionSuccess={handleIngestionSuccess} />
      ) : (
        <ChatInterface repoUrl={repoUrl} />
      )}
    </div>
  );
}
