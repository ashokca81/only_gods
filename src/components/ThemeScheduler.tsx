'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  DEFAULT_THEME_SCHEDULE, mergeThemeSchedule, scheduledTheme,
  OVERRIDE_KEY, OVERRIDE_MS, type ThemeScheduleConfig,
} from '@/lib/themeSchedule';

/**
 * Applies the dashboard dark/light schedule (IST). A manual toggle stored under
 * OVERRIDE_KEY wins for ~1 hour (survives refresh), then the schedule resumes.
 * Mount once inside the ThemeProvider.
 */
export default function ThemeScheduler() {
  const { setTheme } = useTheme();

  useEffect(() => {
    let cfg: ThemeScheduleConfig = DEFAULT_THEME_SCHEDULE;
    let timer: ReturnType<typeof setInterval> | undefined;

    const apply = () => {
      if (!cfg.enabled) return;
      // Honour a recent manual override.
      try {
        const raw = localStorage.getItem(OVERRIDE_KEY);
        if (raw) {
          const o = JSON.parse(raw) as { theme?: string; at?: number };
          if (typeof o?.at === 'number' && Date.now() - o.at < OVERRIDE_MS && (o.theme === 'light' || o.theme === 'dark')) {
            setTheme(o.theme);
            return;
          }
          localStorage.removeItem(OVERRIDE_KEY); // expired
        }
      } catch { /* ignore */ }
      setTheme(scheduledTheme(cfg));
    };

    let alive = true;
    fetch('/api/settings/theme-schedule')
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        cfg = mergeThemeSchedule(j?.themeSchedule);
        apply();
        timer = setInterval(apply, 60 * 1000); // re-check every minute
      })
      .catch(() => {});

    return () => { alive = false; if (timer) clearInterval(timer); };
  }, [setTheme]);

  return null;
}
