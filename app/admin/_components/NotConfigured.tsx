export default function NotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold mb-2">Supabase not configured</h1>
        <p className="text-sm text-neutral-600 mb-4">
          Add your Supabase keys to <code className="font-mono">.env.local</code>{' '}
          and restart the dev server to enable the admin dashboard.
        </p>
        <pre className="text-left text-xs bg-neutral-100 rounded-lg p-3 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
        </pre>
      </div>
    </div>
  );
}
