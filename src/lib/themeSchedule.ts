// Dashboard-managed automatic dark/light schedule. All times are India (IST).
// Safe to import from client and server.

export interface ThemeScheduleConfig {
  enabled: boolean;
  lightStart: string; // "HH:MM" IST — when LIGHT mode begins
  darkStart: string;  // "HH:MM" IST — when DARK mode begins
}

export const DEFAULT_THEME_SCHEDULE: ThemeScheduleConfig = {
  enabled: false,
  lightStart: '06:00',
  darkStart: '18:00',
};

// A manual toggle (Navbar) wins over the schedule for this long, then the
// schedule takes over again — so a refresh right after flipping stays put.
export const OVERRIDE_MS = 60 * 60 * 1000; // 1 hour
export const OVERRIDE_KEY = 'theme_override_v1';

const isHHMM = (s: unknown): s is string => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);

export function mergeThemeSchedule(value: unknown): ThemeScheduleConfig {
  const v = (value ?? {}) as Partial<ThemeScheduleConfig>;
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_THEME_SCHEDULE.enabled,
    lightStart: isHHMM(v.lightStart) ? v.lightStart : DEFAULT_THEME_SCHEDULE.lightStart,
    darkStart: isHHMM(v.darkStart) ? v.darkStart : DEFAULT_THEME_SCHEDULE.darkStart,
  };
}

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h % 24) * 60 + (m % 60);
};

/** Minutes-since-midnight in India (IST), regardless of the device timezone. */
export function istMinutesNow(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
  }).formatToParts(now);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hh * 60 + mm;
}

/** The theme the schedule wants right now (IST). */
export function scheduledTheme(cfg: ThemeScheduleConfig, now: Date = new Date()): 'light' | 'dark' {
  const cur = istMinutesNow(now);
  const ls = toMin(cfg.lightStart);
  const ds = toMin(cfg.darkStart);
  // Light window is [lightStart, darkStart); wraps past midnight when ls > ds.
  const inLight = ls <= ds ? (cur >= ls && cur < ds) : (cur >= ls || cur < ds);
  return inLight ? 'light' : 'dark';
}
