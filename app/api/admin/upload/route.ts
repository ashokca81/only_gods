import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { uploadToR2, isR2Configured } from '@/lib/r2';

export const runtime = 'nodejs';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
const MAX_IMAGE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request) {
  // --- admin auth ---
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isR2Configured) {
    return NextResponse.json(
      { error: 'R2 not configured. Add R2 keys to .env.local.' },
      { status: 500 }
    );
  }

  // --- file ---
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }
  const maxBytes = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large (max ${isVideo ? '50 MB' : '8 MB'})` },
      { status: 400 }
    );
  }

  const ext = (file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `products/${isVideo ? 'videos/' : ''}${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadToR2(key, buffer, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
