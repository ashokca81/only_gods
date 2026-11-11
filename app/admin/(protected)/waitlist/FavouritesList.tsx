import { Heart } from 'lucide-react';

export interface FavRow {
  product_id: string;
  product_name: string;
  image: string | null;
  customers: { name: string | null; phone: string | null; at: string }[];
}

/** Customer favourites (hearted products), most-loved first. */
export default function FavouritesList({ rows, error }: { rows: FavRow[]; error?: string | null }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-1">
        <Heart size={18} />
        <h1 className="text-2xl font-bold">Wishlist — customer favourites</h1>
      </div>
      <p className="text-sm text-neutral-500 mb-4">Products customers saved with ❤️ ({rows.reduce((a, r) => a + r.customers.length, 0)} saves).</p>
      {error ? (
        <p className="text-sm text-red-600 rounded-[5px] border border-red-200 bg-red-50 p-3">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500 rounded-xl border border-dashed border-neutral-200 p-6 text-center">No favourites yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <details key={r.product_id} className="rounded-xl border border-neutral-200 bg-white">
              <summary className="flex items-center gap-3 p-3 cursor-pointer list-none">
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" className="w-10 h-12 rounded-[5px] object-cover bg-neutral-100" />
                ) : (
                  <div className="w-10 h-12 rounded-[5px] bg-neutral-100" />
                )}
                <span className="flex-1 text-sm font-medium truncate">{r.product_name}</span>
                <span className="text-xs font-bold rounded-[5px] bg-rose-50 text-rose-600 px-2 py-1">❤️ {r.customers.length}</span>
              </summary>
              <div className="border-t border-neutral-100 px-3 py-2 space-y-1">
                {r.customers.map((c, i) => (
                  <div key={i} className="flex justify-between text-xs text-neutral-600">
                    <span>{c.name || 'Customer'} · {c.phone || '—'}</span>
                    <span className="text-neutral-400">{new Date(c.at).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
