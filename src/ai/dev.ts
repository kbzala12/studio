import { config } from 'dotenv';
config();

import '@/ai/flows/ingest-github-repo.ts';
import '@/ai/flows/answer-code-question.ts';
import '@/ai/tools/find-relevant-files.ts';
