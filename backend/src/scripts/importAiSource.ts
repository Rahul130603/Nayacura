import { writeFile } from 'node:fs/promises';
import { env } from '../config/env';
import { scrapePublicPage } from '../services/scrapeGraph';

async function main() {
  const url = process.argv[2];
  if (!url) throw new Error('Usage: npm run ai:import -w backend -- https://public-host/page');
  const output = `naya-source-${Date.now()}.candidate.json`;
  const hosts = (env.SGAI_ALLOWED_HOSTS ?? '').split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
  const page = await scrapePublicPage(url, env.SGAI_API_KEY ?? '', hosts);
  await writeFile(output, JSON.stringify(page, null, 2) + '\n', { flag: 'wx' });
  console.log(`Wrote ${output} for review. Naya reads only the separately configured reviewed knowledge file.`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Source import failed.');
  process.exitCode = 1;
});
