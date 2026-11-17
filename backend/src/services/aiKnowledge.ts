import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { logger } from '../utils/logger';

export const publicSourceUrl = z.string().url().max(1000).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash;
  } catch {
    return false;
  }
}, 'Use a public HTTPS URL without credentials or query parameters.');

const knowledgeSchema = z.array(z.object({
  title: z.string().trim().min(1).max(150),
  url: publicSourceUrl,
  content: z.string().trim().min(1).max(1800),
  keywords: z.array(z.string().trim().min(2).max(100)).min(1).max(25),
})).max(100);

export type KnowledgeSource = z.infer<typeof knowledgeSchema>[number];

function tokens(text: string) {
  return text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu)?.join(' ') ?? '';
}

export async function retrieveKnowledge(file: string | undefined, message: string): Promise<KnowledgeSource[]> {
  if (!file) return [];
  try {
    const sources = knowledgeSchema.parse(JSON.parse(await readFile(file, 'utf8')));
    const normalized = ` ${tokens(message)} `;
    return sources.map((source) => ({
      source,
      score: new Set(source.keywords.map(tokens).filter((keyword) => keyword && normalized.includes(` ${keyword} `))).size,
    }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(({ source }) => source);
  } catch {
    logger.warn('AI reviewed knowledge file could not be loaded');
    return [];
  }
}
