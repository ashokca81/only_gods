import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';
import { uploadToR2, isR2Configured } from '@/lib/r2';

export const runtime = 'nodejs';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  if (!isR2Configured) return NextResponse.json({ error: 'Uploads not configured' }, { status: 500 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Unsupported image' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'Image too large (max 4 MB)' }, { status: 400 });

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `avatars/${crypto.randomUUID()}.${ext}`;
  try {
    const url = await uploadToR2(key, Buffer.from(await file.arrayBuffer()), file.type);
    await callRpc('customer_update', { p_cid: cid, p_name: null, p_avatar: url });
    const customer = await callRpc('customer_get', { p_cid: cid });
    return NextResponse.json({ customer });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 });
  }
}
