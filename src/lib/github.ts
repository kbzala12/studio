'use server';

import { Octokit } from 'octokit';
import { z } from 'zod';

const GitHubUrlSchema = z.string().url().regex(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);

function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const validation = GitHubUrlSchema.safeParse(repoUrl);
    if (!validation.success) {
        throw new Error('Invalid GitHub repository URL format.');
    }
    const url = new URL(repoUrl);
    const [owner, repo] = url.pathname.slice(1).split('/');
    return { owner, repo };
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

type FileTree = {
    path: string;
    mode?: string;
    type?: string;
    sha?: string;
    size?: number;
    url?: string;
}[];

// Cache for file trees to avoid redundant API calls
const fileTreeCache = new Map<string, FileTree>();

export async function getRepoFileTree(repoUrl: string): Promise<FileTree> {
    if (fileTreeCache.has(repoUrl)) {
        return fileTreeCache.get(repoUrl)!;
    }

    const { owner, repo } = parseRepoUrl(repoUrl);

    try {
        const { data: mainBranch } = await octokit.rest.repos.get({ owner, repo });
        const defaultBranch = mainBranch.default_branch;

        const { data } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: defaultBranch,
            recursive: '1',
        });

        const files = data.tree.filter(item => item.type === 'blob' && item.path);
        fileTreeCache.set(repoUrl, files);

        return files;
    } catch (error: any) {
        if (error.status === 404) {
            throw new Error(`Repository not found at ${repoUrl}. Please check the URL.`);
        }
        if (error.status === 401 || error.status === 403) {
            throw new Error('Authentication with GitHub failed. Please check your GITHUB_TOKEN.');
        }
        console.error('Failed to fetch repository file tree:', error);
        throw new Error('Could not fetch repository file tree from GitHub.');
    }
}


// Cache for file contents
const fileContentCache = new Map<string, string>();
export async function getFileContent(repoUrl: string, path: string): Promise<string | null> {
    const cacheKey = `${repoUrl}::${path}`;
    if (fileContentCache.has(cacheKey)) {
        return fileContentCache.get(cacheKey)!;
    }
    
    const { owner, repo } = parseRepoUrl(repoUrl);

    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
        });

        if ('content' in data && data.encoding === 'base64') {
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            fileContentCache.set(cacheKey, content);
            return content;
        }

        return null;
    } catch (error) {
        console.error(`Failed to fetch content for ${path}:`, error);
        return null;
    }
}
