import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'atiya.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price       REAL NOT NULL DEFAULT 0,
    category    TEXT NOT NULL DEFAULT '',
    photos      TEXT NOT NULL DEFAULT '[]',
    available   INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL
  );
`);

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  photos: string[];
  available: boolean;
  created_at: number;
}

function rowToProduct(r: any): Product {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    price: r.price,
    category: r.category ?? '',
    photos: JSON.parse(r.photos || '[]'),
    available: !!r.available,
    created_at: r.created_at,
  };
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function listProducts(
  opts: { category?: string; q?: string; onlyAvailable?: boolean } = {},
): Product[] {
  let sql = 'SELECT * FROM products';
  const where: string[] = [];
  const params: any[] = [];
  if (opts.onlyAvailable) where.push('available = 1');
  if (opts.category) {
    where.push('category = ?');
    params.push(opts.category);
  }
  if (opts.q) {
    where.push('(lower(title) LIKE ? OR lower(description) LIKE ?)');
    const like = '%' + opts.q.toLowerCase() + '%';
    params.push(like, like);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params).map(rowToProduct);
}

export function getProduct(id: string): Product | null {
  const r = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  return r ? rowToProduct(r) : null;
}

export function createProduct(data: Partial<Product>): Product {
  const id = genId();
  db.prepare(
    `INSERT INTO products (id, title, description, price, category, photos, available, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    (data.title ?? 'Без названия').slice(0, 200),
    data.description ?? '',
    Number(data.price ?? 0),
    data.category ?? '',
    JSON.stringify(data.photos ?? []),
    data.available === false ? 0 : 1,
    Date.now(),
  );
  return getProduct(id)!;
}

export function updateProduct(id: string, data: Partial<Product>): Product | null {
  const existing = getProduct(id);
  if (!existing) return null;
  const m = { ...existing, ...data };
  db.prepare(
    `UPDATE products SET title=?, description=?, price=?, category=?, photos=?, available=? WHERE id=?`,
  ).run(
    m.title,
    m.description,
    Number(m.price),
    m.category,
    JSON.stringify(m.photos),
    m.available ? 1 : 0,
    id,
  );
  return getProduct(id);
}

export function deleteProduct(id: string): boolean {
  return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
}

export function listCategories(): string[] {
  return db
    .prepare(`SELECT DISTINCT category FROM products WHERE category <> '' ORDER BY category`)
    .all()
    .map((r: any) => r.category);
}
