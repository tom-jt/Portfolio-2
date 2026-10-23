const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi"];

/** 0.4, 12, 1.2K, 34.5M — compact enough for a HUD chip. */
export function formatNumber(n: number) {
  if (!Number.isFinite(n)) return "∞";
  if (n < 10) return Number.isInteger(n) ? `${n}` : n.toFixed(1);
  if (n < 1000) return `${Math.floor(n)}`;
  const tier = Math.min(
    Math.floor(Math.log10(n) / 3),
    SUFFIXES.length - 1,
  );
  const scaled = n / 10 ** (tier * 3);
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  return `${scaled.toFixed(digits).replace(/\.0+$/, "")}${SUFFIXES[tier]}`;
}

/** 25:00, or 1:05:00 past the hour. Rounds up so 0.4s left still reads 00:01. */
export function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 45m, 2h 5m. */
export function formatMinutes(minutes: number) {
  const m = Math.floor(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

/** Local calendar day, so "today" turns over at the visitor's midnight. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function previousDayKey(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}
