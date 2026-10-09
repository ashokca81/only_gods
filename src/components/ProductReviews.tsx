'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomer } from '@/buffer/CustomerContext';
import { useUI } from '@/buffer/UIContext';

interface Review { id: string; name: string; rating: number; title: string | null; body: string | null; created_at: string }

function Stars({ value, size = 16, onPick }: { value: number; size?: number; onPick?: (n: number) => void }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          className={onPick ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star`}
        >
          <Star size={size} className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'} />
        </button>
      ))}
    </span>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { customer } = useCustomer();
  const { openAuthModal } = useUI();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((j) => { setReviews(j.reviews ?? []); setAverage(j.average ?? 0); setCount(j.count ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [productId]);

  const submit = async () => {
    if (!customer) { openAuthModal(); return; }
    if (rating < 1) { toast.error('Please pick a rating'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      const j = await res.json();
      if (res.ok) {
        toast.success('Thanks! Your review is submitted for approval.');
        setOpen(false); setRating(0); setTitle(''); setBody('');
      } else toast.error(j?.error || 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-border pt-10 mt-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold font-display uppercase tracking-wide">Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            <Stars value={average} />
            <span className="text-sm text-muted-foreground">
              {count > 0 ? `${average} · ${count} review${count === 1 ? '' : 's'}` : 'No reviews yet'}
            </span>
          </div>
        </div>
        <button
          onClick={() => (customer ? setOpen((o) => !o) : openAuthModal())}
          className="rounded-[5px] bg-foreground text-background px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
        >
          {customer ? 'Write a review' : 'Log in to review'}
        </button>
      </div>

      {open && customer && (
        <div className="rounded-[5px] border border-border p-4 mb-6 bg-secondary/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium">Your rating:</span>
            <Stars value={rating} size={22} onPick={setRating} />
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full h-10 px-3 rounded-[5px] border border-border bg-background text-sm mb-2 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience…"
            rows={3}
            className="w-full px-3 py-2 rounded-[5px] border border-border bg-background text-sm resize-none focus:outline-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setOpen(false)} className="rounded-[5px] border border-border px-4 py-2 text-xs">Cancel</button>
            <button onClick={submit} disabled={submitting} className="rounded-[5px] bg-foreground text-background px-5 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-60">
              {submitting && <Loader2 size={14} className="animate-spin" />} Submit
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Be the first to review this product.</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border pb-5 last:border-0">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} size={14} />
                <span className="text-sm font-semibold">{r.name}</span>
                <span className="text-xs text-muted-foreground">· {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              {r.title && <p className="font-medium text-sm mt-1.5">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
