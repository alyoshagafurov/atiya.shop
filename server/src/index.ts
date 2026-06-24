import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { config } from './config';
import { UPLOAD_DIR, DATA_DIR, DATA_DIR_IS_DEFAULT } from './db';
import { publicRoutes } from './routes/public';
import { adminRoutes } from './routes/admin';
import { createBot } from './bot';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });
  await app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024, files: 12 } });

  // Загруженные фото
  await app.register(fastifyStatic, {
    root: UPLOAD_DIR,
    prefix: '/uploads/',
    decorateReply: false,
  });

  await app.register(publicRoutes);
  await app.register(adminRoutes);

  // Собранное веб-приложение (если есть)
  const webDist = path.resolve(__dirname, '..', '..', 'web', 'dist');
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist, prefix: '/' });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
        return reply.code(404).send({ error: 'Не найдено' });
      }
      return reply.sendFile('index.html');
    });
  }

  createBot();

  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(
    `[server] http://localhost:${config.port}  бренд: ${config.brand}, валюта: ${config.currency}`,
  );
  console.log(`[server] данные хранятся в: ${DATA_DIR}`);
  if (DATA_DIR_IS_DEFAULT) {
    console.warn(
      '[server] ВНИМАНИЕ: DATA_DIR не задан — база лежит внутри контейнера и СТИРАЕТСЯ при каждом деплое. ' +
        'На Railway подключите Volume и укажите DATA_DIR на путь его монтирования (например /data).',
    );
  }
  if (!config.whatsappNumber) {
    console.warn('[server] WHATSAPP_NUMBER не задан — кнопка «Заказать» не сработает, пока не укажете номер в .env');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
