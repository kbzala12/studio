
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ingestGithubRepo } from '@/ai/flows/ingest-github-repo';
import { Loader2, Rocket } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  repoUrl: z.string().url({ message: "Please enter a valid GitHub repository URL." }).regex(/^https:\/\/github\.com\/[^/]+\/[^/]+$/, 'Must be a valid public GitHub repository URL.'),
});

type UrlInputFormProps = {
  onIngestionSuccess: (url: string) => void;
};

export function UrlInputForm({ onIngestionSuccess }: UrlInputFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repoUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await ingestGithubRepo({ repoUrl: values.repoUrl });
      if (result.success) {
        toast({
          title: "Ingestion Successful",
          description: "You can now start asking questions about the repository.",
        });
        onIngestionSuccess(values.repoUrl);
      } else {
        toast({
          variant: "destructive",
          title: "Ingestion Failed",
          description: result.message,
        })
      }
    } catch (error) {
        toast({
          variant: "destructive",
          title: "An error occurred",
          description: "Failed to ingest the repository. Please try again.",
        })
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center p-4 md:p-6">
        <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 inline-flex">
            <Rocket className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-3xl md:text-4xl font-bold font-headline">CodePilot</CardTitle>
        <CardDescription className="text-md md:text-lg">
          Enter a public GitHub repository URL to start asking questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="repoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">GitHub Repository URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/user/repo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              {isLoading ? 'Ingesting Code...' : 'Start Querying'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
