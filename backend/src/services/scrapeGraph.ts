import { z } from 'zod';
import { publicSourceUrl } from './aiKnowledge';

const scrapeResponse = z.object({
  results: z.object({ markdown: z.object({ data: z.tuple([z.string()]).rest(z.string()) }) }),
});

export async function scrapePublicPage(input: string, apiKey: string, allowedHosts: string[]) {
  const url = new URL(publicSourceUrl.parse(input));
  if (!allowedHosts.includes(url.hostname) || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(url.hostname) ||
      /\.(?:local|localhost|internal|test|invalid|example)$/i.test(url.hostname)) {
    throw new Error('Add the exact public host to SGAI_ALLOWED_HOSTS before importing it.');
  }
  if (!apiKey.trim()) throw new Error('Set SGAI_API_KEY in the backend environment.');

  const response = await fetch('https://v2-api.scrapegraphai.com/api/scrape', {
    method: 'POST',
    headers: { 'SGAI-APIKEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url.href, formats: [{ type: 'markdown', mode: 'reader' }], allowedTypes: ['text/html'] }),
    signal: AbortSignal.timeout(30_000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error(`ScrapeGraphAI returned HTTP ${response.status}.`);
  const parsed = scrapeResponse.safeParse(await response.json());
  if (!parsed.success) throw new Error('ScrapeGraphAI did not return Markdown.');
  const content = parsed.data.results.markdown.data.join('\n\n').trim();
  if (!content) throw new Error('ScrapeGraphAI returned an empty page.');
  return { url: url.href, content: content.slice(0, 24_000), fetchedAt: new Date().toISOString() };
}
