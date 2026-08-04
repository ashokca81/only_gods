import { Metadata } from 'next';
import CategoryCard from '@/components/CategoryCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { categories } from '@/data/products';

export const metadata: Metadata = {
    title: 'Collections | ONLY GODS',
    description: 'Explore our exclusive collections of premium streetwear.',
};

export default function CollectionsPage() {
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
                            Discover our premium range of essential wear, crafted with precision and designed for the modern aesthetic.
                        </p>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
                        {categories.map((category, index) => (
                            <CategoryCard
                                key={category.name}
                                {...category}
                                index={index}
                                href={`/shop?category=${category.name}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
