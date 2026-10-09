import { Metadata } from 'next';
import CategoryCard from '@/components/CategoryCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCollections } from '@/lib/collections';

export const metadata: Metadata = {
    title: 'Collections | ONLY GODS',
    description: 'Explore our exclusive collections of premium streetwear.',
};

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
    const supabase = await getServerSupabase();

    const [{ data: settingRow }, { data: products }] = await Promise.all([
        supabase!.from('settings').select('value').eq('key', 'collections').single(),
        supabase!.from('products').select('collections').eq('is_active', true),
    ]);

    const collections = mergeCollections(settingRow?.value);

    // Live count of products tagged into each collection.
    const counts = new Map<string, number>();
    for (const p of products ?? []) {
        for (const name of ((p as { collections: string[] | null }).collections ?? [])) {
            counts.set(name, (counts.get(name) ?? 0) + 1);
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-20 pb-12 lg:pt-28 lg:pb-20">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Header */}
                    <div className="max-w-2xl mx-auto mb-10 lg:mb-16 text-center">
                        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
                            Curated For You
                        </p>
                        <h1 className="text-4xl lg:text-6xl font-bold text-foreground font-display mb-6">
                            Collections
                        </h1>
                        <p className="text-sm lg:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
                            Seasonal edits and special drops — handpicked across every category.
                        </p>
                    </div>

                    {/* Collections Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
                        {collections.map((col, index) => (
                            <CategoryCard
                                key={`${col.title}-${index}`}
                                name={col.title}
                                image={col.image}
                                count={counts.get(col.title) ?? 0}
                                index={index}
                                href={`/shop?collection=${encodeURIComponent(col.title)}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
