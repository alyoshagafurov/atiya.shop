import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  UPLOAD_DIR,
} from '../db';
import { checkPassword, makeToken, verifyToken } from '../auth';

// Максимальный размер по большей стороне и качество JPEG для загружаемых фото.
const MAX_SIDE = 1280;
const JPEG_QUALITY = 80;

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
      const input = await part.toBuffer();
      const name = randomUUID() + '.jpg';
      try {
        // Поворот по EXIF, ужимаем в рамку MAX_SIDE и сжимаем в JPEG.
        await sharp(input)
          .rotate()
          .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
          .toFile(path.join(UPLOAD_DIR, name));
        urls.push('/uploads/' + name);
      } catch {
        // Не изображение или повреждено — пропускаем файл.
      }
    }
    return { urls };
  });
}
