import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../cart';
import { useConfig } from '../useConfig';
import { formatPrice } from '../format';
import { isInTelegram, tgUser, openExternal } from '../telegram';
import { Icon } from '../components/Icon';

export function CartPage() {
  const nav = useNavigate();
  const cfg = useConfig();
  const { items, setQty, remove, total, count, clear } = useCart();
  const inTg = isInTelegram();
  const user = tgUser();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preview, setPreview] = useState(false);

  const buildMessage = (): string => {
    const lines = [`Здравствуйте! Хочу заказать в ${cfg.brand}.shop:`, ''];
    items.forEach((it, i) => {
      lines.push(
        `${i + 1}. ${it.product.title} — ${it.qty} шт × ${formatPrice(it.product.price, cfg.currency)} = ${formatPrice(
          it.product.price * it.qty,
          cfg.currency,
        )}`,
      );
    });
    lines.push('', `Итого: ${formatPrice(total, cfg.currency)}`, '');

    const who = user
      ? `${[user.first_name, user.last_name].filter(Boolean).join(' ')}${user.username ? ' (@' + user.username + ')' : ''}`
      : name.trim();
    if (who) lines.push(`Имя: ${who}`);
    if (!inTg && phone.trim()) lines.push(`Телефон: ${phone.trim()}`);
    return lines.join('\n');
  };

  const order = () => {
    if (!cfg.whatsapp) {
      alert('Номер WhatsApp ещё не настроен. Добавьте WHATSAPP_NUMBER в настройках.');
      return;
    }
    const url = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(buildMessage())}`;
    openExternal(url);
  };

  const canOrder = count > 0 && (inTg || name.trim().length > 0);

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav('/')} aria-label="Назад">
          <Icon name="back" />
        </button>
        <span className="topbar-title">Корзина</span>
        {count > 0 && (
          <button className="link-btn" onClick={clear}>
            Очистить
          </button>
        )}
      </header>

      {count === 0 ? (
        <div className="empty">
          <Icon name="bag" size={40} />
          <p>Корзина пуста</p>
          <button className="btn ghost" onClick={() => nav('/')}>
            За покупками
          </button>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((it) => (
              <div key={it.product.id} className="cart-item">
                <div className="cart-thumb">
                  {it.product.photos[0] ? (
                    <img src={it.product.photos[0]} alt={it.product.title} />
                  ) : (
                    <div className="photo-empty">
                      <Icon name="image" size={22} />
                    </div>
                  )}
                </div>
                <div className="cart-mid">
                  <div className="cart-name">{it.product.title}</div>
                  <div className="cart-price">{formatPrice(it.product.price, cfg.currency)}</div>
                </div>
                <div className="cart-side">
                  <button className="icon-btn small" onClick={() => remove(it.product.id)} aria-label="Удалить">
                    <Icon name="trash" size={18} />
                  </button>
                  <div className="stepper sm">
                    <button onClick={() => setQty(it.product.id, it.qty - 1)} aria-label="Меньше">
                      <Icon name="minus" size={16} />
                    </button>
                    <span>{it.qty}</span>
                    <button onClick={() => setQty(it.product.id, it.qty + 1)} aria-label="Больше">
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!inTg && (
            <div className="contact">
              <label>Ваше имя</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как вас зовут?" />
              <label>Телефон (необязательно)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+992 …" />
            </div>
          )}

          <div className="cart-footer">
            <div className="cart-total">
              <span>Итого</span>
              <strong>{formatPrice(total, cfg.currency)}</strong>
            </div>
            <button className="btn whatsapp" disabled={!canOrder} onClick={() => setPreview(true)}>
              <Icon name="whatsapp" size={20} /> Заказать в WhatsApp
            </button>
            <p className="cart-hint">
              Заказ откроется в WhatsApp — отправьте сообщение тёте, и она ответит по наличию и оплате.
            </p>
          </div>
        </>
      )}

      {preview && (
        <div className="sheet" onClick={() => setPreview(false)}>
          <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <strong>Ваш заказ</strong>
              <button className="icon-btn small" onClick={() => setPreview(false)} aria-label="Закрыть">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="preview-msg">{buildMessage()}</div>
            <button className="btn whatsapp" onClick={() => { setPreview(false); order(); }}>
              <Icon name="whatsapp" size={20} /> Отправить в WhatsApp
            </button>
            <p className="cart-hint">Это сообщение откроется в WhatsApp</p>
          </div>
        </div>
      )}
    </div>
  );
}
