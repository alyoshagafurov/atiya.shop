import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../cart';
import { useConfig } from '../useConfig';
import { formatPrice } from '../format';
import { Icon } from './Icon';

export function CartBar() {
  const { count, total } = useCart();
  const cfg = useConfig();
  const nav = useNavigate();
  const loc = useLocation();

  const hidden = count === 0 || loc.pathname === '/cart' || loc.pathname === '/admin';
  if (hidden) return null;

  return (
    <div className="cartbar-wrap">
      <button className="cartbar" onClick={() => nav('/cart')}>
        <span className="cartbar-left">
          <span className="cartbar-icon">
            <Icon name="bag" size={20} />
            <span className="cartbar-badge">{count}</span>
          </span>
          <span>Корзина</span>
        </span>
        <span className="cartbar-total">{formatPrice(total, cfg.currency)}</span>
      </button>
    </div>
  );
}
