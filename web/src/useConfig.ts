import { useEffect, useState } from 'react';
import { api, type ShopConfig } from './api';

let cache: ShopConfig | null = null;

const fallback: ShopConfig = { brand: 'Turkiya TJ', currency: 'смн', whatsapp: '' };

export function useConfig(): ShopConfig {
  const [cfg, setCfg] = useState<ShopConfig>(cache ?? fallback);
  useEffect(() => {
    if (cache) return;
    api
      .config()
      .then((c) => {
        cache = c;
        setCfg(c);
      })
      .catch(() => {});
  }, []);
  return cfg;
}
