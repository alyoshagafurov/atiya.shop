import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Product } from '../api';
import { useConfig } from '../useConfig';
import { formatPrice } from '../format';
import { Icon } from '../components/Icon';

const TOKEN_KEY = 'atiya-admin-token';

export function Admin() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || '');
  if (!token) {
    return <Login onLogin={(t) => { localStorage.setItem(TOKEN_KEY, t); setToken(t); }} />;
  }
  return <Panel token={token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(''); }} />;
}

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const nav = useNavigate();
  const cfg = useConfig();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api.login(password);
      onLogin(token);
    } catch {
      setError('Неверный пароль');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav('/')} aria-label="Назад">
          <Icon name="back" />
        </button>
        <span className="topbar-title">Админка</span>
        <span />
      </header>
      <form className="login" onSubmit={submit}>
        <div className="login-brand">{cfg.brand}.shop</div>
        <p className="login-sub">Вход для администратора</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoFocus
        />
        {error && <div className="form-error">{error}</div>}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

const empty: Partial<Product> = {
  title: '',
  price: 0,
  category: '',
  description: '',
  photos: [],
  available: true,
};

function Panel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const nav = useNavigate();
  const cfg = useConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.adminProducts(token).then(setProducts).catch(() => {
    if (confirm('Сессия истекла. Войти заново?')) onLogout();
  });

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing({ ...empty }); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing({ ...p }); setShowForm(true); };
  const duplicate = (p: Product) => {
    setEditing({ ...p, id: undefined, title: p.title + ' (копия)' });
    setShowForm(true);
  };

  const remove = async (p: Product) => {
    if (!confirm(`Удалить «${p.title}»?`)) return;
    await api.deleteProduct(token, p.id);
    load();
  };

  const toggle = async (p: Product) => {
    await api.updateProduct(token, p.id, { available: !p.available });
    load();
  };

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav('/')} aria-label="На витрину">
          <Icon name="back" />
        </button>
        <span className="topbar-title">Товары · {products.length}</span>
        <button className="link-btn" onClick={onLogout}>Выйти</button>
      </header>

      <button className="btn primary add-btn" onClick={openNew}>
        <Icon name="plus" size={18} /> Добавить товар
      </button>

      <div className="admin-list">
        {products.map((p) => (
          <div key={p.id} className={'admin-row' + (p.available ? '' : ' off')}>
            <div className="admin-thumb">
              {p.photos[0] ? <img src={p.photos[0]} alt="" /> : <div className="photo-empty"><Icon name="image" size={20} /></div>}
            </div>
            <div className="admin-row-mid">
              <div className="admin-row-title">{p.title}</div>
              <div className="admin-row-meta">
                {formatPrice(p.price, cfg.currency)}
                {p.category ? ' · ' + p.category : ''} · {p.photos.length} фото
              </div>
            </div>
            <div className="admin-row-actions">
              <button className="chip toggle" onClick={() => toggle(p)}>
                {p.available ? 'В наличии' : 'Скрыт'}
              </button>
              <button className="icon-btn small" onClick={() => duplicate(p)} aria-label="Дублировать" title="Дублировать">
                <Icon name="copy" size={18} />
              </button>
              <button className="icon-btn small" onClick={() => openEdit(p)} aria-label="Изменить">
                <Icon name="edit" size={18} />
              </button>
              <button className="icon-btn small" onClick={() => remove(p)} aria-label="Удалить">
                <Icon name="trash" size={18} />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && <div className="empty"><p>Список пуст</p></div>}
      </div>

      {showForm && editing && (
        <ProductForm
          token={token}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function ProductForm({
  token,
  initial,
  onClose,
  onSaved,
}: {
  token: string;
  initial: Partial<Product>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cfg = useConfig();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initial.title || '');
  const [price, setPrice] = useState(String(initial.price || ''));
  const [category, setCategory] = useState(initial.category || '');
  const [catFocus, setCatFocus] = useState(false);
  const [allCats, setAllCats] = useState<string[]>([]);
  const [description, setDescription] = useState(initial.description || '');
  const [photos, setPhotos] = useState<string[]>(initial.photos || []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const isEdit = !!initial.id;

  useEffect(() => {
    api.categories().then((cats) => setAllCats(cats.map((c) => c.name)));
  }, []);

  const catSuggestions = category.trim()
    ? allCats.filter((c) => c.toLowerCase().includes(category.toLowerCase()) && c.toLowerCase() !== category.toLowerCase())
    : allCats;

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { urls } = await api.upload(token, Array.from(files));
      setPhotos((prev) => [...prev, ...urls]);
    } catch {
      alert('Не удалось загрузить фото');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    if (!title.trim()) { alert('Введите название'); return; }
    const data: Partial<Product> = {
      title: title.trim(),
      price: Number(price.replace(',', '.')) || 0,
      category: category.trim(),
      description: description.trim(),
      photos,
      available: initial.available !== false,
    };
    setBusy(true);
    try {
      if (isEdit && initial.id) await api.updateProduct(token, initial.id, data);
      else await api.createProduct(token, data);
      onSaved();
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sheet" onClick={onClose}>
      <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <strong>{isEdit ? 'Редактировать' : 'Новый товар'}</strong>
          <button className="icon-btn small" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="photo-strip">
          {photos.map((src, i) => (
            <div key={i} className="photo-strip-item">
              <img src={src} alt="" />
              <button onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))} aria-label="Убрать фото">
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
          <button className="photo-add" onClick={() => camRef.current?.click()} disabled={uploading}>
            <Icon name="camera" size={22} />
            <span>Камера</span>
          </button>
          <button className="photo-add" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Icon name={uploading ? 'image' : 'plus'} size={22} />
            <span>{uploading ? 'Загрузка…' : 'Галерея'}</span>
          </button>
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => pick(e.target.files)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => pick(e.target.files)}
          />
        </div>

        <label className="field-label">Название</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Платье Zara" />

        <div className="field-row">
          <div>
            <label className="field-label">Цена ({cfg.currency})</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="180" />
          </div>
          <div className="cat-wrap">
            <label className="field-label">Категория</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setCatFocus(true)}
              onBlur={() => setTimeout(() => setCatFocus(false), 150)}
              placeholder="Одежда"
            />
            {catFocus && catSuggestions.length > 0 && (
              <div className="cat-suggest">
                {catSuggestions.map((c) => (
                  <button key={c} onMouseDown={() => setCategory(c)}>{c}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <label className="field-label">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Размеры, материал, страна…"
          rows={3}
        />

        <button className="btn primary" onClick={save} disabled={busy || uploading}>
          {busy ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Добавить в каталог'}
        </button>
      </div>
    </div>
  );
}
