export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export function tg(): any {
  return (window as any).Telegram?.WebApp;
}

export function initTelegram(): void {
  const w = tg();
  if (!w) return;
  try {
    w.ready();
    w.expand();
    w.setHeaderColor?.('#F7F5F2');
    w.setBackgroundColor?.('#F7F5F2');
  } catch {
    /* not in Telegram */
  }
}

export function tgUser(): TgUser | null {
  return tg()?.initDataUnsafe?.user ?? null;
}

export function isInTelegram(): boolean {
  return !!tg()?.initData;
}

export function openExternal(url: string): void {
  const w = tg();
  if (w?.openLink) w.openLink(url);
  else window.open(url, '_blank');
}
