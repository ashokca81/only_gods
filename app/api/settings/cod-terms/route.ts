import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCodTerms, DEFAULT_COD_TERMS } from '@/lib/codTerms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ codTerms: DEFAULT_COD_TERMS });
  const { data } = await supabase.from('settings').select('value').eq('key', 'cod_terms').single();
  return NextResponse.json({ codTerms: mergeCodTerms(data?.value) });
}
