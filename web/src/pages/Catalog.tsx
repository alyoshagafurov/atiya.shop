import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Product, type CategoryInfo } from '../api';
import { useConfig } from '../useConfig';
import { useCart } from '../cart';
import { ProductCard } from '../components/ProductCard';
import { Icon } from '../components/Icon';
import { isInTelegram, openExternal } from '../telegram';

type SortKey = 'new' | 'price_asc' | 'price_desc';

function sortProducts(list: Product[], key: SortKey): Product[] {
  const copy = [...list];
  if (key === 'price_asc') return copy.sort((a, b) => a.price - b.price);
  if (key === 'price_desc') return copy.sort((a, b) => b.price - a.price);
  return copy.sort((a, b) => b.created_at - a.created_at);
}

export function Catalog() {
  const cfg = useConfig();
  const nav = useNavigate();
  const { count } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [active, setActive] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('new');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .products({ category: active || undefined, q: q || undefined })
        .then(setProducts)
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [active, q]);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-name">{cfg.brand}</span>
          <span className="brand-dot">.shop</span>
        </div>
        <div className="topbar-right">
          {isInTelegram() && (
            <button
              className="icon-btn"
              onClick={() => openExternal(window.location.href)}
              aria-label="Открыть в браузере"
            >
              <Icon name="external" />
            </button>
          )}
          <button className="icon-btn" onClick={() => nav('/cart')} aria-label="Корзина">
            <Icon name="bag" />
            {count > 0 && <span className="icon-badge">{count}</span>}
          </button>
        </div>
      </header>

      <p className="catalog-tagline">Бутик вещей из Турции и Китая</p>

      <div className="search">
        <Icon name="search" size={18} />
        <input
          placeholder="Поиск товара…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div className="chips">
          <button className={'chip' + (active === '' ? ' on' : '')} onClick={() => setActive('')}>
            Все
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              className={'chip' + (active === c.name ? ' on' : '')}
              onClick={() => setActive(c.name)}
            >
              {c.name} <span className="chip-count">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="chips sort-chips">
        <button className={'chip' + (sort === 'new' ? ' on' : '')} onClick={() => setSort('new')}>
          Сначала новые
        </button>
        <button className={'chip' + (sort === 'price_asc' ? ' on' : '')} onClick={() => setSort('price_asc')}>
          Дешевле
        </button>
        <button className={'chip' + (sort === 'price_desc' ? ' on' : '')} onClick={() => setSort('price_desc')}>
          Дороже
        </button>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton">
              <div className="card-photo" />
              <div className="card-body">
                <div className="sk-line" />
                <div className="sk-line short" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty">
          <Icon name="bag" size={40} />
          <p>{q || active ? 'Ничего не найдено' : 'Скоро здесь появятся товары'}</p>
          <span>{q || active ? 'Попробуйте изменить запрос или категорию.' : 'Загляните чуть позже — мы готовим новинки.'}</span>
        </div>
      ) : (
        <div className="grid">
          {sortProducts(products, sort).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <footer className="catalog-footer">
        <button className="admin-link" onClick={() => nav('/admin')}>Управление</button>
      </footer>
    </div>
  );
}
