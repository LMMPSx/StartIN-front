const registeredCaches = new Set<{ clear: () => void }>();

export function getLatestEightAmTimestamp(now = Date.now()): number {
  const d = new Date(now);
  const eightAmToday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    8,
    0,
    0,
    0
  ).getTime();
  return now >= eightAmToday ? eightAmToday : eightAmToday - 24 * 60 * 60 * 1000;
}

export class DailyCycleCache<T> {
  private readonly store = new Map<string, { value: T; fetchedAt: number }>();

  constructor() {
    registeredCaches.add(this);
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.fetchedAt < getLatestEightAmTimestamp()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, fetchedAt: Date.now() });
  }

  clear(): void {
    this.store.clear();
  }
}

export function invalidateAllDailyCaches(): void {
  registeredCaches.forEach((cache) => cache.clear());
}
