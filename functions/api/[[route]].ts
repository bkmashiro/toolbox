import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

import { hashRoutes } from './routes/hash';
import { encodingRoutes } from './routes/encoding';
import { timeRoutes } from './routes/time';
import { mathRoutes } from './routes/math';
import { networkRoutes } from './routes/network';
import { textRoutes } from './routes/text';

const app = new Hono().basePath('/api');

// CORS for cross-origin API usage
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Mount route groups
app.route('/', hashRoutes);
app.route('/', encodingRoutes);
app.route('/', timeRoutes);
app.route('/', mathRoutes);
app.route('/', networkRoutes);
app.route('/', textRoutes);

// Health check
app.get('/health', (c) => c.json({ ok: true, version: '1.0.0' }));

// 404 fallback
app.notFound((c) => c.json({ ok: false, error: 'Unknown API endpoint' }, 404));

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ ok: false, error: err.message || 'Internal error' }, 500);
});

export const onRequest = handle(app);
