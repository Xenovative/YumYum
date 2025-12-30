import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import barsRoutes from './routes/bars.js';
import passesRoutes from './routes/passes.js';
import partiesRoutes from './routes/parties.js';
import adminRoutes from './routes/admin.js';
import barPortalRoutes from './routes/barPortal.js';
import { query } from './db/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/bars', barsRoutes);
app.use('/api/passes', passesRoutes);
app.use('/api/parties', partiesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bar-portal', barPortalRoutes);

// SEO surface: robots.txt
app.get('/robots.txt', (req, res) => {
  const host = process.env.SITE_URL || process.env.VERCEL_URL || `http://localhost:${PORT}`;
  res.type('text/plain').send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /bar-portal
Sitemap: ${host.replace(/\/$/, '')}/sitemap.xml`
  );
});

// SEO surface: sitemap.xml (basic)
app.get('/sitemap.xml', async (req, res) => {
  const host = (process.env.SITE_URL || process.env.VERCEL_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
  const staticPaths = ['/', '/districts', '/parties', '/help', '/history', '/settings', '/login', '/register'];
  const urls: string[] = staticPaths.map((p) => `${host}${p}`);

  try {
    const barsResult = await query('SELECT id FROM bars LIMIT 200');
    const partiesResult = await query('SELECT id FROM parties WHERE status = $1 LIMIT 200', ['open']);
    urls.push(...barsResult.rows.map((r: any) => `${host}/bar/${r.id}`));
    urls.push(...partiesResult.rows.map((r: any) => `${host}/party/${r.id}`));
  } catch (err) {
    console.error('Sitemap dynamic fetch failed:', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 OneNightDrink API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
