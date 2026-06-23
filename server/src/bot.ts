import { Bot, InlineKeyboard } from 'grammy';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from './config';
import { createProduct, UPLOAD_DIR } from './db';

type AddState = {
  step: 'photos' | 'title' | 'price' | 'description';
  photos: string[];
  title?: string;
  price?: number;
};

const addStates = new Map<number, AddState>();

function isAdmin(id?: number): boolean {
  return !!id && config.adminIds.includes(String(id));
}

async function downloadPhoto(bot: Bot, fileId: string): Promise<string> {
  const file = await bot.api.getFile(fileId);
  const res = await fetch(`https://api.telegram.org/file/bot${config.botToken}/${file.file_path}`);
  const buf = Buffer.from(await res.arrayBuffer());
  let ext = path.extname(file.file_path || '').toLowerCase();
  if (!ext) ext = '.jpg';
  const name = randomUUID() + ext;
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return '/uploads/' + name;
}

export function createBot(): Bot | null {
  if (!config.botToken) {
    console.warn('[bot] BOT_TOKEN не задан — бот выключен (веб-часть работает).');
    return null;
  }

  const bot = new Bot(config.botToken);

  bot.command('start', async (ctx) => {
    const kb = new InlineKeyboard();
    const hasButton = config.publicUrl.startsWith('https://');
    if (hasButton) {
      kb.webApp('🛍 Открыть каталог', config.publicUrl);
    }
    const text = hasButton
      ? `Добро пожаловать в *${config.brand}* ✨\nВещи из Турции и Китая.\n\nНажмите кнопку ниже, чтобы посмотреть каталог.`
      : `Добро пожаловать в *${config.brand}* ✨\nВещи из Турции и Китая.\n\nКаталог скоро откроется — мы заканчиваем настройку. Загляните чуть позже!`;
    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb });
  });

  bot.command('id', async (ctx) => {
    await ctx.reply(
      `Ваш Telegram ID: \`${ctx.from?.id}\`\nЧтобы стать администратором, добавьте этот ID в ADMIN_TELEGRAM_IDS.`,
      { parse_mode: 'Markdown' },
    );
  });

  bot.command('help', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    await ctx.reply(
      'Команды администратора:\n/add — добавить товар\n/cancel — отменить добавление',
    );
  });

  bot.command('add', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) return;
    addStates.set(ctx.from!.id, { step: 'photos', photos: [] });
    await ctx.reply('📷 Добавляем товар. Пришлите одно или несколько фото.\nКогда закончите — отправьте /done.');
  });

  bot.command('cancel', async (ctx) => {
    addStates.delete(ctx.from?.id ?? -1);
    await ctx.reply('Отменено.');
  });

  bot.command('done', async (ctx) => {
    const st = addStates.get(ctx.from?.id ?? -1);
    if (!st || !isAdmin(ctx.from?.id)) return;
    if (st.step !== 'photos') return;
    if (st.photos.length === 0) {
      await ctx.reply('Нужно хотя бы одно фото. Пришлите фото товара.');
      return;
    }
    st.step = 'title';
    await ctx.reply('Как называется товар?');
  });

  bot.on('message:photo', async (ctx) => {
    const st = addStates.get(ctx.from?.id ?? -1);
    if (!st || st.step !== 'photos' || !isAdmin(ctx.from?.id)) return;
    const best = ctx.message.photo[ctx.message.photo.length - 1];
    try {
      const url = await downloadPhoto(bot, best.file_id);
      st.photos.push(url);
      await ctx.reply(`Фото добавлено (${st.photos.length}). Ещё фото или /done.`);
    } catch (e) {
      await ctx.reply('Не удалось сохранить фото, попробуйте ещё раз.');
    }
  });

  bot.on('message:text', async (ctx) => {
    const st = addStates.get(ctx.from?.id ?? -1);
    if (!st || !isAdmin(ctx.from?.id)) return;
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;

    if (st.step === 'title') {
      st.title = text;
      st.step = 'price';
      await ctx.reply(`Цена в ${config.currency}? (только число, например 180)`);
    } else if (st.step === 'price') {
      const price = Number(text.replace(',', '.').replace(/[^\d.]/g, ''));
      if (!price || price <= 0) {
        await ctx.reply('Введите цену числом, например 180');
        return;
      }
      st.price = price;
      st.step = 'description';
      await ctx.reply('Короткое описание товара? (или отправьте «-», чтобы пропустить)');
    } else if (st.step === 'description') {
      const description = text === '-' ? '' : text;
      const p = createProduct({
        title: st.title,
        price: st.price,
        description,
        photos: st.photos,
        available: true,
      });
      addStates.delete(ctx.from!.id);
      await ctx.reply(
        `✅ Добавлено в каталог:\n*${p.title}* — ${p.price} ${config.currency}\nФото: ${p.photos.length} шт.`,
        { parse_mode: 'Markdown' },
      );
    }
  });

  bot.catch((err) => console.error('[bot] error:', err.message));
  bot.start({ onStart: (info) => console.log(`[bot] @${info.username} запущен`) });
  return bot;
}
