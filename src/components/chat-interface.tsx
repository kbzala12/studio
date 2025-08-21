
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, Bot, User, Code } from 'lucide-react';
import { answerCodeQuestion } from '@/ai/flows/answer-code-question';
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
};

type ChatInterfaceProps = {
  repoUrl: string;
};

function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```[a-z]*\n|```$/g, '');
          return (
            <div key={index} className="relative my-2">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code className="font-code">{code}</code>
              </pre>
            </div>
          );
        }
        return <p key={index} className="whitespace-pre-wrap leading-relaxed">{part}</p>;
      })}
    </div>
  );
}


export function ChatInterface({ repoUrl }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const repoName = repoUrl.split('/').slice(-2).join('/');

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await answerCodeQuestion({ repoUrl, question: input });
      const botMessage: Message = { id: (Date.now() + 1).toString(), role: 'bot', content: result.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get an answer. Please try again.",
      });
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl h-[calc(100vh-4rem)] flex flex-col shadow-2xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="border-b">
        <div className="flex items-center gap-4">
            <Code className="w-8 h-8 text-primary" />
            <div>
                <CardTitle className="font-headline text-xl">CodePilot Q&A</CardTitle>
                <CardDescription>Asking questions about: <span className="font-medium text-primary">{repoName}</span></CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0 flex flex-col">
        <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'bot' && (
                  <Avatar className="h-9 w-9 border-2 border-primary/50">
                     <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg px-4 py-3 max-w-[85%] shadow-md ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <MarkdownContent content={message.content} />
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-secondary text-secondary-foreground"><User className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4">
                 <Avatar className="h-9 w-9 border-2 border-primary/50">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                <div className="rounded-lg px-4 py-3 bg-card shadow-md flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-4 bg-card/50">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., 'What is the purpose of the useToast hook?'"
              className="flex-grow resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
