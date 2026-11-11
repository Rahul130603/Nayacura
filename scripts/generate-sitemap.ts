import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { services, serviceCategories } from '../frontend/src/data/services';
import { articles } from '../frontend/src/data/articles';
import { legalPages } from '../frontend/src/data/legal';
import { demoDoctors } from '../frontend/src/data/doctors';

// Replace this domain with the production origin before launch.
const base = 'https://nayacura.example';
const now = new Date().toISOString().split('T')[0];

const staticPaths = [
  '/',
  '/about',
  '/services',
  '/doctors',
  '/journal',
  '/how-it-works',
  '/pricing',
  '/contact',
  '/ai',
];

const urls = [
  ...staticPaths.map((path) => ({ path, priority: path === '/' ? '1.0' : '0.8' })),
  ...serviceCategories.map((category) => ({
    path: `/services?category=${category.slug}`,
    priority: '0.6',
  })),
  ...services.map((service) => ({ path: `/services/${service.slug}`, priority: '0.7' })),
  ...demoDoctors.map((doctor) => ({ path: `/doctors/${doctor.slug}`, priority: '0.6' })),
  ...articles.map((article) => ({ path: `/journal/${article.slug}`, priority: '0.6' })),
  ...legalPages.map((page) => ({ path: `/legal/${page.slug}`, priority: '0.5' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${base}${item.path.replace(/&/g, '&amp;')}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${item.path === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${item.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(resolve(process.cwd(), 'frontend/public/sitemap.xml'), xml, 'utf8');
console.log(`Wrote ${urls.length} URLs to frontend/public/sitemap.xml`);
