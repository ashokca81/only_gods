import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** COD advance for a cart (Σ product advance × qty). Body: { items } */
export async function POST(req: Request) {
  const { items } = await req.json().catch(() => ({}));
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ advance: 0 });
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ advance: 0 });
  const { data, error } = await supabase.rpc('cod_advance_quote', { items });
  if (error) return NextResponse.json({ advance: 0 });
  return NextResponse.json({ advance: Number(data) || 0 });
}
