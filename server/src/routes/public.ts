import type { FastifyInstance } from 'fastify';
import { listProducts, getProduct, listCategories, DATA_IS_PERSISTENT } from '../db';
import { config } from '../config';

export async function publicRoutes(app: FastifyInstance) {
  app.get('/api/config', async () => ({
    brand: config.brand,
    currency: config.currency,
    whatsapp: config.whatsappNumber,
  }));

  // Диагностика хранилища: persistent=true → данные на Volume и переживают деплой
  app.get('/api/health', async () => ({
    ok: true,
    persistent: DATA_IS_PERSISTENT,
    products: listProducts().length,
  }));

  app.get('/api/products', async (req) => {
    const { category, q } = req.query as { category?: string; q?: string };
    return listProducts({ category, q, onlyAvailable: true });
  });

  app.get('/api/products/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const p = getProduct(id);
    if (!p || !p.available) return reply.code(404).send({ error: 'Товар не найден' });
    return p;
  });

  app.get('/api/categories', async () => listCategories());
}
