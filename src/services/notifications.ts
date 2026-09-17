import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'brix.notification_events';
const MAX = 100;

export type StoredNotification = {
  id: string;
  /** Event taxonomy fixed by the product spec. */
  kind:
    | 'payment_received'
    | 'payment_sent'
    | 'card_status'
    | 'merchant_status'
    | 'verification'
    | 'security';
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
};

/**
 * Local notification inbox.
 *
 * IMPORTANT: the existing BRIX backend exposes no documented push-registration
 * endpoint, so the app does NOT register for remote push. It ships the complete
 * architecture — permission handling, an event taxonomy, a persisted inbox and
 * a device-local emitter — behind a clearly-labelled capability flag. When the
 * backend documents a registration endpoint, only `registerForRemotePush()`
 * below needs a real implementation; nothing else changes.
 */
export const REMOTE_PUSH_SUPPORTED = false;

export async function registerForRemotePush(): Promise<
  { registered: true; deviceToken: string } | { registered: false; reason: string }
> {
  if (!REMOTE_PUSH_SUPPORTED) {
    return {
      registered: false,
      reason:
        'Remote push requires a backend registration endpoint. The current BRIX backend does not document one.',
    };
  }
  // Unreachable until the capability flag flips; kept so the call site is real.
  return { registered: false, reason: 'Registration endpoint not implemented.' };
}

async function readAll(): Promise<StoredNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: StoredNotification[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // ignore
  }
}

export function useNotificationInbox() {
  const [items, setItems] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await readAll();
    setItems(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const push = useCallback(
    async (event: Omit<StoredNotification, 'id' | 'createdAt' | 'read'>) => {
      const entry: StoredNotification = {
        ...event,
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      const next = [entry, ...(await readAll())].slice(0, MAX);
      await writeAll(next);
      setItems(next);
      return entry;
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    const next = (await readAll()).map((i) => ({ ...i, read: true }));
    await writeAll(next);
    setItems(next);
  }, []);

  const clear = useCallback(async () => {
    await writeAll([]);
    setItems([]);
  }, []);

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  return { items, loading, unreadCount, push, markAllRead, clear, reload: load };
}
