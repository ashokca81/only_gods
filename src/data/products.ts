import type { Variant } from '@/lib/variants';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  videos?: string[];
  variants?: Variant[];
  brand?: string;
  category: string;
  collections?: string[];
  stock?: number;
  colors: string[];
  sizes: string[];
  description: string;
  detailsCare?: string[];     // "Details & Care" bullet points (per product)
  shippingReturns?: string;   // "Shipping & Returns" text (per product)
  trending?: boolean;
  newArrival?: boolean;
}

const img = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;

// Canonical catalog (also the offline fallback). Live data comes from Supabase.
export const products: Product[] = [
  {
    id: "1",
    name: "Black Wildloom Hoodie",
    price: 23000,
    image: img("photo-1556821840-3a63f95609a7"),
    images: [
      img("photo-1556821840-3a63f95609a7"),
      img("photo-1521572163474-6864f9cf17ab"),
      img("photo-1512436991641-6745cdb1723f"),
    ],
    category: "Hoodies",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Premium heavyweight hoodie with signature Wildloom detailing. Crafted for all-day comfort and street-ready style.",
    trending: true,
  },
  {
    id: "2",
    name: "Brown Star Studded Hoodie",
    price: 17000,
    image: img("photo-1521572163474-6864f9cf17ab"),
    images: [
      img("photo-1521572163474-6864f9cf17ab"),
      img("photo-1556821840-3a63f95609a7"),
      img("photo-1506634572416-48cdfe530110"),
    ],
    category: "Hoodies",
    colors: ["Brown"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Soft brushed fleece hoodie with hand-placed star studs. A bold statement piece.",
    trending: true,
  },
  {
    id: "3",
    name: "Grey Star Studded Hoodie",
    price: 17000,
    image: img("photo-1512436991641-6745cdb1723f"),
    images: [
      img("photo-1512436991641-6745cdb1723f"),
      img("photo-1578587018452-892bacefd3f2"),
      img("photo-1483985988355-763728e1935b"),
    ],
    category: "Hoodies",
    colors: ["Grey"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Heather grey hoodie finished with metallic star studs. Everyday essential, elevated.",
    trending: true,
    newArrival: true,
  },
  {
    id: "4",
    name: "Brown Wildloom Hoodie",
    price: 23000,
    image: img("photo-1506634572416-48cdfe530110"),
    images: [
      img("photo-1506634572416-48cdfe530110"),
      img("photo-1521572163474-6864f9cf17ab"),
      img("photo-1556821840-3a63f95609a7"),
    ],
    category: "Hoodies",
    colors: ["Brown"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "The Wildloom in rich earth brown. Heavyweight cotton with a relaxed drop-shoulder fit.",
    trending: true,
  },
  {
    id: "5",
    name: "Meadow Blue Hoodie",
    price: 14500,
    image: img("photo-1578587018452-892bacefd3f2"),
    images: [
      img("photo-1578587018452-892bacefd3f2"),
      img("photo-1512436991641-6745cdb1723f"),
      img("photo-1483985988355-763728e1935b"),
    ],
    category: "Hoodies",
    colors: ["Blue"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Calm meadow-blue hoodie in brushed cotton fleece. Understated and endlessly wearable.",
    trending: true,
    newArrival: true,
  },
  {
    id: "6",
    name: "Red Serpent Bloom Zipper Hoodie",
    price: 14000,
    image: img("photo-1483985988355-763728e1935b"),
    images: [
      img("photo-1483985988355-763728e1935b"),
      img("photo-1578587018452-892bacefd3f2"),
      img("photo-1512436991641-6745cdb1723f"),
    ],
    category: "Hoodies",
    colors: ["Red"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Full-zip hoodie with Serpent Bloom back graphic. Bold colour, clean silhouette.",
    trending: true,
    newArrival: true,
  },
  {
    id: "7",
    name: "Black Poison Petals Zipper Hoodie",
    price: 16000,
    image: img("photo-1620799140188-3b2a02fd9a77"),
    images: [
      img("photo-1620799140188-3b2a02fd9a77"),
      img("photo-1503342217505-b0a15ec3261c"),
      img("photo-1556821840-3a63f95609a7"),
    ],
    category: "Hoodies",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Zip-through hoodie with Poison Petals embroidery. Dark, detailed, and refined.",
    trending: true,
    newArrival: true,
  },
  {
    id: "8",
    name: "Black Serpent Bloom Zipper Hoodie",
    price: 14000,
    image: img("photo-1503342217505-b0a15ec3261c"),
    images: [
      img("photo-1503342217505-b0a15ec3261c"),
      img("photo-1620799140188-3b2a02fd9a77"),
      img("photo-1506634572416-48cdfe530110"),
    ],
    category: "Hoodies",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "The Serpent Bloom zipper in classic black. A wardrobe anchor with subtle edge.",
    newArrival: true,
  },
];

export const categories = [
  {
    name: "Hoodies",
    image: img("photo-1556821840-3a63f95609a7"),
    count: 8,
  },
  {
    name: "Zippers",
    image: img("photo-1503342217505-b0a15ec3261c"),
    count: 3,
  },
  {
    name: "Studded",
    image: img("photo-1521572163474-6864f9cf17ab"),
    count: 2,
  },
  {
    name: "Wildloom",
    image: img("photo-1506634572416-48cdfe530110"),
    count: 2,
  },
  {
    name: "New In",
    image: img("photo-1578587018452-892bacefd3f2"),
    count: 4,
  },
];
