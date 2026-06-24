import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  botToken: process.env.BOT_TOKEN?.trim() ?? '',
  adminIds: (process.env.ADMIN_TELEGRAM_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  adminPassword: process.env.ADMIN_PASSWORD ?? 'atiya',
  whatsappNumber: (process.env.WHATSAPP_NUMBER ?? '').replace(/[^\d]/g, ''),
  publicUrl: (process.env.PUBLIC_URL ?? '').trim().replace(/\/$/, ''),
  brand: process.env.BRAND_NAME ?? 'Turkiya TJ',
  currency: process.env.CURRENCY ?? 'смн',
};
