'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Minus, Plus, Heart, ShoppingBag, ArrowLeft, Truck, RotateCcw, Shield, Star, Scale, Info, Maximize2, X, Bell } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/buffer/CartContext';
import { useCustomer } from '@/buffer/CustomerContext';
import { useUI } from '@/buffer/UIContext';
import { getVariants, isSoldOut } from '@/lib/variants';
import { useFlash } from '@/hooks/useFlash';
import { isFlashActive, flashPrice } from '@/lib/flash';
import { toast } from 'sonner';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function ProductDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const { data: products } = useProducts();
    const product = products.find((p) => p.id === id);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCart();
    const { customer, isWishlisted, toggleWishlist } = useCustomer();
    const { openAuthModal } = useUI();
    const [selectedImage, setSelectedImage] = useState(0);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [notified, setNotified] = useState(false);
    const [notifying, setNotifying] = useState(false);
    const flash = useFlash();

    const scrollToImage = (index: number) => {
        const el = document.getElementById(`product-image-${index}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setSelectedImage(index);
        }
    };

    if (!product) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pb-20 lg:pb-0">
                <p className="text-muted-foreground">Product not found.</p>
            </div>
        );
    }

    const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    const videos = product.videos ?? [];

    // ---- per-colour variants (Myntra-style) ----
    const variants = getVariants(product);
    const hasColorOptions = variants.some((v) => (v.color ?? '').trim() !== '');
    const activeColor = selectedColor || variants[0]?.color || '';
    const activeVariant =
        variants.find((v) => v.color.toLowerCase() === activeColor.toLowerCase()) ?? variants[0];
    const images =
        activeVariant?.images && activeVariant.images.length > 0
            ? activeVariant.images
            : (product.images && product.images.length > 0 ? product.images : [product.image]);
    const sizes = activeVariant?.sizes ?? [];
    const price = activeVariant ? activeVariant.price : product.price;
    const originalPrice = activeVariant ? activeVariant.original_price : (product.originalPrice ?? null);
    const flashOn = isFlashActive(flash);
    const salePrice = flashPrice(price, flash);
    const selectedSizeStock = sizes.find((s) => s.size === selectedSize)?.stock ?? 0;
    const soldOut = isSoldOut(product);

    const selectColor = (c: string) => {
        setSelectedColor(c);
        setSelectedSize('');
        setSelectedImage(0);
    };

    const notifyMe = async () => {
        if (!customer) { openAuthModal(); return; }
        setNotifying(true);
        try {
            const res = await fetch('/api/stock-notify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product!.id }),
            });
            if (res.ok) { setNotified(true); toast.success("We'll notify you when it's back in stock!"); }
            else toast.error('Could not submit. Try again.');
        } finally { setNotifying(false); }
    };

    const handleAddToCart = () => {
        if (soldOut) {
            toast.error('This product is sold out');
            return;
        }
        if (!customer) {
            openAuthModal();
            toast.error('Please log in to add items to your cart');
            return;
        }
        if (sizes.length > 0 && !selectedSize) {
            toast.error('Please select a size');
            return;
        }
        if (selectedSize && selectedSizeStock <= 0) {
            toast.error('Selected size is out of stock');
            return;
        }
        addItem({
            id: product.id,
            name: product.name,
            image: activeVariant?.images?.[0] || product.image,
            price,
            size: selectedSize || undefined,
            color: activeColor || undefined,
            quantity,
        });
        toast.success(`Added to cart — ${product.name}`);
    };

    return (
        <div className="min-h-screen bg-background pb-20 lg:pb-0 flex flex-col">
            <Navbar />

            <main className="flex-1">
                <div className="pt-24 lg:pt-28 pb-8 lg:pb-12">
                    <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">

                        {/* Breadcrumb */}
                        <div className="mb-4 lg:mb-6">
                            <Link href="/shop" className="inline-flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-all duration-300 group bg-secondary/50 hover:bg-secondary px-4 py-2 rounded-full border border-border/50">
                                <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform duration-300" />
                                <span className="font-medium">Back to Shop</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-20">
                            {/* Left Column: Image Gallery */}
                            <div className="w-full">
                                {/* Mobile: Horizontal Carousel */}
                                <div className="flex lg:hidden overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
                                    {images.map((img, i) => (
                                        <div key={i} className="flex-shrink-0 w-[85vw] snap-center rounded-xl overflow-hidden aspect-[3/4] bg-secondary">
                                            <img src={img} alt={`${product.name} view ${i + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {videos.map((v, i) => (
                                        <div key={`v${i}`} className="flex-shrink-0 w-[85vw] snap-center rounded-xl overflow-hidden aspect-[3/4] bg-black">
                                            <video src={v} controls playsInline className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop: Vertical Stack */}
                                {/* Desktop: Sticky Thumbnails + Scrollable Stack */}
                                <div className="hidden lg:flex gap-4">
                                    {/* Thumbnails (Sticky) */}
                                    <div className="hidden lg:flex flex-col gap-4 sticky top-24 h-fit max-h-[80vh] overflow-y-auto pr-2 scrollbar-hide">
                                        {images.map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => scrollToImage(i)}
                                                className={`w-20 aspect-[3/4] relative rounded-md overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-foreground' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            >
                                                <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Main Image Stack */}
                                    <div className="flex-1 flex flex-col gap-6">
                                        {images.map((img, i) => (
                                            <div
                                                key={i}
                                                id={`product-image-${i}`}
                                                className="w-full rounded-2xl overflow-hidden bg-secondary aspect-[3/4] relative group"
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${product.name} view ${i + 1}`}
                                                    className="w-full h-full object-cover transition-transform duration-700"
                                                />
                                                {/* Zoom Button */}
                                                <button
                                                    onClick={() => setZoomedImage(img)}
                                                    className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black"
                                                >
                                                    <Maximize2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                        {videos.map((v, i) => (
                                            <div key={`v${i}`} className="w-full rounded-2xl overflow-hidden bg-black aspect-[3/4]">
                                                <video src={v} controls playsInline className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Details (Sticky) */}
                            <div className="relative">
                                <div className="lg:sticky lg:top-32 space-y-8 lg:max-w-xl">

                                    {/* Header Info */}
                                    <div className="space-y-4 border-b border-border pb-8">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">{product.category}</span>
                                            <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                                                <Star size={12} fill="currentColor" />
                                                <span>4.9</span>
                                                <span className="text-muted-foreground font-normal">(124 Reviews)</span>
                                            </div>
                                        </div>
                                        <h1 className="text-4xl lg:text-5xl font-black text-foreground font-display uppercase tracking-wide leading-none">{product.name}</h1>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            {flashOn ? (
                                                <>
                                                    <span className="text-2xl lg:text-3xl font-bold text-red-600">{formatPrice(salePrice)}</span>
                                                    <span className="text-lg text-muted-foreground line-through decoration-1">{formatPrice(price)}</span>
                                                    <span className="px-3 py-1 bg-red-600 text-white text-[10px] tracking-[0.1em] uppercase font-bold rounded-full">
                                                        ⚡ {flash.percent}% OFF
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-2xl lg:text-3xl font-bold text-foreground">{formatPrice(price)}</span>
                                                    {originalPrice != null && originalPrice > price && (
                                                        <span className="text-lg text-muted-foreground line-through decoration-1">{formatPrice(originalPrice)}</span>
                                                    )}
                                                    {originalPrice != null && originalPrice > price && (
                                                        <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[10px] tracking-[0.1em] uppercase font-bold rounded-full">
                                                            Save {formatPrice(originalPrice - price)}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                                        {product.description}
                                    </p>

                                    {/* Selectors */}
                                    <div className="space-y-6">
                                        {/* Color */}
                                        {hasColorOptions && (
                                        <div>
                                            <span className="text-xs tracking-[0.2em] uppercase font-bold text-foreground mb-3 block">
                                                Color{activeVariant?.name ? ` — ${activeVariant.name}` : ''}
                                            </span>
                                            <div className="flex flex-wrap gap-3">
                                                {variants.map((v) => (
                                                    <button
                                                        key={v.color}
                                                        onClick={() => selectColor(v.color)}
                                                        title={v.name || v.color}
                                                        className={`w-10 h-10 rounded-full border-2 transition-all ${activeColor.toLowerCase() === v.color.toLowerCase() ? 'border-foreground p-0.5' : 'border-transparent hover:border-border'}`}
                                                    >
                                                        <div className="w-full h-full rounded-full border border-black/10" style={{ backgroundColor: v.color || '#e5e7eb' }} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        )}

                                        {/* Size */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs tracking-[0.2em] uppercase font-bold text-foreground">Size</span>
                                                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted underline-offset-4">
                                                    <Scale size={14} /> Size Guide
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-5 gap-2">
                                                {sizes.map((s) => {
                                                    const out = s.stock <= 0;
                                                    return (
                                                    <button
                                                        key={s.size}
                                                        onClick={() => !out && setSelectedSize(s.size)}
                                                        disabled={out}
                                                        title={out ? 'Sold out' : `${s.stock} in stock`}
                                                        className={`py-3 rounded-lg text-xs font-bold transition-all border relative ${
                                                            out
                                                                ? 'border-border text-muted-foreground/40 line-through cursor-not-allowed bg-secondary/30'
                                                                : selectedSize === s.size
                                                                    ? 'bg-foreground text-background border-foreground'
                                                                    : 'border-border text-foreground hover:border-foreground/50 hover:bg-secondary/50'
                                                        }`}
                                                    >
                                                        {s.size}
                                                    </button>
                                                    );
                                                })}
                                                {sizes.length === 0 && (
                                                    <span className="col-span-5 text-xs text-muted-foreground">No sizes for this colour.</span>
                                                )}
                                            </div>
                                            {selectedSize && (
                                                <p className={`text-xs mt-2 font-medium ${selectedSizeStock <= 0 ? 'text-destructive' : selectedSizeStock <= 5 ? 'text-destructive' : 'text-emerald-600'}`}>
                                                    {selectedSizeStock <= 0
                                                        ? 'Sold out'
                                                        : selectedSizeStock <= 5
                                                            ? `Only ${selectedSizeStock} left!`
                                                            : `In stock — ${selectedSizeStock} available`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quantity & Add */}
                                    <div className="flex gap-3 lg:gap-4 pt-4">
                                        <div className="inline-flex items-center border border-border rounded-xl">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:bg-secondary transition-colors rounded-l-xl"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-8 lg:w-12 text-center text-sm font-bold">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:bg-secondary transition-colors rounded-r-xl"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={soldOut}
                                            className={`flex-1 h-10 lg:h-12 flex items-center justify-center gap-2 lg:gap-3 text-xs lg:text-sm tracking-[0.2em] uppercase font-bold rounded-xl transition-all shadow-lg ${soldOut ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed shadow-none' : 'bg-foreground text-background hover:bg-foreground/90 shadow-foreground/20'}`}
                                        >
                                            <ShoppingBag size={16} className="lg:w-[18px] lg:h-[18px]" />
                                            {soldOut ? 'Sold Out' : 'Add to Cart'}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const r = await toggleWishlist(product.id);
                                                if (r === 'login') { openAuthModal(); toast.error('Please log in to save favourites'); }
                                                else toast.success(r === 'added' ? 'Added to favourites ♡' : 'Removed from favourites');
                                            }}
                                            title="Save to favourites"
                                            className="w-10 h-10 lg:w-14 lg:h-12 border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-colors group"
                                        >
                                            <Heart size={18} className={`lg:w-5 lg:h-5 transition-colors ${isWishlisted(product.id) ? 'fill-red-500 text-red-500' : 'group-hover:fill-current'}`} />
                                        </button>
                                    </div>

                                    {soldOut && (
                                        <button
                                            onClick={notifyMe}
                                            disabled={notifying || notified}
                                            className={`w-full h-11 flex items-center justify-center gap-2 text-xs lg:text-sm tracking-[0.2em] uppercase font-bold rounded-xl border transition-colors ${notified ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-foreground text-foreground hover:bg-foreground hover:text-background'}`}
                                        >
                                            <Bell size={16} /> {notified ? "You'll be notified ✓" : 'Notify me when available'}
                                        </button>
                                    )}

                                    {/* Feature Badges */}
                                    <div className="grid grid-cols-3 gap-4 py-6 border-b border-border">
                                        {[
                                            { icon: Truck, line1: "Free Shipping", line2: "On orders over ₹2,000" },
                                            { icon: Shield, line1: "Secure Checkout", line2: "SSL Encrypted" },
                                            { icon: RotateCcw, line1: "Free Returns", line2: "Within 30 days" },
                                        ].map((item, i) => (
                                            <div key={i} className="text-center space-y-2">
                                                <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center">
                                                    <item.icon size={18} className="text-foreground" />
                                                </div>
                                                <div className="text-[10px] uppercase tracking-wide font-medium">
                                                    <p>{item.line1}</p>
                                                    <p className="text-muted-foreground normal-case tracking-normal text-[10px]">{item.line2}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Accordions */}
                                    <div className="space-y-2">
                                        <Accordion type="single" collapsible className="w-full">
                                            {(product.detailsCare && product.detailsCare.length > 0) || product.description ? (
                                            <AccordionItem value="details">
                                                <AccordionTrigger className="text-xs uppercase tracking-[0.2em] font-bold">Details & Care</AccordionTrigger>
                                                <AccordionContent>
                                                    {product.detailsCare && product.detailsCare.length > 0 ? (
                                                        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4 py-2">
                                                            {product.detailsCare.map((d, i) => <li key={i}>{d}</li>)}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground py-2 leading-relaxed">{product.description}</p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                            ) : null}
                                            <AccordionItem value="shipping">
                                                <AccordionTrigger className="text-xs uppercase tracking-[0.2em] font-bold">Shipping & Returns</AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="text-sm text-muted-foreground space-y-2 py-2">
                                                        {product.shippingReturns && product.shippingReturns.trim()
                                                            ? product.shippingReturns.split('\n').filter((l) => l.trim()).map((l, i) => <p key={i}>{l}</p>)
                                                            : (<>
                                                                <p>Free standard shipping on all orders over ₹2,000. Orders are processed within 1-2 business days.</p>
                                                                <p>We accept returns within 30 days of delivery. Items must be unworn and in original condition with tags attached.</p>
                                                              </>)}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
                    <ProductReviews productId={product.id} />
                </div>

                {/* Related */}
                {related.length > 0 && (
                    <section className="py-16 lg:py-24 bg-secondary/30 border-t border-border">
                        <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
                            <div className="flex items-end justify-between mb-10">
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground font-display uppercase tracking-wider">
                                        Complete the Look
                                    </h2>
                                    <p className="text-xs text-muted-foreground tracking-widest mt-2 uppercase">Curated recommendations based on your style</p>
                                </div>
                                <Link href="/shop" className="hidden lg:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] hover:text-muted-foreground transition-colors">
                                    View All <ArrowLeft size={14} className="rotate-180" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                                {related.map((p, i) => (
                                    <ProductCard key={p.id} product={p} index={i} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

            </main>
            <Footer />

            {/* Zoom Overlay */}
            {
                zoomedImage && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 lg:p-10" onClick={() => setZoomedImage(null)}>
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-6 right-6 lg:top-10 lg:right-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={zoomedImage}
                            alt="Zoomed View"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )
            }
        </div >
    );
}
