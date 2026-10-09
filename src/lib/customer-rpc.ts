import { getServerSupabase } from './supabase/server';

const RPC_SECRET = process.env.RPC_SECRET || '';

/** Call a secret-gated customer RPC from the server. */
export async function callRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error('Store not configured');
  const { data, error } = await supabase.rpc(fn, { p_secret: RPC_SECRET, ...args });
  if (error) throw new Error(error.message);
  return data as T;
}
