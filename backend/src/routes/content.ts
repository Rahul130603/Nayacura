import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/http';
import { NotFoundError } from '../utils/errors';
import { serializeArticle } from '../services/serializers';

export const contentRouter = Router();

contentRouter.get(
  '/services',
  asyncHandler(async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const [categories, services] = await Promise.all([
      prisma.serviceCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { services: { where: { active: true } } } } },
      }),
      prisma.service.findMany({
        where: {
          active: true,
          ...(category ? { category: { slug: category } } : {}),
        },
        include: { category: true },
        orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      }),
    ]);
    res.json({
      categories: categories.map((item) => ({
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        serviceCount: item._count.services,
      })),
      services: services.map((service) => ({
        slug: service.slug,
        name: service.name,
        summary: service.summary,
        categorySlug: service.category.slug,
        categoryName: service.category.name,
        featured: service.featured,
      })),
    });
  }),
);

contentRouter.get(
  '/services/:slug',
  asyncHandler(async (req, res) => {
    const service = await prisma.service.findFirst({
      where: { slug: req.params.slug, active: true },
      include: { category: true },
    });
    if (!service) throw new NotFoundError('That service page could not be found.');
    res.json({
      service: {
        slug: service.slug,
        name: service.name,
        summary: service.summary,
        categorySlug: service.category.slug,
        categoryName: service.category.name,
        featured: service.featured,
      },
    });
  }),
);

contentRouter.get(
  '/plans',
  asyncHandler(async (_req, res) => {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({
      plans: plans.map((plan) => ({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        pricePaise: plan.pricePaise,
        taxPercent: plan.taxPercent,
        duration: plan.duration,
        includes: JSON.parse(plan.includes),
        mode: plan.mode,
        popular: plan.popular,
      })),
      taxNote:
        'Demo tax configuration only. Applicable GST treatment of healthcare services must be confirmed by a qualified Indian tax adviser before launch.',
    });
  }),
);

contentRouter.get(
  '/articles',
  asyncHandler(async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit = Math.min(Number(req.query.limit) || 50, 50);
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        ...(category && category !== 'all' ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { excerpt: { contains: search } },
                { content: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    res.json({
      articles: articles.map(serializeArticle),
      categories: Array.from(
        new Set(articles.map((article) => JSON.stringify([article.category, article.categoryName]))),
      ).map((item) => {
        const [slug, name] = JSON.parse(item);
        return { slug, name };
      }),
    });
  }),
);

contentRouter.get(
  '/articles/:slug',
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findFirst({
      where: { slug: req.params.slug, status: 'PUBLISHED' },
    });
    if (!article) throw new NotFoundError('That article could not be found.');
    const related = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        category: article.category,
        slug: { not: article.slug },
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    });
    res.json({
      article: serializeArticle(article),
      related: related.map(serializeArticle),
    });
  }),
);

contentRouter.get(
  '/config/public',
  asyncHandler(async (_req, res) => {
    res.json({
      demoMode: process.env.DEMO_MODE !== 'false',
      payment: {
        razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        mode:
          process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.DEMO_MODE === 'false'
            ? 'razorpay'
            : 'demo',
      },
      video: {
        livekitConfigured: Boolean(
          process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET,
        ),
      },
      ai: {
        configured: Boolean(process.env.LLM_API_KEY),
        mode: process.env.LLM_API_KEY ? 'llm' : 'demo-fallback',
      },
      taxPercent: Number(process.env.TAX_PERCENT || 18),
      supportHours: 'Mon–Sat, 09:00–19:00 IST (illustrative; no live desk in demo)',
    });
  }),
);
