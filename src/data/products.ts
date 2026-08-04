export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  colors: string[];
  sizes: string[];
  description: string;
  trending?: boolean;
  newArrival?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Obsidian Oversized Tee",
    price: 89,
    originalPrice: 120,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop",
    category: "T-Shirts",
    colors: ["Black", "White", "Grey"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Premium heavyweight cotton oversized tee with minimalist branding. Crafted for the modern man who values quality and style.",
    trending: true,
  },
  {
    id: "2",
    name: "Midnight Silk Shirt",
    price: 195,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=750&fit=crop",
    category: "Shirts",
    colors: ["Black", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    description: "Luxurious silk blend shirt with a relaxed fit. Perfect for evening occasions.",
    trending: true,
  },
  {
    id: "3",
    name: "Shadow Tech Hoodie",
    price: 245,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=750&fit=crop",
    category: "Hoodies",
    colors: ["Black", "Charcoal"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Technical fabric hoodie with water-resistant coating. Urban meets function.",
    trending: true,
    newArrival: true,
  },
  {
    id: "4",
    name: "Noir Slim Jeans",
    price: 175,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop",
    category: "Jeans",
    colors: ["Black", "Dark Grey"],
    sizes: ["28", "30", "32", "34", "36"],
    description: "Japanese selvedge denim in a modern slim fit. Raw and refined.",
  },
  {
    id: "5",
    name: "Titan Chain Bracelet",
    price: 135,
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=750&fit=crop",
    category: "Accessories",
    colors: ["Silver", "Gold"],
    sizes: ["One Size"],
    description: "Surgical steel chain bracelet with matte finish. Bold statement piece.",
    newArrival: true,
  },
  {
    id: "6",
    name: "Eclipse Bomber Jacket",
    price: 395,
    originalPrice: 450,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=750&fit=crop",
    category: "Hoodies",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL"],
    description: "Premium nylon bomber with satin lining. The ultimate layering piece.",
    trending: true,
  },
  {
    id: "7",
    name: "Phantom Graphic Tee",
    price: 75,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop",
    category: "T-Shirts",
    colors: ["Black", "White"],
    sizes: ["S", "M", "L", "XL"],
    description: "Limited edition graphic tee featuring exclusive artwork. 100% organic cotton.",
    trending: true,
  },
  {
    id: "8",
    name: "Stealth Cargo Pants",
    price: 210,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=750&fit=crop",
    category: "Jeans",
    colors: ["Black", "Olive"],
    sizes: ["28", "30", "32", "34", "36"],
    description: "Tapered cargo pants with concealed pockets. Military precision meets streetwear.",
    trending: true,
    newArrival: true,
  },
];

export const categories = [
  {
    name: "T-Shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop",
    count: 24,
  },
  {
    name: "Shirts",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop",
    count: 18,
  },
  {
    name: "Hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop",
    count: 15,
  },
  {
    name: "Jeans",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop",
    count: 20,
  },
  {
    name: "Accessories",
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=600&fit=crop",
    count: 32,
  },
];
