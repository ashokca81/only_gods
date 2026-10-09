'use client';

import { useMemo, useState, useTransition } from 'react';
import { Star, Check, X, Trash2, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { setReviewApproved, deleteReview } from './actions';
import InfoCard from '../../_components/InfoCard';

export interface ReviewRow {
  id: string;
  product_id: string;
  product_name: string;
  name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
}

type Filter = 'pending' | 'approved' | 'all';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'} />
      ))}
    </span>
  );
}

export default function ReviewsManager({ initialReviews }: { initialReviews: ReviewRow[] }) {
  const [reviews, setReviews] = useState<ReviewRow[]>(initialReviews);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => ({
    pending: reviews.filter((r) => !r.is_approved).length,
    approved: reviews.filter((r) => r.is_approved).length,
    all: reviews.length,
  }), [reviews]);

  const filtered = useMemo(() => {
    if (filter === 'pending') return reviews.filter((r) => !r.is_approved);
    if (filter === 'approved') return reviews.filter((r) => r.is_approved);
    return reviews;
  }, [reviews, filter]);

  const approve = (r: ReviewRow, approved: boolean) => {
    setBusyId(r.id);
    startTransition(async () => {
      const res = await setReviewApproved(r.id, approved);
      setBusyId(null);
      if (res.ok) {
        setReviews((p) => p.map((x) => (x.id === r.id ? { ...x, is_approved: approved } : x)));
        toast.success(approved ? 'Review approved — live on the product' : 'Review hidden');
      } else toast.error(res.error);
    });
  };

  const remove = (r: ReviewRow) => {
    if (!confirm('Delete this review?')) return;
    setBusyId(r.id);
    startTransition(async () => {
      const res = await deleteReview(r.id);
      setBusyId(null);
      if (res.ok) { setReviews((p) => p.filter((x) => x.id !== r.id)); toast.success('Deleted'); }
      else toast.error(res.error);
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-neutral-500 mt-1">Approve customer reviews before they show on the website.</p>
      </div>

      <div className="flex rounded-[5px] border border-neutral-200 overflow-hidden text-sm mb-5 w-fit">
        {(['pending', 'approved', 'all'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 h-10 capitalize ${filter === f ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
            {filter === 'pending' ? 'No reviews waiting for approval. 🎉' : 'No reviews here.'}
          </div>
        ) : filtered.map((r) => (
          <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Stars value={r.rating} />
                  <span className="font-semibold text-sm">{r.name}</span>
                  {!r.is_approved && <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 rounded-[5px] px-1.5 py-0.5"><Clock size={11} /> Pending</span>}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  on <span className="font-medium text-neutral-500">{r.product_name}</span> · {new Date(r.created_at).toLocaleDateString('en-IN')}
                </p>
                {r.title && <p className="font-medium text-sm mt-2">{r.title}</p>}
                {r.body && <p className="text-sm text-neutral-600 mt-1">{r.body}</p>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {busyId === r.id ? (
                  <Loader2 size={16} className="animate-spin text-neutral-400 m-2" />
                ) : r.is_approved ? (
                  <button onClick={() => approve(r, false)} title="Hide" className="inline-flex items-center gap-1 rounded-[5px] border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50"><X size={13} /> Hide</button>
                ) : (
                  <button onClick={() => approve(r, true)} title="Approve" className="inline-flex items-center gap-1 rounded-[5px] bg-emerald-600 text-white px-3 py-1.5 text-xs hover:bg-emerald-700"><Check size={13} /> Approve</button>
                )}
                <button onClick={() => remove(r)} title="Delete" className="inline-flex items-center gap-1 rounded-[5px] border border-red-200 text-red-500 px-3 py-1.5 text-xs hover:bg-red-50"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <InfoCard
        title="How Reviews work"
        intro="Customers rate and review products. You approve each one before it shows on the website."
        flow={['Customer writes review', 'It waits here', 'You approve', 'It shows on the product']}
        steps={[
          { title: 'Pending first', desc: 'Every new review lands in Pending — nothing appears on the site until you approve it.' },
          { title: 'Approve / Hide', desc: 'Approve to publish. Hide to take an approved review back down. Delete to remove it for good.' },
          { title: 'Average rating', desc: 'The product’s star rating is the average of its approved reviews.' },
          { title: 'Who can review', desc: 'Only logged-in customers can write a review — one per product.' },
        ]}
        note="Check the Pending tab regularly so genuine reviews go live quickly."
      />
    </div>
  );
}
