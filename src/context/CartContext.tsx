"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../data/db';
import { trackEvent } from '../lib/tracker';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'OnHold' | 'Return' | 'Cancelled' | 'Archived';
  customerInfo: {
    name: string;
    email: string;
    address: string;
    [key: string]: any;
  };
  trackingLink?: string;
  courierService?: string;
  cashbackApplied?: number;
  appliedCoupon?: string;
  emailSent?: boolean;
  defaultOrdered?: boolean;
}

export interface PromoCode {
  code: string;
  type: 'flat' | 'percentage' | 'cashback';
  value: number;
  startDate?: string;
  endDate?: string;
  isForever: boolean;
  minOrderAmount?: number;
  validLocations?: string[]; // states or pincodes
  validCategories?: string[]; // category slugs
  validProducts?: string[]; // product IDs
}

interface CartContextType {
  cart: CartItem[];
  orders: Order[];
  products: Product[];
  promoCodes: PromoCode[];
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  discountCode: string;
  discountPercentage: number;
  discountAmount: number;
  activeCoupon: PromoCode | null;
  couponMessage: string;
  autoOfferDiscount: number;
  applyDiscountCode: (code: string, customerState?: string, pincode?: string) => { success: boolean; message: string };
  removeDiscountCode: () => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addPromoCode: (promo: PromoCode) => Promise<void>;
  deletePromoCode: (code: string) => Promise<void>;
  updatePromoCode: (promo: PromoCode) => Promise<void>;
  addToCart: (product: Product, quantity?: number, suppressDrawer?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
  getDiscountedTotal: () => number;
  getShippingFee: () => number;
  getFinalTotal: () => number;
  checkout: (customerInfo: {
    name: string;
    email: string;
    address: string;
    [key: string]: any;
  }) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['status'], trackingData?: { trackingLink?: string; courierService?: string }) => Promise<void>;
  refreshOrders: () => Promise<void>;
  saveAbandonedCart: (email?: string, phone?: string, name?: string) => Promise<void>;
  fetchAbandonedCarts: () => Promise<any[]>;
  createCheckoutSession: () => string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  
  // Coupon states
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState<PromoCode | null>(null);
  const [couponMessage, setCouponMessage] = useState("");

  // Load from localStorage on mount & fetch from MongoDB API
  useEffect(() => {
    const savedCart = localStorage.getItem('pn_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }

    const fetchData = async () => {
      try {
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods);
        }

        const orderRes = await fetch("/api/orders");
        if (orderRes.ok) {
          const ords = await orderRes.json();
          setOrders(ords);
        }

        const promoRes = await fetch("/api/promos");
        if (promoRes.ok) {
          const promos = await promoRes.json();
          setPromoCodes(promos);
        }
      } catch (err) {
        console.error("Error fetching data from MongoDB:", err);
      }
    };

    fetchData();
  }, []);

  // Auto-save abandoned cart when items sit in cart for 30s
  useEffect(() => {
    if (cart.length === 0) return;
    const timer = setTimeout(() => {
      saveAbandonedCart();
    }, 30000);
    return () => clearTimeout(timer);
  }, [cart]);

  // Save cart helper
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('pn_cart', JSON.stringify(newCart));
  };

  // Product CRUD integrations
  const addProduct = async (newProduct: Product) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        const saved = await res.json();
        setProducts(prev => [...prev, saved]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      const res = await fetch(`/api/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct)
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Promo actions
  const addPromoCode = async (promo: PromoCode) => {
    try {
      const res = await fetch("/api/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promo)
      });
      if (res.ok) {
        const saved = await res.json();
        setPromoCodes(prev => [...prev, saved]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePromoCode = async (code: string) => {
    try {
      await fetch(`/api/promos?code=${encodeURIComponent(code)}`, { method: "DELETE" });
      setPromoCodes(prev => prev.filter(p => p.code !== code));
    } catch (err) {
      console.error(err);
    }
  };

  const updatePromoCode = async (promo: PromoCode) => {
    try {
      const res = await fetch("/api/promos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promo)
      });
      if (res.ok) {
        const updated = await res.json();
        setPromoCodes(prev => prev.map(p => p.code === updated.code ? updated : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Apply discount with conditions
  const applyDiscountCode = (code: string, customerState?: string, pincode?: string) => {
    const cleanCode = code.toUpperCase().trim();
    const promo = promoCodes.find(p => p.code === cleanCode);
    
    if (!promo) {
      setCouponMessage("");
      return { success: false, message: "Coupon code not found." };
    }

    // 1. Date Validation
    if (!promo.isForever) {
      const now = new Date();
      if (promo.startDate && new Date(promo.startDate) > now) {
        setCouponMessage(""); return { success: false, message: "This coupon is not active yet." };
      }
      if (promo.endDate && new Date(promo.endDate) < now) {
        setCouponMessage(""); return { success: false, message: "This coupon has expired." };
      }
    }

    // 2. Minimum Order Amount
    const subtotal = getCartTotal();
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      setCouponMessage(""); return { success: false, message: `Minimum order value of ₹${promo.minOrderAmount} is required.` };
    }

    // 3. Location Locks
    if (promo.validLocations && promo.validLocations.length > 0) {
      const targetState = customerState?.toLowerCase().trim();
      const targetPin = pincode?.trim();
      const matches = promo.validLocations.some(loc => 
        loc.toLowerCase().trim() === targetState || loc.trim() === targetPin
      );
      if (!matches && (customerState || pincode)) {
        setCouponMessage(""); return { success: false, message: "This coupon is not valid for your location." };
      }
    }

    // 4. Category / Product Locks (OR logic — at least one must match)
    const hasCategoryLock = promo.validCategories && promo.validCategories.length > 0;
    const hasProductLock = promo.validProducts && promo.validProducts.length > 0;
    if (hasCategoryLock || hasProductLock) {
      const matchesCategory = hasCategoryLock && cart.some(item => 
        promo.validCategories!.includes(item.product.category)
      );
      const matchesProduct = hasProductLock && cart.some(item => 
        promo.validProducts!.includes(item.product.id)
      );
      if (!matchesCategory && !matchesProduct) {
        setCouponMessage(""); return { success: false, message: "Coupon is not valid for items in your cart." };
      }
    }

    // Set coupon states
    setDiscountCode(promo.code);
    setActiveCoupon(promo);

    const msg = `Discount ${promo.code} applied!`;
    setCouponMessage(msg);

    if (promo.type === 'percentage') {
      setDiscountPercentage(promo.value);
      setDiscountAmount(0);
    } else if (promo.type === 'flat') {
      setDiscountPercentage(0);
      setDiscountAmount(promo.value);
    } else if (promo.type === 'cashback') {
      setDiscountPercentage(0);
      setDiscountAmount(0);
    }

    trackEvent("click", window.location.pathname, `Apply Coupon: ${promo.code}`);
    return { success: true, message: msg };
  };

  const removeDiscountCode = () => {
    setDiscountCode("");
    setDiscountPercentage(0);
    setDiscountAmount(0);
    setActiveCoupon(null);
    setCouponMessage("");
  };

  // Cart operations (uses product.salePrice if available for promotional markdowns)
  const addToCart = (product: Product, quantity = 1, suppressDrawer = false) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      saveCart(newCart);
    } else {
      saveCart([...cart, { product, quantity }]);
    }
    if (!suppressDrawer) setCartDrawerOpen(true);
    trackEvent("click", typeof window !== "undefined" ? window.location.pathname : "/cart", `Add to Cart: ${product.name} (Qty: ${quantity})`);
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId);
    saveCart(newCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    );
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.product.salePrice ?? item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getAutoOffer = () => {
    return getCartTotal() >= 529 ? 10 : 0;
  };

  // Expose autoOfferDiscount as a state-like value (recomputed on each render via the getter)
  const autoOfferDiscount = getAutoOffer();

  const getDiscountedTotal = () => {
    const total = getCartTotal();
    const autoPct = getAutoOffer();
    const combinedPct = autoPct + (discountPercentage > 0 ? discountPercentage : 0);
    if (combinedPct > 0) {
      return total * (1 - combinedPct / 100);
    }
    if (discountAmount > 0) {
      return Math.max(0, total - discountAmount);
    }
    return total;
  };

  const getShippingFee = () => {
    const cartTotal = getCartTotal();
    if (cartTotal >= 4000) return 0;
    
    let totalShipping = 0;
    cart.forEach(item => {
      const prod = item.product;
      if (prod.deliveryType === "custom") {
        totalShipping += (prod.deliveryFee || 0) * item.quantity;
      } else if (prod.deliveryType === "cumulative") {
        if (cartTotal < (prod.deliveryMinOrder || 0)) {
          totalShipping += (prod.deliveryFee || 0);
        }
      }
    });
    return totalShipping;
  };

  const getFinalTotal = () => {
    return getDiscountedTotal(); // Shipping calculated only at checkout
  };

  const checkout = async (customerInfo: {
    name: string;
    email: string;
    address: string;
    [key: string]: any;
  }) => {
    try {
      const totalAmount = getDiscountedTotal() + getShippingFee() + (customerInfo.giftWrap ? 35 : 0);
      const orderPayload = {
        items: [...cart],
        total: totalAmount,
        status: 'Processing',
        customerInfo,
        cashbackApplied: activeCoupon?.type === 'cashback' ? activeCoupon.value : undefined,
        appliedCoupon: discountCode || undefined,
        defaultOrdered: true,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const newOrder = await res.json();
        setOrders(prev => [newOrder, ...prev]);
        clearCart();
        removeDiscountCode();
        trackEvent("click", typeof window !== "undefined" ? window.location.pathname : "/checkout", `Checkout Success: Order ₹${totalAmount}`);
        return newOrder;
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    }
    return null;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status'], trackingData?: { trackingLink?: string; courierService?: string }) => {
    try {
      const body: Record<string, any> = { status };
      if (trackingData) {
        if (trackingData.trackingLink !== undefined) body.trackingLink = trackingData.trackingLink;
        if (trackingData.courierService !== undefined) body.courierService = trackingData.courierService;
      }
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status, ...(trackingData || {}) } : order
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const ords = await res.json();
        setOrders(ords);
      }
    } catch (err) {
      console.error("Failed to refresh orders:", err);
    }
  };

  const saveAbandonedCart = async (email?: string, phone?: string, name?: string) => {
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image
      }));
      await fetch("/api/abandoned-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, name, items, total: getCartTotal() })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAbandonedCarts = async () => {
    try {
      const res = await fetch("/api/abandoned-carts");
      if (res.ok) return await res.json();
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const createCheckoutSession = () => {
    if (cart.length === 0) return null;
    const sessionId = "ch_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    const snapshot = {
      cart: cart.map(item => ({ product: item.product, quantity: item.quantity })),
      discountCode,
      discountPercentage,
      discountAmount,
      autoOfferDiscount,
      subtotal: getCartTotal(),
      combinedPct: autoOfferDiscount + discountPercentage,
      totalDiscount: ((getCartTotal() * (autoOfferDiscount + discountPercentage)) / 100) + discountAmount,
      shippingFee: getShippingFee(),
    };
    try {
      localStorage.setItem("checkout_" + sessionId, JSON.stringify(snapshot));
    } catch (e) {
      console.error("Failed to save checkout session", e);
      return null;
    }
    return sessionId;
  };

  return (
    <CartContext.Provider value={{
      cart,
      orders,
      products,
      promoCodes,
      cartDrawerOpen,
      setCartDrawerOpen,
      discountCode,
      discountPercentage,
      discountAmount,
      activeCoupon,
      couponMessage,
      autoOfferDiscount,
      applyDiscountCode,
      removeDiscountCode,
      addProduct,
      updateProduct,
      deleteProduct,
      addPromoCode,
      deletePromoCode,
      updatePromoCode,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartCount,
      getCartTotal,
      getDiscountedTotal,
      getShippingFee,
      getFinalTotal,
      checkout,
      updateOrderStatus,
      refreshOrders,
      saveAbandonedCart,
      fetchAbandonedCarts,
      createCheckoutSession
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
