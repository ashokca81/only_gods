'use client';

import { Fragment, useState } from 'react';
import { Info, ChevronDown, ArrowRight } from 'lucide-react';

export interface InfoStep {
  title: string;
  desc: string;
}

export interface TwoPane {
  leftTitle: string;
  leftDesc: string;
  rightTitle: string;
  rightDesc: string;
  caption?: string;
}

/**
 * Collapsible "How this page works" help card (English, with a simple diagram).
 * Add one to every admin page so a non-technical owner understands it.
 */
export default function InfoCard({
  title,
  intro,
  flow,
  steps,
  twoPane,
  note,
  defaultOpen = false,
}: {
  title: string;
  intro?: string;
  flow?: string[];
  steps?: InfoStep[];
  twoPane?: TwoPane;
  note?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[5px] border border-blue-200 bg-blue-50/60 mb-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <Info size={18} className="text-blue-600 shrink-0" />
        <span className="text-sm font-semibold text-blue-900">{title}</span>
        <span className="ml-auto text-xs font-medium text-blue-600">{open ? 'Hide' : 'How it works'}</span>
        <ChevronDown size={16} className={`text-blue-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {intro && <p className="text-sm text-blue-900/80">{intro}</p>}

          {/* two-pane (form ⟷ preview) diagram */}
          {twoPane && (
            <div>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 rounded-[5px] border border-blue-300 bg-white p-3">
                  <p className="text-xs font-bold text-blue-900">{twoPane.leftTitle}</p>
                  <p className="text-[11px] text-blue-900/70 mt-0.5">{twoPane.leftDesc}</p>
                </div>
                <div className="flex items-center text-blue-400 font-bold text-lg">⟷</div>
                <div className="flex-1 rounded-[5px] border border-blue-300 bg-white p-3">
                  <p className="text-xs font-bold text-blue-900">{twoPane.rightTitle}</p>
                  <p className="text-[11px] text-blue-900/70 mt-0.5">{twoPane.rightDesc}</p>
                </div>
              </div>
              {twoPane.caption && <p className="text-[11px] text-blue-900/60 mt-1.5 text-center">{twoPane.caption}</p>}
            </div>
          )}

          {/* left-to-right flow diagram */}
          {flow && flow.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {flow.map((f, i) => (
                <Fragment key={i}>
                  <div className="rounded-[5px] border border-blue-300 bg-white px-3 py-2 text-xs font-medium text-blue-900">{f}</div>
                  {i < flow.length - 1 && <ArrowRight size={16} className="text-blue-400 shrink-0" />}
                </Fragment>
              ))}
            </div>
          )}

          {/* numbered steps */}
          {steps && steps.length > 0 && (
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900">{s.title}</p>
                    <p className="text-xs text-blue-900/70">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {note && (
            <p className="text-xs text-blue-900/80 bg-white rounded-[5px] border border-blue-200 px-3 py-2">💡 {note}</p>
          )}
        </div>
      )}
    </div>
  );
}
