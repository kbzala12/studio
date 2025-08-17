'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering questions about code in a GitHub repository.
 *
 * - answerCodeQuestion - A function that handles the process of answering questions about code.
 * - AnswerCodeQuestionInput - The input type for the answerCodeQuestion function.
 * - AnswerCodeQuestionOutput - The return type for the answerCodeQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {findRelevantFiles} from '@/ai/tools/find-relevant-files';

const AnswerCodeQuestionInputSchema = z.object({
  repoUrl: z.string().describe('The URL of the GitHub repository.'),
  question: z.string().describe('The question about the code.'),
});
export type AnswerCodeQuestionInput = z.infer<typeof AnswerCodeQuestionInputSchema>;

const AnswerCodeQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type AnswerCodeQuestionOutput = z.infer<typeof AnswerCodeQuestionOutputSchema>;

export async function answerCodeQuestion(input: AnswerCodeQuestionInput): Promise<AnswerCodeQuestionOutput> {
  return answerCodeQuestionFlow(input);
}

const answerCodeQuestionPrompt = ai.definePrompt({
  name: 'answerCodeQuestionPrompt',
  input: {schema: AnswerCodeQuestionInputSchema},
  output: {schema: AnswerCodeQuestionOutputSchema},
  tools: [findRelevantFiles],
  prompt: `You are a bot that answers questions about code in a GitHub repository.

The repository URL is: {{{repoUrl}}}

The user is asking the following question: {{{question}}}

You can use the findRelevantFiles tool to identify the files that are relevant to answering the question.

Answer the question:
`,
});

const answerCodeQuestionFlow = ai.defineFlow(
  {
    name: 'answerCodeQuestionFlow',
    inputSchema: AnswerCodeQuestionInputSchema,
    outputSchema: AnswerCodeQuestionOutputSchema,
  },
  async input => {
    const {output} = await answerCodeQuestionPrompt(input);
    return output!;
  }
);
