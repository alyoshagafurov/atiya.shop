import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Product } from '../api';
import { useConfig } from '../useConfig';
import { useCart } from '../cart';
import { ProductCard } from '../components/ProductCard';
import { Icon } from '../components/Icon';

export function Catalog() {
  const cfg = useConfig();
  const nav = useNavigate();
  const { count } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [active, setActive] = useState<string>('');
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
        <button className="icon-btn" onClick={() => nav('/cart')} aria-label="Корзина">
          <Icon name="bag" />
          {count > 0 && <span className="icon-badge">{count}</span>}
        </button>
      </header>

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
              key={c}
              className={'chip' + (active === c ? ' on' : '')}
              onClick={() => setActive(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

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
          <p>Пока ничего нет</p>
          <span>Товары появятся здесь, как только тётя их добавит.</span>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
