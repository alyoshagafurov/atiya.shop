import type { FastifyInstance } from 'fastify';
import { listProducts, getProduct, listCategories } from '../db';
import { config } from '../config';

export async function publicRoutes(app: FastifyInstance) {
  app.get('/api/config', async () => ({
    brand: config.brand,
    currency: config.currency,
    whatsapp: config.whatsappNumber,
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
