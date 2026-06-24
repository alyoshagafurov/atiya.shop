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

export interface CategoryInfo {
  name: string;
  count: number;
}

export interface ShopConfig {
  brand: string;
  currency: string;
  whatsapp: string;
}

async function j<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: 'Bearer ' + token };
}

export const api = {
  config: () => j<ShopConfig>('/api/config'),

  products: (params: { category?: string; q?: string } = {}) => {
    const u = new URLSearchParams();
    if (params.category) u.set('category', params.category);
    if (params.q) u.set('q', params.q);
    const qs = u.toString();
    return j<Product[]>('/api/products' + (qs ? '?' + qs : ''));
  },

  product: (id: string) => j<Product>('/api/products/' + id),
  categories: () => j<CategoryInfo[]>('/api/categories'),

  login: (password: string) =>
    j<{ token: string }>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }),

  adminProducts: (token: string) =>
    j<Product[]>('/api/admin/products', { headers: authHeaders(token) }),

  createProduct: (token: string, data: Partial<Product>) =>
    j<Product>('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(data),
    }),

  updateProduct: (token: string, id: string, data: Partial<Product>) =>
    j<Product>('/api/admin/products/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(data),
    }),

  deleteProduct: (token: string, id: string) =>
    j<{ ok: boolean }>('/api/admin/products/' + id, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  upload: async (token: string, files: File[]): Promise<{ urls: string[] }> => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: authHeaders(token),
      body: fd,
    });
    if (!res.ok) throw new Error('Не удалось загрузить фото');
    return res.json();
  },
};
