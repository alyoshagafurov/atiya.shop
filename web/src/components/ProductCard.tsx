import { useNavigate } from 'react-router-dom';
import type { Product } from '../api';
import { useCart } from '../cart';
import { useConfig } from '../useConfig';
import { formatPrice } from '../format';
import { Icon } from './Icon';

export function ProductCard({ product }: { product: Product }) {
  const nav = useNavigate();
  const { add, qtyOf } = useCart();
  const cfg = useConfig();
  const qty = qtyOf(product.id);

  return (
    <div className="card" onClick={() => nav('/product/' + product.id)}>
      <div className="card-photo">
        {product.photos[0] ? (
          <img src={product.photos[0]} alt={product.title} loading="lazy" />
        ) : (
          <div className="photo-empty">
            <Icon name="image" size={28} />
          </div>
        )}
        {product.category && <span className="card-tag">{product.category}</span>}
      </div>
      <div className="card-body">
        <div className="card-title">{product.title}</div>
        <div className="card-row">
          <span className="card-price">{formatPrice(product.price, cfg.currency)}</span>
          <button
            className={'card-add' + (qty > 0 ? ' active' : '')}
            onClick={(e) => {
              e.stopPropagation();
              add(product);
            }}
            aria-label="Добавить в корзину"
          >
            {qty > 0 ? <span className="card-add-qty">{qty}</span> : <Icon name="plus" size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
