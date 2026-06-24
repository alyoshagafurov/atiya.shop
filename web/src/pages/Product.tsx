import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Product } from '../api';
import { useConfig } from '../useConfig';
import { useCart } from '../cart';
import { formatPrice } from '../format';
import { Icon } from '../components/Icon';

export function ProductPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const cfg = useConfig();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .product(id)
      .then((p) => {
        setProduct(p);
        setPhoto(0);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="page">
        <BackBar onBack={() => nav('/')} />
        <div className="empty">
          <p>Товар не найден</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <BackBar onBack={() => nav('/')} />
        <div className="gallery skeleton" />
      </div>
    );
  }

  const onAdd = () => {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="page page-product">
      <BackBar onBack={() => nav(-1)} />

      <div className="gallery">
        {product.photos[photo] ? (
          <img src={product.photos[photo]} alt={product.title} />
        ) : (
          <div className="photo-empty big">
            <Icon name="image" size={40} />
          </div>
        )}
      </div>

      {product.photos.length > 1 && (
        <div className="thumbs">
          {product.photos.map((src, i) => (
            <button
              key={i}
              className={'thumb' + (i === photo ? ' on' : '')}
              onClick={() => setPhoto(i)}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className="product-info">
        {product.category && <div className="product-eyebrow">{product.category}</div>}
        <h1 className="product-title">{product.title}</h1>
        <div className="product-price">{formatPrice(product.price, cfg.currency)}</div>
        {product.description && <p className="product-desc">{product.description}</p>}
      </div>

      <div className="product-actions">
        <div className="stepper">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Меньше">
            <Icon name="minus" size={18} />
          </button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} aria-label="Больше">
            <Icon name="plus" size={18} />
          </button>
        </div>
        <button className={'btn primary' + (added ? ' ok' : '')} onClick={onAdd}>
          {added ? (
            <>
              <Icon name="check" size={18} /> Добавлено
            </>
          ) : (
            <>В корзину · {formatPrice(product.price * qty, cfg.currency)}</>
          )}
        </button>
      </div>
    </div>
  );
}

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onBack} aria-label="Назад">
        <Icon name="back" />
      </button>
    </header>
  );
}
