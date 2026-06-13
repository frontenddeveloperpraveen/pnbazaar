"use client";

import React, { useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { Product } from "../../data/db";
import styles from "./admin.module.css";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const {
    orders,
    products,
    promoCodes,
    updateOrderStatus,
    refreshOrders,
    addProduct,
    updateProduct,
    deleteProduct,
    addPromoCode,
    deletePromoCode,
    updatePromoCode,
    saveAbandonedCart,
    fetchAbandonedCarts
  } = useCart();

  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab") || "home";
  const validTabs = ["home", "orders", "products", "discounts", "analytics", "aborted-cart", "abandoned-checkouts", "reviews", "faq"];
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : "home";

  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Analytics States
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Badge & view tracking states
  const [abandonedCartCount, setAbandonedCartCount] = useState(0);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [lastOrdersView, setLastOrdersView] = useState(Date.now());
  const [newAbCartCount, setNewAbCartCount] = useState(0);
  const [lastAbCartView, setLastAbCartView] = useState(Date.now());
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [loadingCarts, setLoadingCarts] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logsId, setLogsId] = useState<string | null>(null);
  const [logInput, setLogInput] = useState("");
  const [selectedCarts, setSelectedCarts] = useState<Set<string>>(new Set());

  // Abandoned Checkouts states
  const [abandonedCheckouts, setAbandonedCheckouts] = useState<any[]>([]);
  const [loadingCheckouts, setLoadingCheckouts] = useState(true);
  const [expandedCheckoutId, setExpandedCheckoutId] = useState<string | null>(null);
  const [newAbCheckoutCount, setNewAbCheckoutCount] = useState(0);
  const [lastAbCheckoutView, setLastAbCheckoutView] = useState(Date.now());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Reviews state
  const [reviewList, setReviewList] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewShowForm, setReviewShowForm] = useState(false);
  const [reviewEditId, setReviewEditId] = useState<string | null>(null);
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewProductName, setReviewProductName] = useState("");
  const [reviewCustomerName, setReviewCustomerName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");

  // FAQ state
  const [faqList, setFaqList] = useState<any[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqProductId, setFaqProductId] = useState("");
  const [faqProductName, setFaqProductName] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqEditId, setFaqEditId] = useState<string | null>(null);
  const [faqShowForm, setFaqShowForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewMediaUrl, setReviewMediaUrl] = useState("");
  const [reviewMediaType, setReviewMediaType] = useState<"image" | "video" | "">("");
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split("T")[0]);
  const [reviewBulkFile, setReviewBulkFile] = useState<File | null>(null);
  const [reviewBulkResults, setReviewBulkResults] = useState<string[]>([]);
  const [reviewBulkLoading, setReviewBulkLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviewList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faq");
      if (res.ok) {
        const data = await res.json();
        setFaqList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFaqLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Auto-refresh orders on dashboard for real-time revenue
  React.useEffect(() => {
    if (activeTab === "home") {
      const interval = setInterval(refreshOrders, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab, refreshOrders]);

  // Fetch reviews on mount
  React.useEffect(() => {
    fetchReviews();
  }, []);

  // Fetch FAQs on mount
  React.useEffect(() => {
    fetchFaqs();
  }, []);

  // Track new orders since last view
  React.useEffect(() => {
    const recent = orders.filter(o => new Date(o.date).getTime() > lastOrdersView).length;
    setNewOrderCount(recent);
  }, [orders, lastOrdersView]);

  // Auto-login using refresh token on mount
  React.useEffect(() => {
    const autoAuth = async () => {
      const rToken = localStorage.getItem("admin_refresh_token");
      if (!rToken) return;
      try {
        const res = await fetch("/api/admin/auth", {
          method: "GET",
          headers: { "x-refresh-token": rToken }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            localStorage.setItem("admin_access_token", data.accessToken);
            localStorage.setItem("admin_refresh_token", data.refreshToken);
            setIsLoggedIn(true);
          }
        } else {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
        }
      } catch (err) {
        console.error("Auto authentication failed:", err);
      }
    };
    autoAuth();
  }, []);

  // Product form states
  const [customAttributes, setCustomAttributes] = useState<{ key: string; value: string }[]>([]);
  const [attrKey, setAttrKey] = useState("");
  const [attrVal, setAttrVal] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOrigPrice, setProdOrigPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodLongDesc, setProdLongDesc] = useState("");
  const [prodFeatures, setProdFeatures] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [customId, setCustomId] = useState("");
  const [prodSaving, setProdSaving] = useState(false);
  const [prodMessage, setProdMessage] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");
  const [prodBoughtText, setProdBoughtText] = useState("");
  const [gst, setGst] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [netWeight, setNetWeight] = useState("");
  const [genericName, setGenericName] = useState("");
  const [includedComponents, setIncludedComponents] = useState("");
  const [netQuantity, setNetQuantity] = useState("");
  const [packagingLength, setPackagingLength] = useState("");
  const [packagingBreadth, setPackagingBreadth] = useState("");
  const [packagingHeight, setPackagingHeight] = useState("");
  const [productLength, setProductLength] = useState("");
  const [productBreadth, setProductBreadth] = useState("");
  const [productHeight, setProductHeight] = useState("");
  const [productWeight, setProductWeight] = useState("");
  const [productWeightUnit, setProductWeightUnit] = useState("");
  const [productUnit, setProductUnit] = useState("");
  const [voltage, setVoltage] = useState("");
  const [wattage, setWattage] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [mfgName, setMfgName] = useState("");
  const [mfgAddress, setMfgAddress] = useState("");
  const [mfgPincode, setMfgPincode] = useState("");
  const [packerName, setPackerName] = useState("");
  const [packerAddress, setPackerAddress] = useState("");
  const [packerPincode, setPackerPincode] = useState("");
  const [importerName, setImporterName] = useState("");
  const [importerAddress, setImporterAddress] = useState("");
  const [importerPincode, setImporterPincode] = useState("");
  const [sameAsMfg, setSameAsMfg] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState("no_return");
  const [warrantyDetails, setWarrantyDetails] = useState("");
  const [deliveryType, setDeliveryType] = useState("free");
  const [deliveryMinOrder, setDeliveryMinOrder] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [bulkJsonText, setBulkJsonText] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);
  const [discountSubView, setDiscountSubView] = useState<string>("list");
  const [editCouponCode, setEditCouponCode] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"flat" | "percentage" | "cashback">("percentage");
  const [couponValue, setCouponValue] = useState("");
  const [couponStartDate, setCouponStartDate] = useState("");
  const [couponEndDate, setCouponEndDate] = useState("");
  const [couponIsForever, setCouponIsForever] = useState(true);
  const [couponMinOrder, setCouponMinOrder] = useState("");
  const [couponLocations, setCouponLocations] = useState("");
  const [couponSelectedCats, setCouponSelectedCats] = useState<string[]>([]);
  const [couponSelectedProds, setCouponSelectedProds] = useState<string[]>([]);
  const [promoMessage, setPromoMessage] = useState("");
  const [offerTargetType, setOfferTargetType] = useState<"category" | "product">("category");
  const [offerDiscountPercent, setOfferDiscountPercent] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryVal, setNewCategoryVal] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState("");
  const [offerCategory, setOfferCategory] = useState("");
  const [offerProduct, setOfferProduct] = useState("");
  const [manifestText, setManifestText] = useState("");

  // Orders Sub-tab Filters
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState("");
  const [showAddForm, setShowAddForm] = useState<"none" | "single" | "bulk">("none");

  const formSnapshotRef = useRef<any>({});

  // Auto-save draft product every 10 seconds
  React.useEffect(() => {
    const timer = setInterval(async () => {
      try {
        if (formSnapshotRef.current?.title) {
          const draftProduct = formSnapshotRef.current;
          const res = await fetch("/api/products", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draftProduct)
          });
          if (res.ok) { const d = await res.json(); formSnapshotRef.current._draftId = d.id; setDraftId(d.id); }
        }
        setLastAutoSave(new Date().toLocaleTimeString());
      } catch (err) { console.error("Auto-save failed:", err); }
    }, 10000);
    return () => clearInterval(timer);
  }, [showAddForm]);

  // Abandoned cart data fetching with 10s auto-refresh
  React.useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      const data = await fetchAbandonedCarts();
      if (!mounted) return;
      setAbandonedCarts(data);
      setAbandonedCartCount(data.length);
      setLoadingCarts(false);
      const newSinceView = data.filter((c: any) => new Date(c.createdAt).getTime() > lastAbCartView).length;
      setNewAbCartCount(newSinceView);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [lastAbCartView]);

  // Abandoned checkouts data fetching with 10s auto-refresh
  React.useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/abandoned-checkouts");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setAbandonedCheckouts(data);
        setLoadingCheckouts(false);
        const newSinceView = data.filter((c: any) => new Date(c.createdAt).getTime() > lastAbCheckoutView).length;
        setNewAbCheckoutCount(newSinceView);
      } catch { if (!mounted) return; setLoadingCheckouts(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [lastAbCheckoutView]);

  const toggleSelect = (id: string) => {
    setSelectedCarts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateCart = async (id: string, updates: any) => {
    await fetch("/api/abandoned-carts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id, ...updates })
    });
    setAbandonedCarts(prev => prev.map(c => c._id === id ? { ...c, ...updates } : c));
  };

  const deleteCart = async (id: string) => {
    await fetch(`/api/abandoned-carts?id=${id}`, { method: "DELETE" });
    setAbandonedCarts(prev => prev.filter(c => c._id !== id));
  };

  const deleteAbandonedCheckout = async (sessionId: string) => {
    await fetch(`/api/abandoned-checkouts?sessionId=${encodeURIComponent(sessionId)}`, { method: "DELETE" });
    setAbandonedCheckouts(prev => prev.filter(c => c.sessionId !== sessionId));
  };

  const addLogEntry = async (id: string, type: string, message: string) => {
    const cart = abandonedCarts.find(c => c._id === id);
    const logs = [...(cart?.followUpLogs || []), { type, sentAt: new Date().toISOString(), message }];
    await updateCart(id, { followUpLogs: logs });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("admin_access_token", data.accessToken);
        localStorage.setItem("admin_refresh_token", data.refreshToken);
        setIsLoggedIn(true);
        setLoginError("");
      } else {
        setLoginError(data.error || "Invalid administrator credentials.");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setLoginError("Could not reach authentication server.");
    }
  };

  const handleAddAttribute = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!attrKey.trim() || !attrVal.trim()) return;
    setCustomAttributes(prev => [...prev, { key: attrKey.trim(), value: attrVal.trim() }]);
    setAttrKey("");
    setAttrVal("");
  };

  const handleRemoveAttribute = (index: number) => {
    setCustomAttributes(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddImageUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    if (imageUrls.length >= 9) return;
    setImageUrls(prev => [...prev, ""]);
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleImageUrlChange = (index: number, val: string) => {
    setImageUrls(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const moveImageUp = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (index === 0) return;
    setImageUrls(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveImageDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (index === imageUrls.length - 1) return;
    setImageUrls(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const handleCloudinaryUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64data })
        });
        if (res.ok) {
          const data = await res.json();
          handleImageUrlChange(index, data.url);
        } else {
          console.error("Cloudinary upload failed");
        }
        setUploadingIndex(null);
      };
    } catch (err) {
      console.error(err);
      setUploadingIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Process files sequentially up to max 9 slots
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Find the first empty slot or add a slot
      let targetIdx = imageUrls.findIndex(url => !url.trim());
      if (targetIdx === -1 && imageUrls.length < 9) {
        setImageUrls(prev => [...prev, ""]);
        targetIdx = imageUrls.length;
      }
      
      if (targetIdx !== -1 && targetIdx < 9) {
        setUploadingIndex(targetIdx);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          // Use a promise to sync loop iterations
          await new Promise<void>((resolve, reject) => {
            reader.onloadend = async () => {
              const base64data = reader.result;
              const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file: base64data })
              });
              if (res.ok) {
                const data = await res.json();
                handleImageUrlChange(targetIdx, data.url);
                resolve();
              } else {
                reject("failed upload");
              }
            };
            reader.onerror = () => reject("reader error");
          });
        } catch (err) {
          console.error(err);
        }
        setUploadingIndex(null);
      }
    }
  };

  const NO_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='%23ccc'%3E%3Crect width='24' height='24' rx='2'/%3E%3Cpath d='M5 17l3.5-5 2.5 3 3-4 5 6H5z' fill='%23999'/%3E%3C/svg%3E";

  const handleToggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuPosition({ top: 0, left: 0 });
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({ top: rect.top, left: rect.left - 160 });
      setOpenMenuId(id);
    }
  };

  const handleEditProduct = (item: Product) => {
    setProdName(item.name);
    setProdPrice(String(item.price));
    setProdOrigPrice(item.originalPrice ? String(item.originalPrice) : "");
    setCostPrice(item.costPrice ? String(item.costPrice) : "");
    setProdCategory(item.category || "apparel-accessories");
    setProdDesc(item.description);
    setProdLongDesc(item.longDescription || "");
    setProdFeatures(item.features ? item.features.join("\n") : "");
    setProdStock(item.specs["Stock Status"]?.replace(/[^0-9]/g, "") || "");
    setCustomId(item.skuId || item.id || "");
    setHsnCode(item.hsnCode || "");
    setNetWeight(item.netWeight || "");
    setSize(item.size || "");
    setGenericName(item.genericName || "");
    setIncludedComponents(item.includedComponents || "");
    setMaterial(item.material || "");
    setNetQuantity(item.netQuantity || "1");
    setPackagingBreadth(item.packagingBreadth || "");
    setPackagingHeight(item.packagingHeight || "");
    setPackagingLength(item.packagingLength || "");
    setProductBreadth(item.productBreadth || "");
    setProductHeight(item.productHeight || "");
    setProductLength(item.productLength || "");
    setProductWeight(item.productWeight || "");
    setMfgName(item.manufacturerName || "");
    setMfgAddress(item.manufacturerAddress || "");
    setMfgPincode(item.manufacturerPincode || "");
    setPackerName(item.packerName || "");
    setPackerAddress(item.packerAddress || "");
    setPackerPincode(item.packerPincode || "");
    setImporterName(item.importerName || "");
    setImporterAddress(item.importerAddress || "");
    setImporterPincode(item.importerPincode || "");
    setCustomAttributes(item.customAttributes || []);
    setImageUrls(item.images && item.images.length > 0 ? item.images : [item.image || ""]);
    setSeoTitle(item.seoMetaTitle || "");
    setSeoDescription(item.seoMetaDescription || "");
    setSeoKeywords(item.seoKeywords || "");
    setTagsInput(item.tags ? item.tags.join(", ") : "");
    setGst(item.gst || "18%");
    setReturnPolicy(item.returnPolicy || "7_days_return_replacement");
    setWarrantyDetails(item.warrantyDetails || "");
    setDeliveryType(item.deliveryType || "free");
    setDeliveryMinOrder(item.deliveryMinOrder ? String(item.deliveryMinOrder) : "");
    setDeliveryFee(item.deliveryFee ? String(item.deliveryFee) : "");
    setCountryOfOrigin(item.countryOfOrigin || "India");
    setVoltage(item.voltage || "220V");
    setWattage(item.wattage || "N/A");
    setProductUnit(item.productUnit || "cm");
    setProductWeightUnit(item.productWeightUnit || "kg");
    setProdBoughtText(item.boughtText || "");
    setEditingProductId(item.id);
    setShowAddForm("single");
    setOpenMenuId(null);
  };

  const handleAddVariant = (item: Product) => {
    setProdMessage(`Variant option for "${item.name}" — create a new product listing for the variant.`);
    setTimeout(() => setProdMessage(""), 5000);
    setOpenMenuId(null);
  };

  const handleAddProductSubmit = async (status: "draft" | "published") => {
    if (status === "published") {
      if (!prodName || !prodPrice || !prodDesc) {
        setProdMessage("Please fill in all required fields.");
        return;
      }
    }
    const finalCategory = isNewCategory ? newCategoryVal.trim() : prodCategory;
    if (status === "published" && !finalCategory) {
      setProdMessage("Please specify a category.");
      return;
    }

    const newSlug = prodName ? prodName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : "draft";
    const stockNum = parseInt(prodStock) || 0;
    const cleanImages = imageUrls.filter(url => url.trim());
    const primaryImg = cleanImages[0] || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop";

    // Build specs dictionary from dimensions/etc
    const finalSpecs: { [key: string]: string } = {
      "Stock Status": `${stockNum} Units Available`,
      "Supplier SKU": customId || "SP-" + Math.floor(Math.random() * 9000 + 1000),
      "Material": material || "Not Specified",
      "Size": size || "Standard"
    };

    customAttributes.forEach(attr => {
      finalSpecs[attr.key] = attr.value;
    });

    const newProduct: Product = {
      id: editingProductId || customId || "prod-" + Date.now(),
      name: prodName,
      slug: newSlug,
      price: Number(prodPrice),
      originalPrice: prodOrigPrice ? Number(prodOrigPrice) : undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      skuId: customId || undefined,
      rating: 5.0,
      reviewsCount: 0,
      category: finalCategory,

      image: primaryImg,
      images: cleanImages,
      description: prodDesc,
      longDescription: prodLongDesc || prodDesc,
      features: prodFeatures ? prodFeatures.split("\n").filter(f => f.trim()) : ["Premium quality design", "Designed for daily utility"],
      specs: finalSpecs,
      
      gst,
      hsnCode,
      netWeight,
      size,
      genericName,
      includedComponents,
      material,
      netQuantity,
      
      packagingBreadth,
      packagingHeight,
      packagingLength,
      productBreadth,
      productHeight,
      productLength,
      productUnit,
      productWeight,
      productWeightUnit,
      
      voltage,
      wattage,
      
      countryOfOrigin,
      manufacturerName: mfgName,
      manufacturerAddress: mfgAddress,
      manufacturerPincode: mfgPincode,
      
      packerName: sameAsMfg ? mfgName : packerName,
      packerAddress: sameAsMfg ? mfgAddress : packerAddress,
      packerPincode: sameAsMfg ? mfgPincode : packerPincode,
      
      importerName,
      importerAddress,
      importerPincode,

      customAttributes,
      seoMetaTitle: seoTitle || prodName,
      seoMetaDescription: seoDescription || prodDesc,
      seoKeywords: seoKeywords,
      tags: tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : [],

      // Policies & Shipping settings
      returnPolicy: returnPolicy as any,
      warrantyDetails: warrantyDetails || undefined,
      deliveryType: deliveryType as any,
      deliveryMinOrder: deliveryMinOrder ? Number(deliveryMinOrder) : undefined,
      deliveryFee: deliveryFee ? Number(deliveryFee) : undefined,
      status,
      boughtText: prodBoughtText || undefined
    };

    setProdSaving(true);
    setProdMessage(status === "draft" ? `Saving draft "${prodName}"...` : `Publishing product "${prodName}"...`);
    if (editingProductId) {
      await updateProduct({ ...newProduct, id: editingProductId });
    } else {
      await addProduct(newProduct);
    }
    setProdSaving(false);
    setProdMessage(status === "draft" ? `Draft saved: "${prodName}"!` : `Successfully published: "${prodName}"!`);
    
    // Reset Form
    setProdName("");
    setProdPrice("");
    setProdOrigPrice("");
    setCostPrice("");
    setReturnPolicy("7_days_return_replacement");
    setWarrantyDetails("");
    setDeliveryType("free");
    setDeliveryMinOrder("");
    setDeliveryFee("");
    setProdDesc("");
    setProdLongDesc("");
    setProdFeatures("");
    setProdStock("");
    setCustomId("");
    setHsnCode("");
    setNetWeight("");
    setSize("");
    setGenericName("");
    setIncludedComponents("");
    setMaterial("");
    setNetQuantity("1");
    setPackagingBreadth("");
    setPackagingHeight("");
    setPackagingLength("");
    setProductBreadth("");
    setProductHeight("");
    setProductLength("");
    setProductWeight("");
    setMfgName("");
    setMfgAddress("");
    setMfgPincode("");
    setSameAsMfg(false);
    setPackerName("");
    setPackerAddress("");
    setPackerPincode("");
    setImporterName("");
    setImporterAddress("");
    setImporterPincode("");
    setCustomAttributes([]);
    setImageUrls([""]);
    setSeoTitle("");
    setSeoDescription("");
    setSeoKeywords("");
    setTagsInput("");
    setIsNewCategory(false);
    setNewCategoryVal("");
    setDraftId(null);
    setLastAutoSave("");
    setEditingProductId(null);
    setShowAddForm("none"); // Close form and show catalog

    setTimeout(() => setProdMessage(""), 4000);
  };

  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkJsonText.trim()) {
      setBulkMessage("Please paste product JSON data first.");
      return;
    }

    try {
      const parsed = JSON.parse(bulkJsonText.trim());
      const productsArray = Array.isArray(parsed) ? parsed : [parsed];
      
      let count = 0;
      for (const prod of productsArray) {
        if (!prod.name || !prod.price) continue;
        const finalProd: Product = {
          ...prod,
          id: prod.id || "prod-" + Date.now() + "-" + count,
          slug: prod.slug || prod.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
          price: Number(prod.price),
          rating: prod.rating || 5.0,
          reviewsCount: prod.reviewsCount || 0,
          category: prod.category || "apparel-accessories",
          image: prod.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop",
          images: prod.images || [prod.image].filter(Boolean),
          description: prod.description || prod.name,
          longDescription: prod.longDescription || prod.description || prod.name,
          features: prod.features || ["Quality product"],
          specs: prod.specs || { "Stock Status": "10 Units Available" }
        };
        await addProduct(finalProd);
        count++;
      }
      setBulkMessage(`Successfully bulk-uploaded ${count} products!`);
      setBulkJsonText("");
    } catch (err: any) {
      setBulkMessage("Invalid JSON structure: " + err.message);
    }
    setTimeout(() => setBulkMessage(""), 5000);
  };


  const handleAddPromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponValue) {
      setPromoMessage("Please fill in coupon code and value.");
      return;
    }

    const newPromo: any = {
      code: couponCode.toUpperCase().trim(),
      type: couponType,
      value: Number(couponValue),
      startDate: couponIsForever ? undefined : (couponStartDate || undefined),
      endDate: couponIsForever ? undefined : (couponEndDate || undefined),
      isForever: couponIsForever,
      minOrderAmount: couponMinOrder ? Number(couponMinOrder) : undefined,
      validLocations: couponLocations ? couponLocations.split(",").map(l => l.trim().toLowerCase()).filter(Boolean) : undefined,
      validCategories: couponSelectedCats.length > 0 ? couponSelectedCats : undefined,
      validProducts: couponSelectedProds.length > 0 ? couponSelectedProds : undefined
    };

    if (editCouponCode) {
      await updatePromoCode(newPromo);
      setPromoMessage(`Coupon "${newPromo.code}" updated successfully!`);
    } else {
      await addPromoCode(newPromo);
      setPromoMessage(`Discount coupon "${newPromo.code}" added successfully!`);
    }
    setEditCouponCode(null);
    setDiscountSubView("list");
    
    // Reset coupon form
    setCouponCode("");
    setCouponType("percentage");
    setCouponValue("");
    setCouponStartDate("");
    setCouponEndDate("");
    setCouponIsForever(true);
    setCouponMinOrder("");
    setCouponLocations("");
    setCouponSelectedCats([]);
    setCouponSelectedProds([]);
    setTimeout(() => setPromoMessage(""), 4000);
  };

  const handleApplyOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offerTargetType === "category") {
      if (!offerCategory || !offerDiscountPercent) {
        setOfferMessage("Please specify category and discount percentage.");
        return;
      }
      const pct = Number(offerDiscountPercent);
      let count = 0;
      for (const prod of products) {
        if (prod.category === offerCategory) {
          const salePrice = Math.round(prod.price * (1 - pct / 100));
          await updateProduct({ ...prod, salePrice });
          count++;
        }
      }
      setOfferMessage(`Applied ${pct}% offer to ${count} products in "${offerCategory}"!`);
    } else {
      if (!offerProduct || !offerDiscountPercent) {
        setOfferMessage("Please select a product and enter discount percentage.");
        return;
      }
      const target = products.find(p => p.id === offerProduct);
      if (target) {
        const pct = Number(offerDiscountPercent);
        const salePrice = Math.round(target.price * (1 - pct / 100));
        await updateProduct({ ...target, salePrice });
        setOfferMessage(`Applied ${pct}% offer to product: ${target.name}!`);
      }
    }
    setOfferDiscountPercent("");
    setDiscountSubView("list");
    setTimeout(() => setOfferMessage(""), 4000);
  };

  const handleClearOffers = async (e: React.MouseEvent) => {
    e.preventDefault();
    let count = 0;
    for (const prod of products) {
      if (prod.salePrice !== undefined) {
        const { salePrice, ...rest } = prod;
        await updateProduct(rest);
        count++;
      }
    }
    setOfferMessage(`Cleared markdown offers from ${count} products.`);
    setTimeout(() => setOfferMessage(""), 4000);
  };


  const handleGenerateInvoice = (orderId: string) => {
    setManifestText(`Fulfillment manifest & invoice label download triggered for order: ${orderId}`);
    setTimeout(() => setManifestText(""), 4000);
  };

  // Metrics computations
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const activeProductsCount = products.length;
  const discountCodesCount = promoCodes.length;

  const filteredInventory = products.filter(p =>
    p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div className={styles.shopifyLogo}>
              <svg viewBox="0 0 448 512" width="40" height="40" fill="#008060">
                <path d="M410.3 125.7l-47.5-38c-12-9.6-29.3-10-41.8-1l-61.9 44.5L181.7 54.1c-11.8-9.4-28.7-9.8-41-1l-84.3 60.5C44 122.5 37.9 135.2 39.7 148l23.5 164.7L18.4 397c-9 15.6-7.3 35.1 4.2 48.9s30.8 19.3 47.9 13.5L240 393l169.5 66.4c17.1 5.8 36.4.3 47.9-13.5s13.2-33.3 4.2-48.9l-45.8-79.3 23.5-164.7c1.8-12.8-4.3-25.5-16.7-32.3M175 142.1l54.8-39.3 54.8 39.3-54.8 39.3L175 142.1m14.2 119l45.8-32.9L281 261l-45.8 32.9-46-32.8z"></path>
              </svg>
              <span>shopify <span className={styles.adminLogoLabel}>admin</span></span>
            </div>
            <h2>Log In</h2>
            <p>Enter your store administrator credentials</p>
          </div>

          <form onSubmit={handleLogin} className={styles.loginForm}>
            {loginError && <p className={styles.errorText}>{loginError}</p>}

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>

            <button type="submit" className={styles.loginBtn}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shopifyLayout}>
      {/* Left Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brandContainer}>
          <svg viewBox="0 0 448 512" width="28" height="28" fill="#008060">
            <path d="M410.3 125.7l-47.5-38c-12-9.6-29.3-10-41.8-1l-61.9 44.5L181.7 54.1c-11.8-9.4-28.7-9.8-41-1l-84.3 60.5C44 122.5 37.9 135.2 39.7 148l23.5 164.7L18.4 397c-9 15.6-7.3 35.1 4.2 48.9s30.8 19.3 47.9 13.5L240 393l169.5 66.4c17.1 5.8 36.4.3 47.9-13.5s13.2-33.3 4.2-48.9l-45.8-79.3 23.5-164.7c1.8-12.8-4.3-25.5-16.7-32.3M175 142.1l54.8-39.3 54.8 39.3-54.8 39.3L175 142.1m14.2 119l45.8-32.9L281 261l-45.8 32.9-46-32.8z"></path>
          </svg>
          <span className={styles.brandText}>shopify</span>
        </div>

        <nav className={styles.navigation}>
          <button
            onClick={() => router.push("/admin")}
            className={`${styles.navLink} ${activeTab === "home" ? styles.navLinkActive : ""}`}
          >
            Home
          </button>
          <button
            onClick={() => { setLastOrdersView(Date.now()); setNewOrderCount(0); router.push("/admin?tab=orders"); }}
            className={`${styles.navLink} ${activeTab === "orders" ? styles.navLinkActive : ""}`}
          >
            Orders
            {newOrderCount > 0 && (
              <span className={styles.badgeCount}>{newOrderCount}</span>
            )}
          </button>
          <button
            onClick={() => router.push("/admin?tab=products")}
            className={`${styles.navLink} ${activeTab === "products" ? styles.navLinkActive : ""}`}
          >
            Products
          </button>
          <button
            onClick={() => router.push("/admin?tab=discounts")}
            className={`${styles.navLink} ${activeTab === "discounts" ? styles.navLinkActive : ""}`}
          >
            Discounts
          </button>
          <button
            onClick={() => router.push("/admin?tab=analytics")}
            className={`${styles.navLink} ${activeTab === "analytics" ? styles.navLinkActive : ""}`}
          >
            Business Insights
          </button>
          <button
            onClick={() => { setLastAbCartView(Date.now()); setNewAbCartCount(0); router.push("/admin?tab=aborted-cart"); }}
            className={`${styles.navLink} ${activeTab === "aborted-cart" ? styles.navLinkActive : ""}`}
          >
            Aborted Cart
            {newAbCartCount > 0 && (
              <span className={styles.badgeCount}>{newAbCartCount}</span>
            )}
          </button>
          <button
            onClick={() => { setLastAbCheckoutView(Date.now()); setNewAbCheckoutCount(0); router.push("/admin?tab=abandoned-checkouts"); }}
            className={`${styles.navLink} ${activeTab === "abandoned-checkouts" ? styles.navLinkActive : ""}`}
          >
            Checkouts
            {newAbCheckoutCount > 0 && (
              <span className={styles.badgeCount}>{newAbCheckoutCount}</span>
            )}
          </button>
          <button
            onClick={() => router.push("/admin?tab=reviews")}
            className={`${styles.navLink} ${activeTab === "reviews" ? styles.navLinkActive : ""}`}
          >
            Reviews
          </button>
          <button
            onClick={() => router.push("/admin?tab=faq")}
            className={`${styles.navLink} ${activeTab === "faq" ? styles.navLinkActive : ""}`}
          >
            FAQ
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            onClick={() => {
              localStorage.removeItem("admin_access_token");
              localStorage.removeItem("admin_refresh_token");
              setIsLoggedIn(false);
            }}
            className={styles.logoutBtn}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className={styles.mainPanel}>
        <header className={styles.dashboardHeader}>
          <h2>Shopify Store Administration</h2>
          <Link href="/" className={styles.viewOnlineStore}>
            View online store
          </Link>
        </header>

        {manifestText && (
          <div className={styles.toastNotification}>
            <span>{manifestText}</span>
          </div>
        )}

        {/* TAB 1: DASHBOARD HOME */}
        {activeTab === "home" && (
          <div className={styles.tabContent}>
            <div className={styles.tabTitleArea}>
              <h3>Supplier Dashboard</h3>
              <p>Welcome to your Shopify store administration panel. Manage orders, products, discounts, and view analytics.</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div className={styles.todoCard}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Total Sales</span>
                  <strong style={{ fontSize: "24px", color: "#111827", marginTop: "4px" }}>₹{totalSales.toLocaleString("en-IN")}</strong>
                  <span style={{ fontSize: "11px", color: "#008060", marginTop: "4px" }}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> Lifetime revenue</span>
                </div>
              </div>
              <div className={styles.todoCard}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Total Orders</span>
                  <strong style={{ fontSize: "24px", color: "#111827", marginTop: "4px" }}>{totalOrdersCount}</strong>
                  <span style={{ fontSize: "11px", color: "#0284c7", marginTop: "4px" }}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> All time orders</span>
                </div>
              </div>
              <div className={styles.todoCard}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Active Products</span>
                  <strong style={{ fontSize: "24px", color: "#111827", marginTop: "4px" }}>{activeProductsCount}</strong>
                  <span style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> In catalog</span>
                </div>
              </div>
              <div className={styles.todoCard}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Discount Codes</span>
                  <strong style={{ fontSize: "24px", color: "#111827", marginTop: "4px" }}>{discountCodesCount}</strong>
                  <span style={{ fontSize: "11px", color: "#8b5cf6", marginTop: "4px" }}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> Active coupons</span>
                </div>
              </div>
            </div>

              {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginBottom: "24px" }}>
              <div className={styles.inventoryFullCard}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Revenue Trend</h4>
                <div style={{ height: "240px", position: "relative" }}>
                  {(() => {
                    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const revenueByDay = Array(7).fill(0);
                    orders.forEach(o => { const d = new Date(o.date); if (!isNaN(d.getTime())) { revenueByDay[d.getDay()] += o.total; } });
                    const labels = dayNames;
                    const data = revenueByDay;
                    return (
                      <Line
                        data={{
                          labels,
                          datasets: [{ label: "Sales (₹)", data,
                        borderColor: "#008060",
                        backgroundColor: "rgba(0,128,96,0.1)",
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: "#008060"
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false } },
                        y: { ticks: { callback: (v) => "₹" + v } }
                      }
                    }}
                  />
                )})()}
                </div>
              </div>
              <div className={styles.inventoryFullCard}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Category Distribution</h4>
                <div style={{ height: "240px", position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Pie
                    data={{
                      labels: [...new Set(products.map(p => p.category))].map(c => c.replace("-", " ")),
                      datasets: [{
                        data: [...new Set(products.map(p => p.category))].map(c => products.filter(p => p.category === c).length),
                        backgroundColor: ["#008060", "#0284c7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#10b981"],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Order Trends Bar Chart */}
            <div className={styles.inventoryFullCard} style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Order Status Distribution</h4>
              <div style={{ height: "200px", position: "relative" }}>
                <Bar
                  data={{
                    labels: ["Processing", "Shipped", "Delivered"],
                    datasets: [{
                      label: "Orders",
                      data: [
                        orders.filter(o => o.status === "Processing").length,
                        orders.filter(o => o.status === "Shipped").length,
                        orders.filter(o => o.status === "Delivered").length
                      ],
                      backgroundColor: ["#f59e0b", "#0284c7", "#008060"],
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false } },
                      y: { ticks: { precision: 0 } }
                    }
                  }}
                />
              </div>
            </div>

            {/* Supplier Dashboard Action Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              <div className={styles.todoCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  <strong>Orders to Fulfill</strong>
                </div>
                <p style={{ fontSize: "28px", fontWeight: "700", color: "#f59e0b" }}>
                  {orders.filter(o => o.status === "Processing").length}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Pending processing orders</p>
              </div>
              <div className={styles.todoCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <strong>Low Stock Alerts</strong>
                </div>
                <p style={{ fontSize: "28px", fontWeight: "700", color: "#ef4444" }}>
                  {products.filter(p => {
                    const st = p.specs["Stock Status"] || "0 Units Available";
                    const num = parseInt(st.replace(/[^0-9]/g, "")) || 0;
                    return num < 5;
                  }).length}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Products with less than 5 units</p>
              </div>
              <div className={styles.todoCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  <strong>Active Discounts</strong>
                </div>
                <p style={{ fontSize: "28px", fontWeight: "700", color: "#8b5cf6" }}>
                  {promoCodes.length + products.filter(p => p.salePrice !== undefined).length}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Coupons + Markdown offers</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (() => {
          const STATUS_LIST = ["Pending", "Processing", "Shipped", "Delivered", "OnHold", "Return", "Cancelled", "Archived"];
          const STATUS_COLORS: Record<string, string> = {
            Pending: "#fef3c7", Processing: "#fef3c7", Shipped: "#dbeafe", Delivered: "#d1fae5",
            OnHold: "#ffe4e6", Return: "#ffedd5", Cancelled: "#f3f4f6", Archived: "#f3f4f6"
          };
          const STATUS_TEXT_COLORS: Record<string, string> = {
            Pending: "#92400e", Processing: "#92400e", Shipped: "#1e40af", Delivered: "#065f46",
            OnHold: "#9f1239", Return: "#9a3412", Cancelled: "#6b7280", Archived: "#6b7280"
          };
          const statusCounts: Record<string, number> = {};
          STATUS_LIST.forEach(s => statusCounts[s] = orders.filter((o: any) => o.status === s).length);

          const filteredOrders = orderFilter === "all" ? orders : orders.filter((o: any) => o.status === orderFilter);

          return (
            <div className={styles.tabContent}>
              <div className={styles.tabTitleArea}>
                <h3>Order Management</h3>
                <p>View, process, and fulfill customer orders</p>
              </div>

              {/* Status Tabs */}
              <div className={styles.statusTabs}>
                <button
                  onClick={() => setOrderFilter("all")}
                  className={`${styles.statusTab} ${orderFilter === "all" ? styles.statusTabActive : ""}`}
                >
                  All
                  <span className={styles.statusTabCount}>{orders.length}</span>
                </button>
                {STATUS_LIST.map(s => (
                  <button
                    key={s}
                    onClick={() => setOrderFilter(s)}
                    className={`${styles.statusTab} ${orderFilter === s ? styles.statusTabActive : ""}`}
                    style={orderFilter === s ? {
                      borderBottomColor: STATUS_TEXT_COLORS[s],
                      color: STATUS_TEXT_COLORS[s]
                    } : {}}
                  >
                    <span className={styles.statusDot} style={{ backgroundColor: STATUS_TEXT_COLORS[s] }} />
                    {s}
                    <span className={styles.statusTabCount}>{statusCounts[s]}</span>
                  </button>
                ))}
              </div>

              {/* Orders Table */}
              <div className={styles.tableScrollWrapper}>
                <table className={styles.shopifyTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>Image</th>
                      <th>Product</th>
                      <th style={{ width: "80px" }}>Variant</th>
                      <th style={{ width: "50px" }}>Qty</th>
                      <th style={{ width: "100px" }}>Order ID</th>
                      <th style={{ width: "90px" }}>Status</th>
                      <th style={{ width: "40px" }}>Def</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No orders found</td></tr>
                    ) : filteredOrders.map((order: any) => (
                      <tr key={order.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/order/${order.id}`)}>
                        <td>
                          {order.items?.[0]?.product?.image ? (
                            <img src={order.items[0].product.image} alt="" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
                          ) : order.items?.[0]?.image ? (
                            <img src={order.items[0].image} alt="" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "40px", height: "40px", borderRadius: "4px", background: "#f3f4f6" }} />
                          )}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: "13px" }}>
                          {order.items?.map((i: any) => i.product?.name || i.name || i.title).filter(Boolean).join(", ") || "—"}
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {order.items?.map((i: any) => {
                            const p = i.product;
                            return [p?.size, p?.material].filter(Boolean).join(" / ");
                          }).filter(Boolean).join(", ") || "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>{order.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0}</td>
                        <td style={{ fontSize: "12px", fontFamily: "monospace" }}>{order.id}</td>
                        <td>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", backgroundColor: STATUS_COLORS[order.status] || "#f3f4f6", color: STATUS_TEXT_COLORS[order.status] || "#6b7280" }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {order.defaultOrdered ? (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: PRODUCTS & INVENTORY */}
        {activeTab === "products" && (() => {
          const filteredInventory = products.filter(p =>
            p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
            p.category.toLowerCase().includes(inventorySearch.toLowerCase())
          );
          if (showAddForm !== "none") {
            if (showAddForm === "single") {
              return (
                <div className={styles.tabContent}>
                  {/* Single Product Form */}
                  <div className={styles.tabTitleArea}>
                    <div>
                      <h3>{editingProductId ? "Edit Product" : "Add Single Product"}</h3>
                      <p>Fill in the product details below</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {lastAutoSave && (
                          <span style={{ fontSize: "11px", color: "#008060", fontWeight: 500 }}>
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#008060" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><polyline points="20 6 9 17 4 12"/></svg>
                            Auto-saved at {lastAutoSave}
                          </span>
                      )}
                      <button
                        onClick={() => {
                          setShowAddForm("none");
                          setEditingProductId(null);
                          setDraftId(null);
                          setLastAutoSave("");
                        }}
                        className={styles.btnSecondary}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to Inventory
                      </button>
                    </div>
                  </div>

                  {prodMessage && <div className={styles.formAlert}>{prodMessage}</div>}

                  <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
                    <div className={styles.formMainContent} style={{ flex: 1 }}>
                      {/* SECTION: BASIC INFO */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Basic Information</h4>
                        <div className={styles.formRow}>
                          <label>Product Name *</label>
                          <input type="text" placeholder="e.g. Premium Cotton T-Shirt" value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Selling Price (₹) *</label>
                            <input type="number" placeholder="e.g. 1299" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                          </div>
                          <div className={styles.formRow}>
                            <label>Original Price (₹)</label>
                            <input type="number" placeholder="e.g. 1999" value={prodOrigPrice} onChange={(e) => setProdOrigPrice(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Cost Price (₹)</label>
                            <input type="number" placeholder="e.g. 800" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>GST (%)</label>
                            <input type="text" placeholder="e.g. 18%" value={gst} onChange={(e) => setGst(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formRow}>
                          <label>Category *</label>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <select value={isNewCategory ? "__new__" : prodCategory} onChange={(e) => { if (e.target.value === "__new__") { setIsNewCategory(true); } else { setIsNewCategory(false); setProdCategory(e.target.value); } }} className={styles.categorySelectorDropdown} style={{ flex: 1 }}>
                              <option value="apparel-accessories">Apparel & Accessories</option>
                              <option value="electronics">Electronics</option>
                              <option value="home-kitchen">Home & Kitchen</option>
                              <option value="beauty-personal-care">Beauty & Personal Care</option>
                              <option value="books-stationery">Books & Stationery</option>
                              <option value="sports-fitness">Sports & Fitness</option>
                              <option value="toys-games">Toys & Games</option>
                              <option value="automotive">Automotive</option>
                              <option value="grocery">Grocery</option>
                              <option value="jewelry">Jewelry</option>
                              <option value="__new__">+ Add New Category</option>
                            </select>
                            {isNewCategory && <input type="text" placeholder="New category name" value={newCategoryVal} onChange={(e) => setNewCategoryVal(e.target.value)} style={{ flex: 1 }} />}
                          </div>
                        </div>
                      </div>

                      {/* SECTION: DESCRIPTION */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Description</h4>
                        <div className={styles.formRow}>
                          <label>Short Description *</label>
                          <textarea rows={3} placeholder="Brief product description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} required />
                        </div>
                        <div className={styles.formRow}>
                          <label>Long Description</label>
                          <textarea rows={6} placeholder="Detailed product description with features and benefits" value={prodLongDesc} onChange={(e) => setProdLongDesc(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Features (one per line)</label>
                          <textarea rows={4} placeholder="Feature 1&#10;Feature 2&#10;Feature 3" value={prodFeatures} onChange={(e) => setProdFeatures(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Bought Text (e.g. "10+ bought this week")</label>
                          <input type="text" placeholder="e.g. 10+ bought in last month" value={prodBoughtText} onChange={(e) => setProdBoughtText(e.target.value)} />
                        </div>
                      </div>

                      {/* SECTION: SPECIFICATIONS */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Specifications</h4>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Stock Quantity</label>
                            <input type="number" placeholder="e.g. 50" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Supplier SKU / Custom ID</label>
                            <input type="text" placeholder="e.g. SP-1234" value={customId} onChange={(e) => setCustomId(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>HSN Code</label>
                            <input type="text" placeholder="e.g. 6109" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Net Weight</label>
                            <input type="text" placeholder="e.g. 250g" value={netWeight} onChange={(e) => setNetWeight(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Size</label>
                            <input type="text" placeholder="e.g. M, 42, XL" value={size} onChange={(e) => setSize(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Material</label>
                            <input type="text" placeholder="e.g. Cotton, Leather" value={material} onChange={(e) => setMaterial(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Generic Name</label>
                            <input type="text" placeholder="e.g. T-Shirt" value={genericName} onChange={(e) => setGenericName(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Net Quantity</label>
                            <input type="text" placeholder="e.g. 1, 2, 5" value={netQuantity} onChange={(e) => setNetQuantity(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Included Components</label>
                            <input type="text" placeholder="e.g. 1 T-Shirt, 1 Gift Box" value={includedComponents} onChange={(e) => setIncludedComponents(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Country of Origin</label>
                            <input type="text" placeholder="e.g. India" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Voltage</label>
                            <input type="text" placeholder="e.g. 220V" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Wattage</label>
                            <input type="text" placeholder="e.g. 50W" value={wattage} onChange={(e) => setWattage(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* SECTION: PACKAGING DIMENSIONS */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Packaging Dimensions</h4>
                        <div className={styles.formThreeSplitRow}>
                          <div className={styles.formRow}>
                            <label>Breadth (cm)</label>
                            <input type="text" placeholder="e.g. 15" value={packagingBreadth} onChange={(e) => setPackagingBreadth(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Height (cm)</label>
                            <input type="text" placeholder="e.g. 10" value={packagingHeight} onChange={(e) => setPackagingHeight(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Length (cm)</label>
                            <input type="text" placeholder="e.g. 20" value={packagingLength} onChange={(e) => setPackagingLength(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* SECTION: PRODUCT DIMENSIONS */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Product Dimensions</h4>
                        <div className={styles.formThreeSplitRow}>
                          <div className={styles.formRow}>
                            <label>Breadth</label>
                            <input type="text" placeholder="e.g. 14" value={productBreadth} onChange={(e) => setProductBreadth(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Height</label>
                            <input type="text" placeholder="e.g. 9" value={productHeight} onChange={(e) => setProductHeight(e.target.value)} />
                          </div>
                          <div className={styles.formRow}>
                            <label>Length</label>
                            <input type="text" placeholder="e.g. 18" value={productLength} onChange={(e) => setProductLength(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Unit</label>
                            <select value={productUnit} onChange={(e) => setProductUnit(e.target.value)} className={styles.categorySelectorDropdown}>
                              <option value="cm">Centimeters (cm)</option>
                              <option value="inches">Inches (in)</option>
                              <option value="mm">Millimeters (mm)</option>
                            </select>
                          </div>
                          <div className={styles.formRow}>
                            <label>Weight</label>
                            <input type="text" placeholder="e.g. 0.5" value={productWeight} onChange={(e) => setProductWeight(e.target.value)} />
                          </div>
                        </div>
                        <div className={styles.formRow}>
                          <label>Weight Unit</label>
                          <select value={productWeightUnit} onChange={(e) => setProductWeightUnit(e.target.value)} className={styles.categorySelectorDropdown}>
                            <option value="kg">Kilograms (kg)</option>
                            <option value="g">Grams (g)</option>
                            <option value="lbs">Pounds (lbs)</option>
                          </select>
                        </div>
                      </div>

                      {/* SECTION: MANUFACTURER / PACKER / IMPORTER */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Manufacturer Details</h4>
                        <div className={styles.formRow}>
                          <label>Manufacturer Name</label>
                          <input type="text" placeholder="Company name" value={mfgName} onChange={(e) => setMfgName(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Manufacturer Address</label>
                          <textarea rows={2} placeholder="Full address" value={mfgAddress} onChange={(e) => setMfgAddress(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Manufacturer Pincode</label>
                          <input type="text" placeholder="e.g. 110001" value={mfgPincode} onChange={(e) => setMfgPincode(e.target.value)} />
                        </div>

                        <div className={styles.sectionDivider}>Packer Details</div>
                        <div className={styles.formRow}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
                            <input type="checkbox" checked={sameAsMfg} onChange={(e) => setSameAsMfg(e.target.checked)} />
                            Same as Manufacturer
                          </label>
                        </div>
                        {!sameAsMfg && (
                          <>
                            <div className={styles.formRow}>
                              <label>Packer Name</label>
                              <input type="text" placeholder="Company name" value={packerName} onChange={(e) => setPackerName(e.target.value)} />
                            </div>
                            <div className={styles.formRow}>
                              <label>Packer Address</label>
                              <textarea rows={2} placeholder="Full address" value={packerAddress} onChange={(e) => setPackerAddress(e.target.value)} />
                            </div>
                            <div className={styles.formRow}>
                              <label>Packer Pincode</label>
                              <input type="text" placeholder="e.g. 110001" value={packerPincode} onChange={(e) => setPackerPincode(e.target.value)} />
                            </div>
                          </>
                        )}

                        <div className={styles.sectionDivider}>Importer Details</div>
                        <div className={styles.formRow}>
                          <label>Importer Name</label>
                          <input type="text" placeholder="Company name" value={importerName} onChange={(e) => setImporterName(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Importer Address</label>
                          <textarea rows={2} placeholder="Full address" value={importerAddress} onChange={(e) => setImporterAddress(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Importer Pincode</label>
                          <input type="text" placeholder="e.g. 110001" value={importerPincode} onChange={(e) => setImporterPincode(e.target.value)} />
                        </div>
                      </div>

                      {/* SECTION: CUSTOM ATTRIBUTES */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Custom Attributes</h4>
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                          <div className={styles.formRow} style={{ flex: 1, margin: 0 }}>
                            <label style={{ fontSize: "10px" }}>Key</label>
                            <input type="text" placeholder="e.g. Fabric" value={attrKey} onChange={(e) => setAttrKey(e.target.value)} />
                          </div>
                          <div className={styles.formRow} style={{ flex: 1, margin: 0 }}>
                            <label style={{ fontSize: "10px" }}>Value</label>
                            <input type="text" placeholder="e.g. Pure Cotton" value={attrVal} onChange={(e) => setAttrVal(e.target.value)} />
                          </div>
                          <button onClick={handleAddAttribute} className={styles.btnPrimary} style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>Add</button>
                        </div>
                        {customAttributes.length > 0 && (
                          <div className={styles.attributesPreviewContainer}>
                            <h5>Added Attributes ({customAttributes.length})</h5>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {customAttributes.map((attr, idx) => (
                                <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#f3f4f6", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                                  <strong>{attr.key}:</strong> {attr.value}
                                  <button onClick={() => handleRemoveAttribute(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "14px", padding: "0", lineHeight: 1 }}>×</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* SECTION: SEO */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Search Engine Optimization</h4>
                        <div className={styles.formRow}>
                          <label>Meta Title</label>
                          <input type="text" placeholder="SEO title (defaults to product name)" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Meta Description</label>
                          <textarea rows={2} placeholder="SEO description (defaults to short description)" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Meta Keywords</label>
                          <input type="text" placeholder="Comma separated keywords" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} />
                        </div>
                        <div className={styles.formRow}>
                          <label>Tags</label>
                          <input type="text" placeholder="Comma separated tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
                        </div>
                      </div>

                      {/* SECTION: POLICIES */}
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Return Policy & Shipping</h4>
                        <div className={styles.formRow}>
                          <label>Return Policy</label>
                          <select value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} className={styles.categorySelectorDropdown}>
                            <option value="7_days_return_replacement">7 Days Return & Replacement</option>
                            <option value="10_days_return_replacement">10 Days Return & Replacement</option>
                            <option value="15_days_return_replacement">15 Days Return & Replacement</option>
                            <option value="30_days_return_replacement">30 Days Return & Replacement</option>
                            <option value="no_return">No Returns Accepted</option>
                          </select>
                        </div>
                        <div className={styles.formRow}>
                          <label>Warranty Details</label>
                          <input type="text" placeholder="e.g. 1 Year Manufacturer Warranty" value={warrantyDetails} onChange={(e) => setWarrantyDetails(e.target.value)} />
                        </div>
                        <div className={styles.formSplitRow}>
                          <div className={styles.formRow}>
                            <label>Delivery Type</label>
                            <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className={styles.categorySelectorDropdown}>
                              <option value="free">Free Delivery</option>
                              <option value="flat">Flat Fee Delivery</option>
                              <option value="calculated">Calculated at Checkout</option>
                            </select>
                          </div>
                          {deliveryType === "flat" && (
                            <div className={styles.formRow}>
                              <label>Delivery Fee (₹)</label>
                              <input type="number" placeholder="e.g. 99" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
                            </div>
                          )}
                        </div>
                        {deliveryType !== "calculated" && (
                          <div className={styles.formRow}>
                            <label>Minimum Order for Free Delivery (₹)</label>
                            <input type="number" placeholder="Leave empty for no minimum" value={deliveryMinOrder} onChange={(e) => setDeliveryMinOrder(e.target.value)} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* IMAGES SIDEBAR */}
                    <div className={styles.formMediaSidebar} style={{ width: "340px", flexShrink: 0 }}>
                      <div className={styles.formSectionCard}>
                        <h4 className={styles.sectionHeader}>Media</h4>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px" }}>Add up to 9 images. Drag & drop or browse to upload.</p>

                        {/* Drop Zone */}
                        <div
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          style={{
                            border: "2px dashed #d1d5db", borderRadius: "10px", padding: "28px 20px",
                            textAlign: "center", cursor: "pointer", marginBottom: "16px",
                            background: "#f9fafb", transition: "border-color 0.2s"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#008060")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                        >
                          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <p style={{ fontSize: "13px", color: "#374151", fontWeight: 600, margin: "10px 0 4px" }}>Drop images here</p>
                          <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>
                            or <span style={{ color: "#008060", fontWeight: 600, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); document.getElementById("cloudinary-file-input")?.click(); }}>browse files</span>
                          </p>
                          <input
                            id="cloudinary-file-input"
                            type="file" accept="image/*" multiple
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              files.forEach((file, i) => {
                                const targetIdx = imageUrls.findIndex(u => !u.trim());
                                if (targetIdx === -1 && imageUrls.length < 9) {
                                  handleAddImageUrl({ preventDefault: () => {} } as any);
                                  setTimeout(() => handleCloudinaryUpload(imageUrls.length, { target: { files: [file] } } as any), 100 * i);
                                } else if (targetIdx !== -1) {
                                  handleCloudinaryUpload(targetIdx, { target: { files: [file] } } as any);
                                }
                              });
                            }}
                          />
                        </div>

                        {/* Image Gallery Grid */}
                        {imageUrls.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                            {imageUrls.map((url, idx) => (
                              <div key={idx} style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                padding: "6px", border: "1px solid #e5e7eb", borderRadius: "8px",
                                background: url.trim() ? "#fff" : "#f9fafb"
                              }}>
                                {/* Thumbnail */}
                                <div style={{
                                  width: "48px", height: "48px", borderRadius: "6px",
                                  overflow: "hidden", flexShrink: 0,
                                  background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                  {url.trim() ? (
                                    <img src={url} alt={`Image ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                                  ) : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                  )}
                                </div>
                                {/* URL Input */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <input
                                    type="text"
                                    placeholder="Paste image URL or upload"
                                    value={url}
                                    onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                                    style={{
                                      width: "100%", fontSize: "11px", padding: "5px 8px",
                                      border: "1px solid #e5e7eb", borderRadius: "5px", outline: "none",
                                      boxSizing: "border-box"
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = "#008060")}
                                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                                  />
                                </div>
                                {/* Actions */}
                                <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                                  <input type="file" accept="image/*" id={`file-${idx}`} style={{ display: "none" }} onChange={(e) => handleCloudinaryUpload(idx, e)} />
                                  <button
                                    onClick={() => document.getElementById(`file-${idx}`)?.click()}
                                    title="Upload from computer"
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", color: "#6b7280" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                  >
                                    {uploadingIndex === idx ? (
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#008060" strokeWidth="2" className={styles.spinnerIcon}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    ) : (
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    )}
                                  </button>
                                  {idx > 0 && (
                                    <button onClick={(e) => moveImageUp(idx, e)} title="Move up" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", color: "#6b7280" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                                    </button>
                                  )}
                                  {idx < imageUrls.length - 1 && (
                                    <button onClick={(e) => moveImageDown(idx, e)} title="Move down" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", color: "#6b7280" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                                    </button>
                                  )}
                                  <button onClick={() => handleRemoveImageUrl(idx)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", color: "#ef4444" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                  >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Image Button */}
                        {imageUrls.length < 9 && (
                          <button
                            onClick={handleAddImageUrl}
                            style={{
                              width: "100%", padding: "10px", fontSize: "12px", fontWeight: 600,
                              border: "1px dashed #d1d5db", borderRadius: "8px", background: "none",
                              cursor: "pointer", color: "#6b7280"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#008060"; e.currentTarget.style.color = "#008060"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#6b7280"; }}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add Image
                          </button>
                        )}
                        <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "8px", textAlign: "center" }}>{imageUrls.length} / 9 images</p>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px", padding: "16px 0", borderTop: "1px solid var(--border-color)" }}>
                    <button
                      onClick={() => handleAddProductSubmit("draft")}
                      disabled={prodSaving}
                      className={styles.btnSecondary}
                      style={{ padding: "10px 24px", fontSize: "14px" }}
                    >
                      {prodSaving ? "Saving..." : "Save as Draft"}
                    </button>
                    <button
                      onClick={() => handleAddProductSubmit("published")}
                      disabled={prodSaving}
                      className={styles.btnPrimaryFull}
                      style={{ padding: "10px 24px", fontSize: "14px" }}
                    >
                      {prodSaving ? "Publishing..." : editingProductId ? "Update Product" : "Publish Product"}
                    </button>
                  </div>
                </div>
              );
            }
            if (showAddForm === "bulk") {
              return (
                <div className={styles.tabContent}>
                  <div className={styles.tabTitleArea}>
                    <h3>Bulk Upload Products</h3>
                    <p>Paste JSON array of products for batch import</p>
                    <button
                      onClick={() => setShowAddForm("none")}
                      className={styles.btnSecondary}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to Inventory
                    </button>
                  </div>
                  {bulkMessage && <div className={styles.formAlert}>{bulkMessage}</div>}
                  <div className={styles.formSectionCard} style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <form onSubmit={handleBulkUploadSubmit}>
                      <div className={styles.formRow}>
                        <label>Product JSON Data *</label>
                        <textarea
                          rows={16}
                          placeholder='[{&#10;  "name": "Product Name",&#10;  "price": 1299,&#10;  "category": "apparel-accessories",&#10;  "description": "Product description"&#10;}]'
                          value={bulkJsonText}
                          onChange={(e) => setBulkJsonText(e.target.value)}
                          style={{ fontFamily: "monospace", fontSize: "12px" }}
                          required
                        />
                      </div>
                      <div className={styles.formRow}>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Paste a JSON array of product objects. Required fields: <code>name</code>, <code>price</code>. Optional fields: <code>category</code>, <code>description</code>, <code>image</code>, <code>specs</code>, <code>features</code>, etc.
                        </p>
                      </div>
                      <button type="submit" className={styles.btnPrimaryFull}>
                        Upload Bulk Products
                      </button>
                    </form>
                  </div>
                </div>
              );
            }
          }
          return (
            <div className={styles.tabContent}>
              <div className={styles.tabTitleArea} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3>Products & Inventory</h3>
                  <p>Manage your product catalog, stock levels, and variants</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => { setShowAddForm("single"); setDraftId(null); setLastAutoSave(""); }} className={styles.modeToggleActive} style={{ backgroundColor: "#008060", borderColor: "#008060", color: "white" }}>
                    + Add Product
                  </button>
                  <button onClick={() => setShowAddForm("bulk")} className={styles.modeToggleActive} style={{ backgroundColor: "#0284c7", borderColor: "#0284c7", color: "white" }}>
                    + Bulk Upload
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid #e1e3e5",
                    borderRadius: "8px", fontSize: "13px", outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Inventory Table */}
              <div className={styles.inventoryFullCard} style={{ padding: 0 }}>
                <div className={styles.tableScrollWrapper}>
                  <table className={styles.shopifyTable}>
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>Image</th>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th style={{ width: "60px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                            {inventorySearch ? "No products match your search." : "No products yet. Click '+ Add Product' to create one."}
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map(item => (
                          <tr key={item.id}>
                            <td>
                              {item.image || item.images?.[0] ? (
                                <img
                                  src={item.image || item.images![0]}
                                  alt={item.name}
                                  style={{ width: "36px", height: "36px", borderRadius: "4px", objectFit: "cover" }}
                                  onError={(e) => { (e.target as HTMLImageElement).src = NO_IMAGE; }}
                                />
                              ) : (
                                <img src={NO_IMAGE} alt="" style={{ width: "36px", height: "36px", borderRadius: "4px" }} />
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 600, fontSize: "13px" }}>{item.name}</span>
                                <span style={{ fontSize: "11px", color: "#6b7280" }}>{item.category?.replace("-", " ")} · {item.id?.substring(0, 12)}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: "11px", color: "#6b7280" }}>
                              {[item.size, item.material, item.genericName].filter(Boolean).join(" · ") || "—"}
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              ₹{item.price.toLocaleString("en-IN")}
                            </td>
                            <td>
                              {editingStockId === item.id ? (
                                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={editingStockValue}
                                    onChange={(e) => setEditingStockValue(e.target.value.replace(/\D/g, ""))}
                                    style={{
                                      width: "50px", padding: "4px 6px", border: "1px solid #008060",
                                      borderRadius: "4px", fontSize: "12px", textAlign: "center", outline: "none"
                                    }}
                                    autoFocus
                                  />
                                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Units</span>
                                  <button
                                    onClick={() => {
                                      updateProduct({
                                        ...item,
                                        specs: { ...item.specs, "Stock Status": `${Number(editingStockValue) || 0} Units Available` }
                                      });
                                      setEditingStockId(null);
                                    }}
                                    style={{
                                      background: "#008060", color: "#fff", border: "none",
                                      borderRadius: "4px", padding: "4px 8px", fontSize: "11px",
                                      fontWeight: 600, cursor: "pointer"
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingStockId(null)}
                                    style={{
                                      background: "none", border: "1px solid #e1e3e5",
                                      borderRadius: "4px", padding: "4px 8px", fontSize: "11px",
                                      cursor: "pointer"
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <span style={{ fontWeight: 500 }}>
                                    {(() => {
                                      const st = item.specs["Stock Status"] || "0 Units Available";
                                      const num = parseInt(st.replace(/[^0-9]/g, "")) || 0;
                                      return `${num} Units`;
                                    })()}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const num = parseInt((item.specs["Stock Status"] || "0").replace(/[^0-9]/g, "")) || 0;
                                      setEditingStockValue(String(num));
                                      setEditingStockId(item.id);
                                    }}
                                    title="Edit stock"
                                    style={{
                                      background: "none", border: "none", cursor: "pointer",
                                      fontSize: "13px", padding: "2px", color: "#6b7280"
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  </button>
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                                <button
                                  onClick={(e) => handleToggleMenu(item.id, e)}
                                  style={{
                                    background: "none", border: "none", cursor: "pointer",
                                    fontSize: "18px", fontWeight: 700, color: "#6b7280",
                                    padding: "4px 8px", borderRadius: "4px", lineHeight: 1
                                  }}
                                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#f3f4f6"}
                                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "transparent"}
                                >
                                  ⋮
                                </button>
                                {openMenuId === item.id && menuPosition && (
                                  <div
                                    style={{
                                      position: "fixed", top: menuPosition.top, left: menuPosition.left, zIndex: 9999,
                                      backgroundColor: "#fff", border: "1px solid #e1e3e5",
                                      borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                      minWidth: "150px", padding: "4px 0"
                                    }}
                                  >
                                    <button
                                      onClick={() => handleEditProduct(item)}
                                      style={{
                                        display: "block", width: "100%", textAlign: "left",
                                        padding: "8px 16px", border: "none", background: "none",
                                        fontSize: "13px", cursor: "pointer", fontWeight: 500
                                      }}
                                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#f9fafb"}
                                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "transparent"}
                                    >
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                                    </button>
                                    <button
                                      onClick={() => handleAddVariant(item)}
                                      style={{
                                        display: "block", width: "100%", textAlign: "left",
                                        padding: "8px 16px", border: "none", background: "none",
                                        fontSize: "13px", cursor: "pointer", fontWeight: 500
                                      }}
                                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#f9fafb"}
                                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "transparent"}
                                    >
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> Add Variant
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newStatus = item.status === "published" ? "draft" : "published";
                                        updateProduct({ ...item, status: newStatus });
                                        setOpenMenuId(null);
                                      }}
                                      style={{
                                        display: "block", width: "100%", textAlign: "left",
                                        padding: "8px 16px", border: "none", background: "none",
                                        fontSize: "13px", cursor: "pointer", fontWeight: 500
                                      }}
                                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#f9fafb"}
                                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "transparent"}
                                    >
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> {item.status === "published" ? "Unpublish" : "Publish"}
                                    </button>
                                    <div style={{ borderTop: "1px solid #e1e3e5", margin: "4px 0" }}></div>
                                    <button
                                      onClick={() => { deleteProduct(item.id); setOpenMenuId(null); }}
                                      style={{
                                        display: "block", width: "100%", textAlign: "left",
                                        padding: "8px 16px", border: "none", background: "none",
                                        fontSize: "13px", cursor: "pointer", fontWeight: 500, color: "#ef4444"
                                      }}
                                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#fef2f2"}
                                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "transparent"}
                                    >
                                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}



        {/* TAB 4: DISCOUNTS & MARKETING OFFERS */}
        {activeTab === "discounts" && (
          <div className={styles.tabContent}>
            <div className={styles.tabTitleArea} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h3>Discounts, Coupons & Store Offers</h3>
                <p>Configure dynamic checkout coupons and direct product markdown sales</p>
              </div>
              
              {/* Add Coupon & Add Offer Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                {discountSubView === "list" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDiscountSubView("add-coupon")}
                      className={styles.modeToggleActive}
                      style={{ backgroundColor: "#008060", borderColor: "#008060", color: "white" }}
                    >
                      + Add Coupon
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountSubView("add-offer")}
                      className={styles.modeToggleActive}
                      style={{ backgroundColor: "#0284c7", borderColor: "#0284c7", color: "white" }}
                    >
                      + Add Offer
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDiscountSubView("list")}
                    className={styles.btnSecondary}
                    style={{ color: "#ef4444", borderColor: "#ef4444" }}
                  >
                     <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Cancel / View Lists
                  </button>
                )}
              </div>
            </div>

            {/* CONDITIONAL SUB-VIEWS */}
            
            {/* VIEW 1: ADD COUPON */}
            {discountSubView === "add-coupon" && (
              <div style={{ maxWidth: "680px", margin: "0 auto" }} className={styles.createDiscountCard}>
                <h4>Create Advanced Coupon Code</h4>
                {promoMessage && <div className={styles.formAlert}>{promoMessage}</div>}

                <form onSubmit={handleAddPromoSubmit} className={styles.discountForm}>
                  <div className={styles.formRow}>
                    <label>Promo Code Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. MONSOON25"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formSplitRow}>
                    <div className={styles.formRow}>
                      <label>Coupon Type *</label>
                      <select
                        value={couponType}
                        onChange={(e) => setCouponType(e.target.value as any)}
                        className={styles.categorySelectorDropdown}
                      >
                        <option value="percentage">Percentage Coupon (%)</option>
                        <option value="flat">Flat Price Coupon (₹)</option>
                        <option value="cashback">Virtual Cashback Reward (₹)</option>
                      </select>
                    </div>

                    <div className={styles.formRow}>
                      <label>Discount Value *</label>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={couponValue}
                        onChange={(e) => setCouponValue(e.target.value)}
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow} style={{ borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ margin: 0 }}>Expiry Setting</label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", textTransform: "none", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={couponIsForever}
                          onChange={(e) => setCouponIsForever(e.target.checked)}
                        />
                        Forever / No Expiry Date
                      </label>
                    </div>

                    {!couponIsForever && (
                      <div className={styles.formSplitRow} style={{ marginTop: "10px" }}>
                        <div className={styles.formRow}>
                          <label style={{ fontSize: "10px" }}>Start Date</label>
                          <input
                            type="date"
                            value={couponStartDate}
                            onChange={(e) => setCouponStartDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className={styles.formRow}>
                          <label style={{ fontSize: "10px" }}>End Date</label>
                          <input
                            type="date"
                            value={couponEndDate}
                            onChange={(e) => setCouponEndDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.formSectionCard} style={{ border: "1px dashed var(--border-color)", padding: "16px", marginTop: "10px" }}>
                    <h5 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#008060", marginBottom: "12px", letterSpacing: "0.05em" }}>
                      Coupon Limitations & Criteria
                    </h5>

                    <div className={styles.formRow}>
                      <label>Minimum Order Value (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1999 (Leave empty for no limit)"
                        value={couponMinOrder}
                        onChange={(e) => setCouponMinOrder(e.target.value)}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <label>Target Locations (States or Pincodes)</label>
                      <input
                        type="text"
                        placeholder="e.g. Delhi, Maharashtra, 110001 (Comma separated)"
                        value={couponLocations}
                        onChange={(e) => setCouponLocations(e.target.value)}
                      />
                    </div>

                    <div className={styles.formRow} style={{ marginTop: "8px" }}>
                      <label>Target Category Lock</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#f9fafb", padding: "10px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                        {Array.from(new Set(products.map(p => p.category))).map(cat => (
                          <label key={cat} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", textTransform: "capitalize", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={couponSelectedCats.includes(cat)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCouponSelectedCats(prev => [...prev, cat]);
                                } else {
                                  setCouponSelectedCats(prev => prev.filter(c => c !== cat));
                                }
                              }}
                            />
                            {cat.replace("-", " ")}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={styles.formRow} style={{ marginTop: "8px" }}>
                      <label>Target Product Lock</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto", background: "#f9fafb", padding: "10px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                        {products.map(prod => (
                          <label key={prod.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={couponSelectedProds.includes(prod.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCouponSelectedProds(prev => [...prev, prod.id]);
                                } else {
                                  setCouponSelectedProds(prev => prev.filter(p => p !== prod.id));
                                }
                              }}
                            />
                            {prod.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className={styles.btnPrimaryFull} style={{ marginTop: "14px" }}>
                    Save & Deploy Coupon Code
                  </button>
                </form>
              </div>
            )}

            {/* VIEW 2: ADD OFFER */}
            {discountSubView === "add-offer" && (
              <div style={{ maxWidth: "680px", margin: "0 auto" }} className={styles.createDiscountCard}>
                <h4>Direct Product Markdown Offers</h4>
                <p className={styles.tipText} style={{ marginBottom: "16px" }}>
                  Set compare-price markdowns directly onto your product pages. This modifies the sale price displayed on the storefront.
                </p>
                {offerMessage && <div className={styles.formAlert} style={{ backgroundColor: "#e0f2fe", borderColor: "#38bdf8", color: "#0369a1" }}>{offerMessage}</div>}

                <form onSubmit={handleApplyOffer} className={styles.discountForm}>
                  <div className={styles.formRow}>
                    <label>Target Scope *</label>
                    <select
                      value={offerTargetType}
                      onChange={(e) => setOfferTargetType(e.target.value as any)}
                      className={styles.categorySelectorDropdown}
                    >
                      <option value="category">Whole Store Category</option>
                      <option value="product">Individual Specific Product</option>
                    </select>
                  </div>

                  {offerTargetType === "category" ? (
                    <div className={styles.formRow}>
                      <label>Select Category *</label>
                      <select
                        value={offerCategory}
                        onChange={(e) => setOfferCategory(e.target.value)}
                        className={styles.categorySelectorDropdown}
                        required
                      >
                        <option value="">-- Choose Category --</option>
                        {Array.from(new Set(products.map(p => p.category))).map(cat => (
                          <option key={cat} value={cat}>{cat.replace("-", " ").toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className={styles.formRow}>
                      <label>Select Product *</label>
                      <select
                        value={offerProduct}
                        onChange={(e) => setOfferProduct(e.target.value)}
                        className={styles.categorySelectorDropdown}
                        required
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.formRow}>
                    <label>Markdown Percentage Discount (%) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 15 (for 15% discount off retail price)"
                      value={offerDiscountPercent}
                      onChange={(e) => setOfferDiscountPercent(e.target.value)}
                      required
                      min="1"
                      max="99"
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>
                      Apply Sale Offer
                    </button>
                    <button
                      type="button"
                      onClick={handleClearOffers}
                      className={styles.btnSecondary}
                      style={{ color: "#ef4444", borderColor: "#ef4444" }}
                    >
                      Reset / Clear All Offers
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW 3: LISTS OF ACTIVE OFFERS & COUPONS */}
            {discountSubView === "list" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                
                {/* 1. Listed Coupons Card */}
                <div className={styles.inventoryFullCard}>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "18px" }}>Listed Active Checkout Coupons</h4>
                  
                  <div className={styles.tableScrollWrapper}>
                    <table className={styles.shopifyTable}>
                      <thead>
                        <tr>
                          <th>Coupon Code</th>
                          <th>Type</th>
                          <th>Value</th>
                          <th>Validity</th>
                          <th>Rules & Locks</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promoCodes.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                              No listed coupon codes found. Click "+ Add Coupon" to create one.
                            </td>
                          </tr>
                        ) : (
                          promoCodes.map((promo, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong style={{ color: "#008060", fontFamily: "monospace", fontSize: "14px" }}>
                                  {promo.code}
                                </strong>
                              </td>
                              <td style={{ textTransform: "capitalize" }}>{promo.type}</td>
                              <td>
                                <strong>
                                  {promo.type === "percentage" ? `${promo.value}%` : `₹${promo.value}`}
                                </strong>
                              </td>
                              <td>
                                {promo.isForever ? "Unlimited (Forever)" : `${promo.startDate || "N/A"} to ${promo.endDate || "N/A"}`}
                              </td>
                              <td style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                {promo.minOrderAmount && <div>• Min Order: ₹{promo.minOrderAmount}</div>}
                                {promo.validLocations && <div>• Geo: {promo.validLocations.join(", ")}</div>}
                                {promo.validCategories && <div>• Category Locked</div>}
                                {promo.validProducts && <div>• Product Locked ({promo.validProducts.length} items)</div>}
                                {!promo.minOrderAmount && !promo.validLocations && !promo.validCategories && !promo.validProducts && (
                                  <span>No restrictions</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    onClick={() => {
                                      setEditCouponCode(promo.code);
                                      setCouponCode(promo.code);
                                      setCouponType(promo.type);
                                      setCouponValue(String(promo.value));
                                      setCouponStartDate(promo.startDate || "");
                                      setCouponEndDate(promo.endDate || "");
                                      setCouponIsForever(promo.isForever ?? true);
                                      setCouponMinOrder(promo.minOrderAmount ? String(promo.minOrderAmount) : "");
                                      setCouponLocations(promo.validLocations ? promo.validLocations.join(", ") : "");
                                      setCouponSelectedCats(promo.validCategories || []);
                                      setCouponSelectedProds(promo.validProducts || []);
                                      setDiscountSubView("add-coupon");
                                    }}
                                    style={{ background: "none", border: "1px solid #e1e3e5", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", fontWeight: 500 }}
                                  >
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await deletePromoCode(promo.code);
                                      setPromoMessage(`Coupon "${promo.code}" deleted!`);
                                      setTimeout(() => setPromoMessage(""), 4000);
                                    }}
                                    style={{ background: "none", border: "1px solid #ef4444", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", color: "#ef4444", fontWeight: 500 }}
                                  >
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Direct Product Markdown Sales List */}
                <div className={styles.inventoryFullCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Active Storefront Markdown Sales</h4>
                    {products.some(p => p.salePrice !== undefined) && (
                      <button
                        type="button"
                        onClick={handleClearOffers}
                        className={styles.btnSecondary}
                        style={{ color: "#ef4444", borderColor: "#ef4444", padding: "4px 10px", fontSize: "12px" }}
                      >
                        Reset / Clear All Active Offers
                      </button>
                    )}
                  </div>

                  <div className={styles.tableScrollWrapper}>
                    <table className={styles.shopifyTable}>
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Category</th>
                          <th>Original Price (₹)</th>
                          <th>Markdown Price (₹)</th>
                          <th>Discount %</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.filter(p => p.salePrice !== undefined).length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                              No active markdown offers running. Click "+ Add Offer" to apply a product sale discount.
                            </td>
                          </tr>
                        ) : (
                          products
                            .filter(p => p.salePrice !== undefined)
                            .map(prod => {
                              const discPct = Math.round(((prod.price - (prod.salePrice || 0)) / prod.price) * 100);
                              return (
                                <tr key={prod.id}>
                                  <td>
                                    <div className={styles.productCell}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={prod.image} alt={prod.name} className={styles.productCellThumb} />
                                      <div>
                                        <span className={styles.productCellTitle}>{prod.name}</span>
                                        <span className={styles.productCellId}>ID: {prod.id}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ textTransform: "capitalize" }}>{prod.category.replace("-", " ")}</td>
                                  <td>₹{prod.price.toLocaleString("en-IN")}</td>
                                  <td>
                                    <strong style={{ color: "#0284c7" }}>
                                      ₹{prod.salePrice?.toLocaleString("en-IN")}
                                    </strong>
                                  </td>
                                  <td>
                                    <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                                      {discPct}% OFF
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const discPct = Math.round(((prod.price - (prod.salePrice || 0)) / prod.price) * 100);
                                        setOfferTargetType("product");
                                        setOfferProduct(prod.id);
                                        setOfferDiscountPercent(String(discPct));
                                        setDiscountSubView("add-offer");
                                      }}
                                      style={{ background: "none", border: "1px solid #e1e3e5", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", fontWeight: 500 }}
                                    >
                                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const { salePrice, ...rest } = prod;
                                        await updateProduct(rest);
                                        setOfferMessage(`Removed markdown offer from ${prod.name}`);
                                        setTimeout(() => setOfferMessage(""), 4000);
                                      }}
                                      className={styles.btnDelete}
                                    >
                                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete
                                    </button>
                                  </div>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
            
          </div>
        )}

        {/* TAB 5: BUSINESS INSIGHTS & ANALYTICS */}
        {activeTab === "analytics" && (
          <div className={styles.tabContent}>
            <div className={styles.tabTitleArea} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h3>Business Insights & Storefront Analytics</h3>
                <p>Monitor user clickstreams, button interactions, dwell times, and geographic distribution</p>
              </div>
              <button
                type="button"
                onClick={fetchAnalytics}
                className={styles.modeToggleActive}
                style={{ backgroundColor: "#008060", borderColor: "#008060", color: "white" }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Refresh Live Data
              </button>
            </div>

            {analyticsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px", color: "var(--text-muted)", fontSize: "16px", fontWeight: "600" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Loading Business Insights from MongoDB...
              </div>
            ) : !analyticsData ? (
              <div className={styles.formAlert}>No analytics data loaded. Click Refresh to reload.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                
                {/* 1. KPI Ribbon */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                  <div className={styles.todoCard}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Overall Views Count</span>
                      <strong style={{ fontSize: "24px", color: "#111827", marginTop: "4px" }}>{analyticsData.totalViews}</strong>
                      <span style={{ fontSize: "11px", color: "#008060", marginTop: "4px" }}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> Active storefront views</span>
                    </div>
                  </div>
                  <div className={styles.todoCard}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Element & Button Clicks</span>
                      <strong style={{ fontSize: "24px", color: "#111827", marginTop: "4px" }}>{analyticsData.totalClicks}</strong>
                      <span style={{ fontSize: "11px", color: "#0284c7", marginTop: "4px" }}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> Storefront interactions</span>
                    </div>
                  </div>
                  <div className={styles.todoCard}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Click Conversion Rate</span>
                      <strong style={{ fontSize: "24px", color: "#111827", marginTop: "4px" }}>
                        {((analyticsData.totalClicks / (analyticsData.totalViews || 1)) * 100).toFixed(1)}%
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Clicks per views ratio</span>
                    </div>
                  </div>
                  <div className={styles.todoCard}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Logged User Sessions</span>
                      <strong style={{ fontSize: "24px", color: "#111827", marginTop: "4px" }}>{analyticsData.clickstreams.length}</strong>
                      <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Unique visitor journeys</span>
                    </div>
                  </div>
                </div>

                {/* 2. Charts Section */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
                  {/* Views By Page Chart */}
                  <div className={styles.inventoryFullCard}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Most Popular Pages Visited</h4>
                    <div style={{ height: "260px", position: "relative" }}>
                      {analyticsData.pageViews && analyticsData.pageViews.length > 0 ? (
                        <Bar
                          data={{
                            labels: analyticsData.pageViews.slice(0, 6).map((p: any) => p._id),
                            datasets: [{
                              label: "Page Views",
                              data: analyticsData.pageViews.slice(0, 6).map((p: any) => p.count),
                              backgroundColor: "rgba(0, 128, 96, 0.85)",
                              hoverBackgroundColor: "#008060",
                              borderRadius: 4
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { grid: { display: false } },
                              y: { ticks: { precision: 0 } }
                            }
                          }}
                        />
                      ) : (
                        <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center", color: "var(--text-muted)" }}>No page views recorded yet</div>
                      )}
                    </div>
                  </div>

                  {/* Locations Pie Chart */}
                  <div className={styles.inventoryFullCard}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>User Locations (Area)</h4>
                    <div style={{ height: "260px", position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      {analyticsData.locations && analyticsData.locations.length > 0 ? (
                        <Pie
                          data={{
                            labels: analyticsData.locations.map((l: any) => l._id),
                            datasets: [{
                              data: analyticsData.locations.map((l: any) => l.count),
                              backgroundColor: [
                                "#008060", "#0284c7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#10b981", "#6366f1"
                              ],
                              borderWidth: 1
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div style={{ color: "var(--text-muted)" }}>No location data available</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Button Click Leaderboard & Dwell Times Table */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  
                  {/* Button Click Leaderboard */}
                  <div className={styles.inventoryFullCard}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px", color: "#111827" }}>Button & Interaction Leaderboard</h4>
                    <div className={styles.tableScrollWrapper}>
                      <table className={styles.shopifyTable}>
                        <thead>
                          <tr>
                            <th>Action Element / Button Text</th>
                            <th style={{ textAlign: "right" }}>Click Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.buttonClicks && analyticsData.buttonClicks.length > 0 ? (
                            analyticsData.buttonClicks.map((click: any, idx: number) => (
                              <tr key={idx}>
                                <td>
                                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ color: "#008060", fontWeight: "bold" }}>#{idx + 1}</span>
                                    <code style={{ fontSize: "12px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                                      {click._id || "Generic Click"}
                                    </code>
                                  </span>
                                </td>
                                <td style={{ textAlign: "right", fontWeight: "bold", color: "#111827" }}>{click.count} clicks</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} style={{ textAlign: "center", color: "var(--text-muted)" }}>No storefront clicks logged yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Page Dwell Time Ranking */}
                  <div className={styles.inventoryFullCard}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px", color: "#111827" }}>Average Page Dwell Time</h4>
                    <div className={styles.tableScrollWrapper}>
                      <table className={styles.shopifyTable}>
                        <thead>
                          <tr>
                            <th>Page Path</th>
                            <th style={{ textAlign: "right" }}>Avg. Stay Duration</th>
                            <th style={{ textAlign: "right" }}>Samples</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.dwellTimes && analyticsData.dwellTimes.length > 0 ? (
                            analyticsData.dwellTimes.map((dwell: any, idx: number) => (
                              <tr key={idx}>
                                <td>
                                  <strong style={{ color: "#0284c7", fontSize: "13px" }}>{dwell._id}</strong>
                                </td>
                                <td style={{ textAlign: "right", fontWeight: "bold", color: "#008060" }}>
                                  {dwell.avgDuration.toFixed(1)} seconds
                                </td>
                                <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                                  {dwell.count} navigation(s)
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>No dwell times logged yet. Navigate between store pages to generate stats.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* 4. User Clickstream Trails Timeline */}
                <div className={styles.inventoryFullCard}>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "18px", color: "#111827" }}>Live User Clickstream Chronological Trails</h4>
                  <p className={styles.tipText} style={{ marginBottom: "20px" }}>
                    Analyze individual visitor journeys step-by-step. Events are grouped by session ID and ordered chronologically with computed dwell duration details.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {analyticsData.clickstreams && analyticsData.clickstreams.length > 0 ? (
                      analyticsData.clickstreams.map((session: any, sIdx: number) => {
                        // Merge dwell times into page views to avoid double-rendering page views and their dwell metrics
                        const timelineEvents: any[] = [];
                        session.events.forEach((ev: any) => {
                          if (ev.type === "pageview") {
                            timelineEvents.push({ ...ev });
                          } else if (ev.type === "dwell") {
                            const lastPv = [...timelineEvents].reverse().find(t => t.type === "pageview" && t.page === ev.page);
                            if (lastPv) {
                              lastPv.duration = ev.duration;
                            } else {
                              timelineEvents.push(ev);
                            }
                          } else {
                            timelineEvents.push(ev);
                          }
                        });

                        return (
                          <div key={sIdx} style={{ border: "1px solid #e1e3e5", borderRadius: "8px", background: "#fafbfb", overflow: "hidden" }}>
                            {/* Session Header Card */}
                            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e1e3e5", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f4f6f6" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontWeight: "700", fontSize: "12px", background: "#008060", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontFamily: "monospace" }}>
                                  {session.sessionId.substring(0, 16)}
                                </span>
                                <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> State: <strong>{session.location}</strong>
                                </span>
                              </div>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                Active: {new Date(session.timestamp).toLocaleString("en-IN")}
                              </span>
                            </div>

                            {/* Session Timeline Steps */}
                            <div style={{ padding: "20px 24px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderLeft: "2px solid #008060", marginLeft: "10px", paddingLeft: "20px" }}>
                                {timelineEvents.map((ev: any, evIdx: number) => {
                                  const formattedTime = new Date(ev.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                                  
                                  return (
                                    <div key={evIdx} style={{ position: "relative" }}>
                                      {/* Bullet Point Circle on the border line */}
                                      <div style={{
                                        position: "absolute",
                                        left: "-26px",
                                        top: "4px",
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        background: ev.type === "click" ? "#0284c7" : "#008060",
                                        border: "2px solid #fff"
                                      }} />

                                      {/* Event Details */}
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                          {ev.type === "pageview" && (
                                            <div>
                                              <span style={{ fontSize: "13px", color: "#111827", fontWeight: "500" }}>
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Visited page: <code style={{ fontSize: "12px", background: "#fff", border: "1px solid #e1e3e5", padding: "1px 4px", borderRadius: "3px" }}>{ev.page}</code>
                                              </span>
                                              {ev.duration > 0 && (
                                                <span style={{ fontSize: "12px", color: "#008060", marginLeft: "8px", fontWeight: "600" }}>
                                                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "2px" }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Stayed for {ev.duration}s
                                                </span>
                                              )}
                                            </div>
                                          )}

                                          {ev.type === "click" && (
                                            <span style={{ fontSize: "13px", color: "#111827" }}>
                                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg> Clicked button: <strong style={{ color: "#0284c7" }}>"{ev.buttonText}"</strong> on path <code style={{ fontSize: "12px" }}>{ev.page}</code>
                                            </span>
                                          )}

                                          {ev.type === "dwell" && (
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Dwell metric recorded: Stayed on <code style={{ fontSize: "11px" }}>{ev.page}</code> for {ev.duration}s
                                            </span>
                                          )}
                                        </div>

                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{formattedTime}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No clickstreams logged yet. Browse the shop storefront to generate user paths.</div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 6: ABORTED CART */}
        {activeTab === "aborted-cart" && (() => {
          return (
            <div className={styles.tabContent}>
              <div className={styles.tabTitleArea}>
                <div>
                  <h3>Aborted Carts</h3>
                  <p>Carts that were abandoned before checkout. Recover them with follow-up actions.</p>
                </div>
              </div>

              {loadingCarts ? (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Loading abandoned carts...
                </div>
              ) : abandonedCarts.length === 0 ? (
                <div className={styles.inventoryFullCard} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                  No abandoned carts recorded. Carts are saved when users add items but don't complete checkout.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {abandonedCarts.map(cart => (
                    <div key={cart._id} className={styles.inventoryFullCard} style={{ padding: "16px 20px" }}>
                      {/* Cart Header Row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <input type="checkbox" checked={selectedCarts.has(cart._id)} onChange={() => toggleSelect(cart._id)} />
                          <div>
                            <strong style={{ fontSize: "14px" }}>{cart.name || "Guest"}</strong>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                              {cart.email && `📧 ${cart.email}`}{cart.phone && ` · 📱 ${cart.phone}`}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <strong style={{ fontSize: "16px", color: "#008060" }}>₹{cart.total?.toLocaleString("en-IN") || 0}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {new Date(cart.createdAt).toLocaleDateString("en-IN")}
                          </span>
                          {cart.archived && <span style={{ fontSize: "10px", color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>Archived</span>}
                        </div>
                      </div>

                      {/* Items Count */}
                      <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {cart.items?.length || 0} item(s) in cart
                      </div>

                      {/* Show Details */}
                      <div style={{ marginTop: "8px" }}>
                        <button
                          onClick={() => setExpandedId(expandedId === cart._id ? null : cart._id)}
                          style={{ background: "none", border: "none", color: "#008060", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: "4px 0" }}
                        >
                          {expandedId === cart._id ? "▲ Hide Details" : "▼ Show Details"}
                        </button>
                      </div>

                      {/* Expanded Items */}
                      {expandedId === cart._id && cart.items && (
                        <div style={{ marginTop: "10px", borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
                          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <th style={{ textAlign: "left", padding: "4px 8px", color: "#6b7280", fontWeight: 500 }}>Product</th>
                                <th style={{ textAlign: "right", padding: "4px 8px", color: "#6b7280", fontWeight: 500 }}>Qty</th>
                                <th style={{ textAlign: "right", padding: "4px 8px", color: "#6b7280", fontWeight: 500 }}>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cart.items.map((item: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                                  <td style={{ padding: "6px 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    {item.image && <img src={item.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "4px", objectFit: "cover" }} />}
                                    <span>{item.name}</span>
                                  </td>
                                  <td style={{ textAlign: "right", padding: "6px 8px" }}>{item.quantity}</td>
                                  <td style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ marginTop: "12px", borderTop: "1px solid #f0f0f0", paddingTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {/* Send as Link */}
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/cart?restore=${cart._id}`;
                            navigator.clipboard.writeText(link);
                            addLogEntry(cart._id, "link", `Cart link copied: ${link}`);
                          }}
                          className={styles.btnSecondary}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          Copy Link
                        </button>

                        {/* Send Email */}
                        {cart.email && (
                          <button
                            onClick={() => {
                              const subject = encodeURIComponent("Complete Your Purchase - Items Waiting in Your Cart");
                              const body = encodeURIComponent(`Hi ${cart.name || "there"},\n\nYou left items in your cart worth ₹${cart.total?.toLocaleString("en-IN") || 0}. Complete your purchase now!\n\n${window.location.origin}/cart?restore=${cart._id}`);
                              window.open(`mailto:${cart.email}?subject=${subject}&body=${body}`);
                              addLogEntry(cart._id, "email", `Follow-up email sent to ${cart.email}`);
                            }}
                            className={styles.btnSecondary}
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            Send Email
                          </button>
                        )}

                        {/* Send WhatsApp */}
                        {cart.phone && (
                          <button
                            onClick={() => {
                              const msg = encodeURIComponent(`Hi ${cart.name || "there"}! You left items worth ₹${cart.total?.toLocaleString("en-IN") || 0} in your cart. Complete your purchase: ${window.location.origin}/cart?restore=${cart._id}`);
                              window.open(`https://wa.me/${cart.phone.replace(/[^0-9]/g, "")}?text=${msg}`);
                              addLogEntry(cart._id, "whatsapp", `WhatsApp message sent to ${cart.phone}`);
                            }}
                            className={styles.btnSecondary}
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ verticalAlign: "middle", marginRight: "4px" }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Send WhatsApp
                          </button>
                        )}

                        {/* Show Logs */}
                        <button
                          onClick={() => setLogsId(logsId === cart._id ? null : cart._id)}
                          className={styles.btnSecondary}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          {logsId === cart._id ? "Hide Logs" : "Show Logs"}
                        </button>

                        {/* Add Log Entry */}
                        {logsId === cart._id && (
                          <div style={{ width: "100%", marginTop: "8px", padding: "10px", background: "#f9fafb", borderRadius: "6px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>Follow-up Logs</div>
                            {(!cart.followUpLogs || cart.followUpLogs.length === 0) && (
                              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>No follow-up actions recorded yet.</p>
                            )}
                            {cart.followUpLogs?.map((log: any, idx: number) => (
                              <div key={idx} style={{ fontSize: "11px", padding: "4px 0", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between" }}>
                                <span><strong>{log.type.toUpperCase()}:</strong> {log.message}</span>
                                <span style={{ color: "var(--text-muted)" }}>{new Date(log.sentAt).toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                              <input
                                type="text"
                                placeholder="Add a note..."
                                value={logInput}
                                onChange={(e) => setLogInput(e.target.value)}
                                style={{ flex: 1, padding: "6px 10px", border: "1px solid #e1e3e5", borderRadius: "4px", fontSize: "11px" }}
                              />
                              <button
                                onClick={() => {
                                  if (!logInput.trim()) return;
                                  addLogEntry(cart._id, "note", logInput.trim());
                                  setLogInput("");
                                }}
                                className={styles.btnPrimary}
                                style={{ padding: "6px 12px", fontSize: "11px" }}
                              >
                                Add Note
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Archive */}
                        <button
                          onClick={() => updateCart(cart._id, { archived: !cart.archived })}
                          className={styles.btnSecondary}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                          {cart.archived ? "Unarchive" : "Archive"}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this abandoned cart record?")) deleteCart(cart._id);
                          }}
                          style={{ background: "none", border: "1px solid #ef4444", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", color: "#ef4444", fontWeight: 500 }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 7: ABANDONED CHECKOUTS */}
        {activeTab === "abandoned-checkouts" && (() => {
          return (
            <div className={styles.tabContent}>
              <div className={styles.tabTitleArea}>
                <div>
                  <h3>Abandoned Checkouts</h3>
                  <p>Checkout sessions that were started but never completed. Includes customer location data.</p>
                </div>
              </div>

              {loadingCheckouts ? (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Loading abandoned checkouts...
                </div>
              ) : abandonedCheckouts.length === 0 ? (
                <div className={styles.inventoryFullCard} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                  No abandoned checkouts recorded.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {abandonedCheckouts.map((co: any) => (
                    <div key={co.sessionId} className={styles.inventoryFullCard} style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div>
                            <strong style={{ fontSize: "14px" }}>{co.name || "Guest"}</strong>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                              {co.email && <span>&#9993; {co.email}</span>}{co.phone && <span> &#128241; {co.phone}</span>}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <strong style={{ fontSize: "16px", color: "#008060" }}>&#8377;{co.total?.toLocaleString("en-IN") || 0}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {new Date(co.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {co.items?.length || 0} item(s) &middot; Session: {co.sessionId?.slice(0, 18)}...
                        {co.lat && co.lng && (
                          <span style={{ marginLeft: "12px" }}>
                            &#127758; {co.lat.toFixed(4)}, {co.lng.toFixed(4)}
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: "8px" }}>
                        <button
                          onClick={() => setExpandedCheckoutId(expandedCheckoutId === co.sessionId ? null : co.sessionId)}
                          style={{ background: "none", border: "none", color: "#008060", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: "4px 0" }}
                        >
                          {expandedCheckoutId === co.sessionId ? "&#9650; Hide Details" : "&#9660; Show Details"}
                        </button>
                      </div>

                      {expandedCheckoutId === co.sessionId && co.items && (
                        <div style={{ marginTop: "10px", borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
                          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <th style={{ textAlign: "left", padding: "4px 8px", color: "#6b7280", fontWeight: 500 }}>Product</th>
                                <th style={{ textAlign: "right", padding: "4px 8px", color: "#6b7280", fontWeight: 500 }}>Qty</th>
                                <th style={{ textAlign: "right", padding: "4px 8px", color: "#6b7280", fontWeight: 500 }}>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {co.items.map((item: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f9fafb" }}>
                                  <td style={{ padding: "6px 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    {item.image && <img src={item.image} alt="" style={{ width: "28px", height: "28px", borderRadius: "4px", objectFit: "cover" }} />}
                                    <span>{item.name}</span>
                                  </td>
                                  <td style={{ textAlign: "right", padding: "6px 8px" }}>{item.quantity}</td>
                                  <td style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600 }}>&#8377;{(item.price * item.quantity).toLocaleString("en-IN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {co.lat && co.lng && (
                            <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", padding: "8px 0" }}>
                              <strong>Location:</strong> {co.lat.toFixed(6)}, {co.lng.toFixed(6)}
                              <span style={{ marginLeft: "12px" }}>
                                <a
                                  href={`https://www.google.com/maps?q=${co.lat},${co.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#008060", textDecoration: "underline" }}
                                >
                                  View on Maps
                                </a>
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: "12px", borderTop: "1px solid #f0f0f0", paddingTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this abandoned checkout record?")) deleteAbandonedCheckout(co.sessionId);
                          }}
                          style={{ background: "none", border: "1px solid #ef4444", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", color: "#ef4444", fontWeight: 500 }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 7: REVIEWS */}
        {activeTab === "reviews" && (() => {
          const resetForm = () => {
            setReviewEditId(null);
            setReviewProductId("");
            setReviewProductName("");
            setReviewCustomerName("");
            setReviewRating(5);
            setReviewTitle("");
            setReviewText("");
            setReviewMediaUrl("");
            setReviewMediaType("");
            setReviewDate(new Date().toISOString().split("T")[0]);
            setReviewShowForm(false);
          };

          const handleEdit = (r: any) => {
            setReviewEditId(r._id);
            setReviewProductId(r.productId || "");
            setReviewProductName(r.productName || "");
            setReviewCustomerName(r.customerName || "");
            setReviewRating(r.rating || 5);
            setReviewTitle(r.title || "");
            setReviewText(r.review || "");
            setReviewMediaUrl(r.mediaUrl || "");
            setReviewMediaType(r.mediaType || "");
            setReviewDate(r.date ? r.date.split("T")[0] : new Date().toISOString().split("T")[0]);
            setReviewShowForm(true);
          };

          const updateProductRating = async (productId: string) => {
            try {
              const revRes = await fetch(`/api/reviews?productId=${productId}`);
              if (!revRes.ok) return;
              const productReviews = await revRes.json();
              const newCount = productReviews.length;
              const newRating = newCount > 0
                ? Math.round((productReviews.reduce((s: number, r: any) => s + r.rating, 0) / newCount) * 10) / 10
                : 0;
              await fetch(`/api/products/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating: newRating, reviewsCount: newCount }),
              });
            } catch (err) {
              console.error("Failed to update product rating:", err);
            }
          };

          const handleSave = async () => {
            if (!reviewProductId || !reviewCustomerName) return alert("Product and customer name required");
            const body: any = {
              productId: reviewProductId,
              productName: reviewProductName,
              customerName: reviewCustomerName,
              rating: reviewRating,
              title: reviewTitle,
              review: reviewText,
              mediaUrl: reviewMediaUrl,
              mediaType: reviewMediaType,
              date: new Date(reviewDate).toISOString(),
            };
            if (reviewEditId) body._id = reviewEditId;
            const res = await fetch("/api/reviews", {
              method: reviewEditId ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (res.ok) {
              resetForm();
              fetchReviews();
              updateProductRating(reviewProductId);
            } else {
              alert("Failed to save review");
            }
          };

          const handleDelete = async (_id: string) => {
            if (!window.confirm("Delete this review?")) return;
            await fetch(`/api/reviews?id=${_id}`, { method: "DELETE" });
            fetchReviews();
            if (reviewProductId) updateProductRating(reviewProductId);
          };

          const handleProductSelect = (pid: string) => {
            setReviewProductId(pid);
            const p = products.find((pr: any) => pr.id === pid);
            setReviewProductName(p ? p.name : "");
          };

          const downloadSampleCSV = () => {
            const header = "productId,productName,customerName,rating,title,review,mediaUrl,mediaType,date";
            const sample = "prod-001,Sample Product,John Doe,5,Great product!,Love it,,image,2026-06-12";
            const blob = new Blob([header + "\n" + sample], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "sample_reviews.csv"; a.click();
            URL.revokeObjectURL(url);
          };

          const downloadSampleExcel = () => {
            const header = ["productId", "productName", "customerName", "rating", "title", "review", "mediaUrl", "mediaType", "date"];
            const sample = ["prod-001", "Sample Product", "John Doe", 5, "Great product!", "Love it", "", "image", "2026-06-12"];
            import("xlsx").then(XLSX => {
              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.aoa_to_sheet([header, sample]);
              XLSX.utils.book_append_sheet(wb, ws, "Reviews");
              XLSX.writeFile(wb, "sample_reviews.xlsx");
            });
          };

          return (
            <div className={styles.tabContent}>
              <div className={styles.tabTitleArea}>
                <h3>Customer Reviews</h3>
                <p>Manage product reviews, ratings, and media</p>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <button onClick={() => { resetForm(); setReviewShowForm(!reviewShowForm); }} className={styles.btnPrimary}>
                  {reviewShowForm ? "Cancel" : "+ Add Review"}
                </button>
                <button onClick={downloadSampleCSV} className={styles.btnSecondary}>Sample CSV</button>
                <button onClick={downloadSampleExcel} className={styles.btnSecondary}>Sample Excel</button>
              </div>

              {reviewShowForm && (
                <div className={styles.inventoryFullCard} style={{ marginBottom: "24px", padding: "20px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>{reviewEditId ? "Edit Review" : "New Review"}</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div className={styles.formGroup}>
                      <label>Product *</label>
                      <select value={reviewProductId} onChange={e => handleProductSelect(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5", fontFamily: "inherit" }}>
                        <option value="">Select product</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Customer Name *</label>
                      <input value={reviewCustomerName} onChange={e => setReviewCustomerName(e.target.value)} placeholder="Customer name" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5", fontFamily: "inherit" }} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Rating</label>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} onClick={() => setReviewRating(s)} style={{ cursor: "pointer", fontSize: "22px", color: s <= reviewRating ? "#f59e0b" : "#d1d5db" }}>
                            {s <= reviewRating ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Review Date</label>
                      <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5", fontFamily: "inherit" }} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Title</label>
                      <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Review title" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5", fontFamily: "inherit" }} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Media URL</label>
                      <input value={reviewMediaUrl} onChange={e => setReviewMediaUrl(e.target.value)} placeholder="https://example.com/image.jpg" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5", fontFamily: "inherit" }} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Media Type</label>
                      <select value={reviewMediaType} onChange={e => setReviewMediaType(e.target.value as any)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5", fontFamily: "inherit" }}>
                        <option value="">None</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>Review Text</label>
                      <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write the review..." rows={3} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5", fontFamily: "inherit", resize: "vertical" }} />
                    </div>
                  </div>
                  <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                    <button onClick={handleSave} className={styles.btnPrimary}>{reviewEditId ? "Update" : "Save"}</button>
                    <button onClick={resetForm} className={styles.btnSecondary}>Cancel</button>
                  </div>
                </div>
              )}

              <div className={styles.inventoryFullCard} style={{ marginBottom: "24px", padding: "20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Bulk Upload Reviews</h4>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>Upload a CSV or Excel file with review data. Use the sample files above as a template.</p>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={e => setReviewBulkFile(e.target.files?.[0] || null)} style={{ fontSize: "13px" }} />
                  <button onClick={async () => {
                    if (!reviewBulkFile) return;
                    setReviewBulkLoading(true);
                    setReviewBulkResults([]);
                    try {
                      const buf = await reviewBulkFile.arrayBuffer();
                      const XLSX = await import("xlsx");
                      const wb = XLSX.read(buf, { type: "array" });
                      const ws = wb.Sheets[wb.SheetNames[0]];
                      const rows: any[] = XLSX.utils.sheet_to_json(ws);
                      let success = 0, fail = 0;
                      for (const row of rows) {
                        if (!row.productId || !row.customerName) { fail++; continue; }
                        try {
                          await fetch("/api/reviews", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              productId: String(row.productId),
                              productName: String(row.productName || ""),
                              customerName: String(row.customerName),
                              rating: Math.min(5, Math.max(1, Number(row.rating) || 5)),
                              title: String(row.title || ""),
                              review: String(row.review || ""),
                              mediaUrl: String(row.mediaUrl || ""),
                              mediaType: String(row.mediaType || ""),
                              date: row.date ? new Date(String(row.date)).toISOString() : new Date().toISOString(),
                            }),
                          });
                          success++;
                        } catch { fail++; }
                      }
                      setReviewBulkResults([`${success} imported, ${fail} failed`]);
                      fetchReviews();
                    } catch (err: any) {
                      setReviewBulkResults([`Error: ${err.message}`]);
                    }
                    setReviewBulkLoading(false);
                    setReviewBulkFile(null);
                  }} disabled={!reviewBulkFile || reviewBulkLoading} className={styles.btnPrimary}>
                    {reviewBulkLoading ? "Uploading..." : "Upload & Import"}
                  </button>
                </div>
                {reviewBulkResults.length > 0 && (
                  <div style={{ marginTop: "10px", fontSize: "13px" }}>
                    {reviewBulkResults.map((r, i) => <div key={i} style={{ color: r.startsWith("Error") ? "#ef4444" : "#008060", fontWeight: 600 }}>{r}</div>)}
                  </div>
                )}
              </div>

              <div className={styles.tableScrollWrapper}>
                {reviewLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading reviews...</div>
                ) : reviewList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No reviews yet. Add your first review above.</div>
                ) : (
                  <table className={styles.shopifyTable}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ width: "140px" }}>Customer</th>
                        <th style={{ width: "70px" }}>Rating</th>
                        <th>Review</th>
                        <th style={{ width: "50px" }}>Media</th>
                        <th style={{ width: "100px" }}>Date</th>
                        <th style={{ width: "100px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewList.map((r: any) => (
                        <tr key={r._id}>
                          <td style={{ fontSize: "12px", fontWeight: 600 }}>{r.productName || r.productId}</td>
                          <td style={{ fontSize: "12px" }}>{r.customerName}</td>
                          <td><span style={{ color: "#f59e0b", fontSize: "14px" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span></td>
                          <td style={{ fontSize: "12px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.title ? <strong>{r.title}</strong> : null}{r.title && r.review ? ": " : ""}{r.review}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {r.mediaUrl ? (r.mediaType === "video" ? <span title="Video">🎬</span> : <span title="Image">🖼</span>) : "—"}
                          </td>
                          <td style={{ fontSize: "11px", whiteSpace: "nowrap" }}>{r.date ? new Date(r.date).toLocaleDateString("en-IN") : "—"}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleEdit(r)} style={{ background: "#f3f4f6", border: "1px solid #e1e3e5", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}>Edit</button>
                              <button onClick={() => handleDelete(r._id)} style={{ background: "none", border: "1px solid #ef4444", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", color: "#ef4444" }}>Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 8: FAQ */}
        {activeTab === "faq" && (() => {
          const resetFaqForm = () => {
            setFaqEditId(null);
            setFaqProductId("");
            setFaqProductName("");
            setFaqQuestion("");
            setFaqAnswer("");
            setFaqShowForm(false);
          };

          const handleFaqEdit = (f: any) => {
            setFaqEditId(f._id);
            setFaqProductId(f.productId || "");
            setFaqProductName(f.productName || "");
            setFaqQuestion(f.question || "");
            setFaqAnswer(f.answer || "");
            setFaqShowForm(true);
          };

          const handleFaqProductSelect = (pid: string) => {
            setFaqProductId(pid);
            const p = products.find((pr: any) => pr.id === pid);
            setFaqProductName(p ? p.name : "");
          };

          const handleFaqSave = async () => {
            if (!faqProductId || !faqQuestion || !faqAnswer) return alert("Product, question, and answer required");
            const body: any = {
              productId: faqProductId,
              productName: faqProductName,
              question: faqQuestion,
              answer: faqAnswer,
            };
            if (faqEditId) body._id = faqEditId;
            const res = await fetch("/api/faq", {
              method: faqEditId ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (res.ok) {
              // Keep product selected, clear question/answer for next FAQ
              setFaqEditId(null);
              setFaqQuestion("");
              setFaqAnswer("");
              fetchFaqs();
            } else {
              alert("Failed to save FAQ");
            }
          };

          const handleFaqDelete = async (_id: string) => {
            if (!window.confirm("Delete this FAQ?")) return;
            await fetch(`/api/faq?id=${_id}`, { method: "DELETE" });
            fetchFaqs();
          };

          return (
            <div className={styles.tabContent}>
              <div className={styles.tabTitleArea}>
                <h3>Product FAQs</h3>
                <p>Add and manage frequently asked questions for your products</p>
              </div>

              <button onClick={() => { resetFaqForm(); setFaqShowForm(!faqShowForm); }} className={styles.btnPrimary} style={{ marginBottom: "20px" }}>
                {faqShowForm ? "Cancel" : "+ Add FAQ"}
              </button>

              {faqShowForm && (
                <div className={styles.inventoryFullCard} style={{ marginBottom: "24px", padding: "20px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>{faqEditId ? "Edit FAQ" : "New FAQ"}</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>Product *</label>
                      <select value={faqProductId} onChange={e => handleFaqProductSelect(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5" }}>
                        <option value="">Select product</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>Question *</label>
                      <input value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)} placeholder="e.g. What is the return policy?" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5" }} />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>Answer *</label>
                      <textarea value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)} placeholder="Write the answer..." rows={4} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #e1e3e5", resize: "vertical", fontFamily: "inherit" }} />
                    </div>
                  </div>
                  <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                    <button onClick={handleFaqSave} className={styles.btnPrimary}>{faqEditId ? "Update" : "Save"}</button>
                    <button onClick={resetFaqForm} className={styles.btnSecondary}>Cancel</button>
                  </div>
                </div>
              )}

              <div className={styles.tableScrollWrapper}>
                {faqLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading FAQs...</div>
                ) : faqList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No FAQs yet. Add your first FAQ above.</div>
                ) : (
                  <table className={styles.shopifyTable}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Question</th>
                        <th>Answer</th>
                        <th style={{ width: "100px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqList.map((f: any) => (
                        <tr key={f._id}>
                          <td style={{ fontSize: "12px", fontWeight: 600 }}>{f.productName || f.productId}</td>
                          <td style={{ fontSize: "12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.question}</td>
                          <td style={{ fontSize: "12px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)" }}>{f.answer}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleFaqEdit(f)} style={{ background: "#f3f4f6", border: "1px solid #e1e3e5", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}>Edit</button>
                              <button onClick={() => handleFaqDelete(f._id)} style={{ background: "none", border: "1px solid #ef4444", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", color: "#ef4444" }}>Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
