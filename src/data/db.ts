export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  category: string;
  image: string; // fallback or primary image
  images?: string[]; // max 9 images
  description: string;
  longDescription: string;
  features: string[];
  specs: { [key: string]: string };
  isFeatured?: boolean;
  isHot?: boolean;
  
  // Advanced Retail & Compliance Fields
  gst?: string;
  hsnCode?: string;
  netWeight?: string;
  size?: string;
  genericName?: string;
  includedComponents?: string;
  material?: string;
  netQuantity?: string;
  
  // Logistics & Packaging Dimensions
  packagingBreadth?: string;
  packagingHeight?: string;
  packagingLength?: string;
  productBreadth?: string;
  productHeight?: string;
  productLength?: string;
  productUnit?: string;
  productWeight?: string;
  productWeightUnit?: string;
  
  // Electrical Specs
  voltage?: string;
  wattage?: string;
  
  // Origin & Supply Chain Details
  countryOfOrigin?: string;
  manufacturerName?: string;
  manufacturerAddress?: string;
  manufacturerPincode?: string;
  packerName?: string;
  packerAddress?: string;
  packerPincode?: string;
  importerName?: string;
  importerAddress?: string;
  importerPincode?: string;

  // Custom attributes list (created dynamically)
  customAttributes?: { key: string; value: string }[];

  // SEO details
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  seoKeywords?: string;
  tags?: string[];

  // Analytics & Offers
  costPrice?: number;
  skuId?: string;
  salePrice?: number; // for direct product offers

  // Policies & Shipping settings
  returnPolicy?: '7_days_return_only' | '7_days_return_replacement' | '7_days_replacement_only' | 'no_return';
  warrantyDetails?: string;
  deliveryType?: 'free' | 'cumulative' | 'custom';
  deliveryMinOrder?: number;
  deliveryFee?: number;

  // Draft / Publish status
  status?: 'draft' | 'published';
  boughtText?: string;
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  image: string;
}

export const CATEGORIES: Category[] = [
  {
    name: "Apparel & Accessories",
    slug: "apparel-accessories",
    description: "Everyday wear and premium carry goods designed for utility.",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Home & Office",
    slug: "home-office",
    description: "Sleek organizers and wireless tech for your workspace.",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Lifestyle & Living",
    slug: "lifestyle-living",
    description: "Curated home goods to elevate your daily routine.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Wellness & Care",
    slug: "wellness-care",
    description: "High-performance hydration and personal wellness gear.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop"
  }
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Classic Minimalist Backpack",
    slug: "classic-minimalist-backpack",
    price: 6399,
    originalPrice: 7999,
    rating: 4.8,
    reviewsCount: 142,
    category: "apparel-accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop",
    description: "A clean, functional, water-resistant canvas backpack with a dedicated laptop sleeve and premium leather details.",
    longDescription: "Elevate your daily commute with the Classic Minimalist Backpack. Crafted from water-resistant canvas and finished with genuine leather strap accents, this backpack is designed to protect your gear while maintaining a sleek silhouette. It features multiple quick-access pockets and a dedicated padded sleeve for up to a 15-inch laptop.",
    features: [
      "Water-resistant 100% cotton canvas",
      "Padded compartment for 15\" laptops",
      "Genuine full-grain leather straps",
      "Comfort-padded mesh back panel"
    ],
    specs: {
      "Dimensions": "18\" H x 12\" W x 6\" D",
      "Capacity": "20 Liters",
      "Material": "Waxed Canvas & Leather",
      "Weight": "1.8 lbs"
    },
    isFeatured: true,
    isHot: true
  },
  {
    id: "p2",
    name: "Double-Walled Insulated Tumbler",
    slug: "insulated-tumbler",
    price: 2799,
    originalPrice: 3199,
    rating: 4.9,
    reviewsCount: 88,
    category: "wellness-care",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop",
    description: "Keep your drinks hot for 12 hours or cold for 24 with this sleek stainless steel insulated tumbler.",
    longDescription: "Hydration engineered for active lives. Featuring double-walled vacuum insulation, a leakproof straw lid, and a durable sweat-free powder finish. Designed to fit in standard cup holders, this tumbler is your perfect companion for long commutes or intensive workouts.",
    features: [
      "Double-wall vacuum insulation",
      "18/8 Pro-grade stainless steel",
      "BPA-Free and Phthalate-free",
      "Fits standard cup holders"
    ],
    specs: {
      "Volume": "32 oz / 950 ml",
      "Cold Retention": "Up to 24 hours",
      "Hot Retention": "Up to 12 hours",
      "Warranty": "Lifetime"
    },
    isFeatured: true
  },
  {
    id: "p3",
    name: "Matte Ceramic Coffee Mug Set",
    slug: "matte-ceramic-mugs",
    price: 3600,
    originalPrice: 4400,
    rating: 4.7,
    reviewsCount: 56,
    category: "lifestyle-living",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=600&auto=format&fit=crop",
    description: "A set of four hand-crafted matte ceramic mugs, stackable and designed for a perfect morning brew.",
    longDescription: "Start your morning with intentionality. This set of four stackable ceramic mugs features a raw clay base and a stunning, tactile matte glaze. Designed with comfortable handles and optimal heat retention, they make your daily coffee or tea ritual feel like a premium cafe experience.",
    features: [
      "Set of 4 stackable mugs",
      "Tactile matte stoneware finish",
      "Dishwasher and microwave safe",
      "Ergonomic handle grip"
    ],
    specs: {
      "Capacity": "12 oz per mug",
      "Material": "Stoneware Ceramic",
      "Style": "Minimalist Stackable"
    },
    isFeatured: true
  },
  {
    id: "p4",
    name: "Full-Grain Leather Wallet",
    slug: "leather-wallet",
    price: 4799,
    rating: 4.6,
    reviewsCount: 210,
    category: "apparel-accessories",
    image: "https://images.unsplash.com/photo-1627124118123-e4d31159d1d0?q=80&w=600&auto=format&fit=crop",
    description: "Sleek bifold wallet made from ethically sourced full-grain leather, featuring RFID blocking.",
    longDescription: "Carry your essentials without the bulk. Handcrafted from top-tier full-grain leather, this wallet will develop a beautiful unique patina over time. It features a slim bifold design with six card slots, a cash slot, and integrated RFID-blocking technology to keep your cards secure.",
    features: [
      "100% Full-Grain Vegetable-Tanned Leather",
      "Built-in RFID blocking protection",
      "Slim profile bifold design",
      "Holds up to 8 cards and cash"
    ],
    specs: {
      "Dimensions": "4.2\" L x 3.1\" W x 0.4\" D",
      "Leather Type": "Full Grain",
      "RFID Shield": "13.56 MHz frequency"
    },
    isHot: true
  },
  {
    id: "p5",
    name: "USB-C Wireless Charging Pad",
    slug: "wireless-charging-pad",
    price: 2399,
    originalPrice: 2799,
    rating: 4.5,
    reviewsCount: 37,
    category: "home-office",
    image: "https://images.unsplash.com/photo-1622445262465-2481c4574875?q=80&w=600&auto=format&fit=crop",
    description: "Fast-charging wireless pad finished in premium walnut wood and soft grey felt.",
    longDescription: "Upgrade your nightstand or desk setup. This Qi-certified wireless charging pad delivers up to 15W of fast-charging speed, encased in real American walnut wood and premium merino wool felt. Its minimalist round design keeps your devices safe from scratches while looking beautiful.",
    features: [
      "Qi-Certified 15W fast wireless charging",
      "Genuine oiled American walnut top",
      "Soft merino wool felt protection ring",
      "Subtle LED charge indicator"
    ],
    specs: {
      "Input": "USB-C 9V/2A",
      "Output": "5W / 7.5W / 10W / 15W",
      "Cable Included": "5 ft braided USB-C to USB-C"
    }
  },
  {
    id: "p6",
    name: "Ergonomic Felt Desk Pad",
    slug: "felt-desk-pad",
    price: 3199,
    originalPrice: 3999,
    rating: 4.8,
    reviewsCount: 29,
    category: "home-office",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop",
    description: "Protect your desk and improve mouse tracking with this soft merino wool felt desk pad.",
    longDescription: "A curated workspace foundation. This large premium desk pad is made of renewable, water-repellent wool felt, offering a soft, structured surface that dampens noise, cushions wrists, and provides accurate optical tracking for your mouse. Complete with non-slip backing.",
    features: [
      "Natural premium wool felt material",
      "Anti-slip backing prevents sliding",
      "Water-repellent coating protects against spills",
      "Double-stitched borders for durability"
    ],
    specs: {
      "Dimensions": "31.5\" W x 11.8\" H x 0.16\" Thick",
      "Material": "80% Wool, 20% Polyester blend",
      "Cleaning": "Spot clean only"
    },
    isFeatured: true
  },
  {
    id: "p7",
    name: "Soy Wax Aromatherapy Candle",
    slug: "aromatherapy-candle",
    price: 1999,
    rating: 4.7,
    reviewsCount: 94,
    category: "lifestyle-living",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=600&auto=format&fit=crop",
    description: "Infuse your home with calming lavender and cedarwood scents, hand-poured in a reusable amber glass jar.",
    longDescription: "Crafted to help you unwind. Hand-poured with 100% natural, biodegradable soy wax and infused with high-grade organic lavender and cedarwood essential oils. Features a crackling wood wick that provides an even burn and a warm, inviting environment.",
    features: [
      "100% natural soy wax base",
      "Therapeutic lavender & cedarwood oils",
      "Natural crackling wooden wick",
      "45+ hour clean burn time"
    ],
    specs: {
      "Weight": "8 oz / 225g",
      "Jar Material": "Amber Glass with brass lid",
      "Origin": "Hand-poured in USA"
    }
  }
];

export const getProductBySlug = (slug: string): Product | undefined => {
  return PRODUCTS.find(p => p.slug === slug);
};

export const getProductById = (id: string): Product | undefined => {
  return PRODUCTS.find(p => p.id === id);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  return PRODUCTS.filter(p => p.category === categorySlug);
};

export const searchProducts = (query: string): Product[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.description.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );
};
