
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

async function verifyTelegramAuth(initData: string) {
  const response = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(errorResult.message || 'Telegram authentication failed.');
  }
  return response.json();
}

export default function TelegramAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Authenticating...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initData = (window as any).Telegram?.WebApp?.initData;

    if (!initData) {
      setError('Telegram initialization data not found. Please open this page through the Telegram app.');
      return;
    }

    verifyTelegramAuth(initData)
      .then(() => {
        setStatus('Authentication successful! Redirecting...');
        // Redirect to home page after successful login
        // A page refresh is needed to make sure the new session is picked up
        window.location.href = '/';
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setStatus('Authentication Failed');
      });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-bold mb-2">{status}</h1>
      {error && <p className="text-destructive max-w-sm text-center">{error}</p>}
      {!error && <p className="text-muted-foreground">Please wait, you are being securely logged in.</p>}
    </div>
  );
}
