import { Bot, InlineKeyboard } from 'grammy';
import { config } from './config';

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

  bot.catch((err) => console.error('[bot] error:', err.message));
  bot.start({ onStart: (info) => console.log(`[bot] @${info.username} запущен`) });
  return bot;
}
