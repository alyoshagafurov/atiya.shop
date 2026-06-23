import { Routes, Route } from 'react-router-dom';
import { Catalog } from './pages/Catalog';
import { ProductPage } from './pages/Product';
import { CartPage } from './pages/Cart';
import { Admin } from './pages/Admin';
import { CartBar } from './components/CartBar';

export function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Catalog />} />
      </Routes>
      <CartBar />
    </div>
  );
}
