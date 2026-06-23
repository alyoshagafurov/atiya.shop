// Демо-данные для витрины Atiya. Запуск: node scripts/seed.mjs
// Требует запущенный сервер (npm start) и пароль админки (ADMIN_PASSWORD, по умолчанию atiya).
const BASE = process.env.BASE || 'http://localhost:3000';
const PASSWORD = process.env.ADMIN_PASSWORD || 'atiya';

function photo(title, bg, fg, sub) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='660'>
  <rect width='600' height='660' fill='${bg}'/>
  <text x='300' y='320' font-family='Georgia, serif' font-size='40' fill='${fg}' text-anchor='middle'>${title}</text>
  <text x='300' y='362' font-family='Georgia, serif' font-size='20' fill='${fg}' opacity='0.7' text-anchor='middle'>${sub}</text>
</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const demo = [
  { title: 'Полотенце махровое', price: 65, category: 'Для дома', description: 'Турция · 100% хлопок · 70×140 см\nМягкое, хорошо впитывает.',
    photos: [photo('Полотенце', '#EADBC8', '#7a5b3a', 'хлопок'), photo('Полотенце', '#E3D2BC', '#7a5b3a', 'Турция')] },
  { title: 'Набор полотенец 3 шт', price: 180, category: 'Для дома', description: 'Турция · подарочный набор\nЛицо, руки, баня.',
    photos: [photo('Набор 3 шт', '#DCE5DA', '#3b5b40', 'набор')] },
  { title: 'Платье летнее', price: 240, category: 'Одежда', description: 'Турция · размеры S–L · вискоза\nЛёгкое, на каждый день.',
    photos: [photo('Платье', '#E7D8DE', '#6b3550', 'Турция'), photo('Платье', '#EFE0E6', '#6b3550', 'вискоза')] },
  { title: 'Сумка кожаная', price: 420, category: 'Сумки', description: 'Эко-кожа · вместительная\nЦвет: капучино.',
    photos: [photo('Сумка', '#D8CFC4', '#5a4a36', 'кожа')] },
  { title: 'Кроссовки', price: 350, category: 'Обувь', description: 'Китай · размеры 36–41\nЛёгкие, дышащие.',
    photos: [photo('Кроссовки', '#D8E0E7', '#37506b', 'Китай')] },
  { title: 'Парфюм женский', price: 190, category: 'Красота', description: 'Стойкий аромат · 50 мл',
    photos: [photo('Парфюм', '#E9E2D0', '#6b5a2a', '50 мл')] },
];

async function main() {
  const lr = await fetch(BASE + '/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD }),
  });
  if (!lr.ok) throw new Error('Не удалось войти (проверьте ADMIN_PASSWORD)');
  const { token } = await lr.json();
  const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  // Очистить старые товары
  const existing = await (await fetch(BASE + '/api/admin/products', { headers: auth })).json();
  for (const p of existing) {
    await fetch(BASE + '/api/admin/products/' + p.id, { method: 'DELETE', headers: auth });
  }

  // Добавить демо
  for (const p of demo) {
    await fetch(BASE + '/api/admin/products', { method: 'POST', headers: auth, body: JSON.stringify(p) });
  }
  console.log(`Готово: добавлено ${demo.length} товаров.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
