'use server';
/**
 * @fileOverview Ingests a GitHub repository's code for querying.
 *
 * - ingestGithubRepo - A function that ingests the code from a GitHub repository.
 * - IngestGithubRepoInput - The input type for the ingestGithubRepo function.
 * - IngestGithubRepoOutput - The return type for the ingestGithubRepo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IngestGithubRepoInputSchema = z.object({
  repoUrl: z.string().describe('The URL of the public GitHub repository.'),
});
export type IngestGithubRepoInput = z.infer<typeof IngestGithubRepoInputSchema>;

const IngestGithubRepoOutputSchema = z.object({
  success: z.boolean().describe('Whether the repository was successfully ingested.'),
  message: z.string().describe('A message indicating the status of the ingestion.'),
});
export type IngestGithubRepoOutput = z.infer<typeof IngestGithubRepoOutputSchema>;

export async function ingestGithubRepo(input: IngestGithubRepoInput): Promise<IngestGithubRepoOutput> {
  return ingestGithubRepoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ingestGithubRepoPrompt',
  input: {schema: IngestGithubRepoInputSchema},
  output: {schema: IngestGithubRepoOutputSchema},
  prompt: `You are a code ingestion expert.  Your job is to take a github repo URL and ingest it so it can be queried. Return success true if the repo was successfully ingested, and false otherwise. Include a message indicating the status of the ingestion.

Github Repo URL: {{{repoUrl}}}`,
});

const ingestGithubRepoFlow = ai.defineFlow(
  {
    name: 'ingestGithubRepoFlow',
    inputSchema: IngestGithubRepoInputSchema,
    outputSchema: IngestGithubRepoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
