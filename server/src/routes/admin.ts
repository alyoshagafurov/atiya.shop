import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  UPLOAD_DIR,
} from '../db';
import { checkPassword, makeToken, verifyToken } from '../auth';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export async function adminRoutes(app: FastifyInstance) {
  app.post('/api/admin/login', async (req, reply) => {
    const { password } = (req.body as { password?: string }) ?? {};
    if (!checkPassword(password)) return reply.code(401).send({ error: 'Неверный пароль' });
    return { token: makeToken() };
  });

  // Защита всех /api/admin/* кроме логина
  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith('/api/admin/') || req.url.startsWith('/api/admin/login')) return;
    const token = (req.headers['authorization'] ?? '').replace('Bearer ', '');
    if (!verifyToken(token)) return reply.code(401).send({ error: 'Не авторизован' });
  });

  app.get('/api/admin/products', async () => listProducts());

  app.post('/api/admin/products', async (req) => createProduct(req.body as any));

  app.put('/api/admin/products/:id', async (req, reply) => {
    const p = updateProduct((req.params as { id: string }).id, req.body as any);
    if (!p) return reply.code(404).send({ error: 'Товар не найден' });
    return p;
  });

  app.delete('/api/admin/products/:id', async (req) => ({
    ok: deleteProduct((req.params as { id: string }).id),
  }));

  app.post('/api/admin/upload', async (req) => {
    const urls: string[] = [];
    for await (const part of (req as any).parts()) {
      if (part.type !== 'file') continue;
      let ext = path.extname(part.filename || '').toLowerCase();
      if (!ALLOWED_EXT.has(ext)) ext = '.jpg';
      const name = randomUUID() + ext;
      await pipeline(part.file, createWriteStream(path.join(UPLOAD_DIR, name)));
      urls.push('/uploads/' + name);
    }
    return { urls };
  });
}
