'use server';

/**
 * @fileOverview This file defines a Genkit tool for finding relevant files in a GitHub repository.
 * 
 * - findRelevantFiles - A tool that identifies files in a repo relevant to a given question.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getRepoFileTree, getFileContent } from '@/lib/github';


// List of common keywords often found in programming questions.
const QUESTION_KEYWORDS = [
    'how', 'what', 'where', 'when', 'why', 'who', 'which',
    'function', 'class', 'method', 'variable', 'component', 'style',
    'error', 'bug', 'fix', 'issue', 'problem', 'resolve', 'debug',
    'implement', 'add', 'create', 'make', 'build', 'develop',
    'change', 'update', 'modify', 'refactor', 'improve',
    'style', 'css', 'tailwind', 'layout', 'design', 'ui', 'ux',
    'api', 'route', 'endpoint', 'server', 'client', 'database',
    'auth', 'user', 'login', 'register', 'password',
    'config', 'setting', 'env', 'secret',
    'test', 'spec', 'assert', 'mock', 'storybook',
    'hook', 'state', 'props', 'context', 'reducer'
];


// Heuristic to extract keywords from a question
function extractKeywords(question: string): string[] {
    const questionWords = question.toLowerCase().replace(/[?,.]/g, '').split(/\s+/);
    const keywords = questionWords.filter(word => !QUESTION_KEYWORDS.includes(word));
    // Add some context by including words that might be file names or variable names
    const potentialIdentifiers = question.match(/`([^`]+)`/g)?.map(s => s.replace(/`/g, '')) || [];
    return [...new Set([...keywords, ...potentialIdentifiers])];
}

// Ignore common, non-source files
const IGNORED_PATTERNS = [
    /^\.DS_Store$/,
    /^node_modules\//,
    /^\.git\//,
    /^dist\//,
    /^build\//,
    /^\.next\//,
    /^\.vscode\//,
    /^yarn\.lock$/,
    /^package-lock\.json$/,
    /\.(jpg|jpeg|png|gif|svg|ico|webp)$/,
    /\.(mp4|webm|ogg)$/,
    /\.(woff|woff2|eot|ttf|otf)$/,
];

function isRelevant(path: string, keywords: string[]): boolean {
    if (IGNORED_PATTERNS.some(pattern => pattern.test(path))) {
        return false;
    }
    const lowerPath = path.toLowerCase();
    return keywords.some(keyword => lowerPath.includes(keyword.toLowerCase()));
}


export const findRelevantFiles = ai.defineTool(
    {
      name: 'findRelevantFiles',
      description: 'Finds files in a GitHub repository that are relevant to the user\'s question. Use this to get a list of files to read to answer a question.',
      inputSchema: z.object({
        repoUrl: z.string().describe('The URL of the GitHub repository.'),
        question: z.string().describe('The question about the code.'),
      }),
      outputSchema: z.object({
        files: z.array(z.string()).describe('A list of file paths relevant to the question.'),
      }),
    },
    async ({ repoUrl, question }) => {
        try {
            console.log(`Finding relevant files for question "${question}" in repo ${repoUrl}`);

            const allFiles = await getRepoFileTree(repoUrl);
            const keywords = extractKeywords(question);
            
            if (keywords.length === 0) {
                 console.log("No specific keywords found, returning a small subset of common files.");
                 const commonFiles = ['package.json', 'README.md', 'src/app/page.tsx', 'src/app/layout.tsx'];
                 const existingCommonFiles = commonFiles.filter(file => allFiles.some(f => f.path === file));
                 return { files: existingCommonFiles.slice(0, 5) };
            }
            
            console.log("Using keywords:", keywords);

            const relevantFiles = allFiles.filter(file => isRelevant(file.path, keywords)).map(file => file.path);
            
            // Further refine by checking content for keywords if too many files are found
            if (relevantFiles.length > 10) {
                const scoredFiles: { path: string; score: number }[] = [];
                for (const filePath of relevantFiles) {
                    try {
                        const content = await getFileContent(repoUrl, filePath);
                        if (content) {
                            let score = 0;
                            const lowerContent = content.toLowerCase();
                            for (const keyword of keywords) {
                                if (lowerContent.includes(keyword.toLowerCase())) {
                                    score++;
                                }
                            }
                            if (score > 0) {
                                scoredFiles.push({ path: filePath, score });
                            }
                        }
                    } catch (e) {
                         console.warn(`Could not read content of ${filePath}, skipping content scan.`);
                         // Keep the file based on path relevance if content read fails
                         scoredFiles.push({ path: filePath, score: 1 });
                    }
                }
                 // Sort by score and take the top 5
                 const topFiles = scoredFiles.sort((a, b) => b.score - a.score).slice(0, 5).map(f => f.path);
                 console.log(`Found ${relevantFiles.length} files by path, returning top 5 by content:`, topFiles);
                 return { files: topFiles };
            }

            console.log(`Found ${relevantFiles.length} relevant files:`, relevantFiles);
            return { files: relevantFiles.slice(0, 10) }; // Limit to 10 files max

        } catch (error: any) {
            console.error('Error in findRelevantFiles:', error);
            // In case of an error (e.g., private repo, invalid URL), return an empty list.
            return { files: [] };
        }
    }
);
