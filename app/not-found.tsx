import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-foreground font-display mb-4">404</h1>
                <p className="text-xl text-muted-foreground mb-8">Page not found</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-xs tracking-[0.15em] uppercase font-semibold rounded-xl hover:bg-foreground/90 transition-colors"
                >
                    <Home size={16} />
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
