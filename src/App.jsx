import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  ShoppingBag, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Heart, 
  Sparkles, 
  Gift, 
  Clock, 
  Phone, 
  Truck, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Minus, 
  Search, 
  CheckCircle2,
  Watch,
  Scissors
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'الرئيسية', icon: Sparkles },
  { id: 'cosmetics', name: 'كوسمتيك', icon: Sparkles },
  { id: 'accessories', name: 'بلاكيور + اصي', icon: ShieldCheck },
  { id: 'gift-boxes', name: 'علب هدايا', icon: Gift },
  { id: 'makeup', name: 'مايكاب', icon: Sparkles },
  { id: 'perfumes', name: 'عطور', icon: Crown },
  { id: 'hair-accessories', name: 'اكسسوارات شعر', icon: Scissors },
  { id: 'watches', name: 'ساعات', icon: Watch },
  { id: 'gifts', name: 'هدايا', icon: Heart },
];

const HERO_BANNERS = [
  {
    id: 1,
    title: "هديتك علينا وودراهم عليك 😅😍",
    subtitle: "لأنها الأفضل تستحق ذلك - تشكيلة فاخرة من أرقى العطور والمكياج",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80",
    cta: "تسوقي الآن 🔥"
  },
  {
    id: 2,
    title: "مجموعة العطور العالمية 2026",
    subtitle: "روائح ساحرة تدوم طويلاً بأسعار حصرية وتوصيل سريع",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80",
    cta: "اكتشفي العطور ✨"
  },
  {
    id: 3,
    title: "علب هدايا ملكية جاهزة للتقديم",
    subtitle: "التغليف والمفاجأة علينا والابتسامة لها",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1600&q=80",
    cta: "اختر هديتك 🎁"
  }
];

const PRODUCTS = [
  {
    id: 1,
    name: "ريحة بلو شانال الأصلي Bleue De Chanel",
    category: "perfumes",
    price: 6000,
    originalPrice: 7500,
    rating: 5,
    reviewsCount: 48,
    inStock: true,
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    description: "عطر فاخر ذو ثبات عالي ولمسة رجالية متميزة تناسب جميع المناسبات."
  },
  {
    id: 2,
    name: "طقم مكياج احترافي كامل 32 قطعة",
    category: "makeup",
    price: 4500,
    originalPrice: 5800,
    rating: 5,
    reviewsCount: 32,
    inStock: true,
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
    description: "مجموعة كاملة لأحدث صيحات المكياج بلمسة مخملية تدوم طوال اليوم."
  },
  {
    id: 3,
    name: "علبة هدايا فاخرة وساعة أنيقة",
    category: "gift-boxes",
    price: 8200,
    originalPrice: 9900,
    rating: 5,
    reviewsCount: 19,
    inStock: true,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    description: "علبة فاخرة مغلفة مع ورد مجفف وساعة مقاومة للماء مع عطر إضافي."
  },
  {
    id: 4,
    name: "مجموعة عناية بالبشرة سيروم وكريم",
    category: "cosmetics",
    price: 3200,
    originalPrice: 4000,
    rating: 4.9,
    reviewsCount: 27,
    inStock: true,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    description: "مجموعة ترطيب وتغذية مكثفة للبشرة تحتوي على النياسيناميد وحمض الهيالورونيك."
  },
  {
    id: 5,
    name: "طقم اكسسوارات شعر ذهبي مرصع",
    category: "hair-accessories",
    price: 1800,
    originalPrice: 2400,
    rating: 4.8,
    reviewsCount: 15,
    inStock: true,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80",
    description: "تشكيلة من مشابك وتيجان الشعر المطلي بالذهب للمناسبات والأعراس."
  },
  {
    id: 6,
    name: "ساعة رجالية كلاسيكية سير أصلية",
    category: "watches",
    price: 5400,
    originalPrice: 6800,
    rating: 5,
    reviewsCount: 22,
    inStock: true,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    description: "ساعة فاخرة بتصميم عصري مقاومة للماء مع علبة هدايا أصلية."
  },
  {
    id: 7,
    name: "سوار بلاكيور مطلي ذهب عيار 24",
    category: "accessories",
    price: 2900,
    originalPrice: 3500,
    rating: 4.9,
    reviewsCount: 40,
    inStock: true,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    description: "سوار نسائي أنيق مطلي بالذهب المقاوم للتغير والماء مع ضمان سنتين."
  },
  {
    id: 8,
    name: "عطر ميس ديور الوردي النسائي",
    category: "perfumes",
    price: 7800,
    originalPrice: 9200,
    rating: 5,
    reviewsCount: 56,
    inStock: true,
    image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
    description: "عطر أنثوي زاهي بمزيج من الزهور المنعشة والمسك الفاخر."
  }
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showNotification(`تمت إضافة "${product.name}" إلى السلة بنجاح!`);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = activeCategory === 'all'
    ? PRODUCTS.slice(0, 8)
    : PRODUCTS.filter(p => p.category === activeCategory).slice(0, 8);

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 font-cairo dir-rtl leading-relaxed select-none">
      
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gold-500 text-dark-900 font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all animate-bounce">
          <CheckCircle2 size={20} />
          <span>{notification}</span>
        </div>
      )}

      {/* الشريط الترويجي */}
      <div className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-dark-900 font-bold text-center py-2 px-4 text-xs md:text-sm shadow-md flex items-center justify-center gap-2">
        <Truck size={16} />
        <span>🚚 التوصيل متوفر لجميع الولايات والدفع عند الاستلام</span>
      </div>

      {/* الهيدر */}
      <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-md border-b border-gold-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveCategory('all')}>
            <div className="bg-gradient-to-br from-gold-400 to-gold-600 p-2.5 rounded-2xl shadow-lg shadow-gold-500/20">
              <Crown className="w-7 h-7 text-dark-900" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white flex items-center gap-1">
                كوسمتيك <span className="text-gold-500">عبد الحق</span>
              </h1>
              <p className="text-[10px] text-slate-400 -mt-1 font-medium">يبدو أن أحدهم سيغدو سعيداً اليوم</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-gold-500 text-dark-900 shadow-md shadow-gold-500/20 font-bold' 
                      : 'text-slate-300 hover:text-gold-400 hover:bg-dark-800'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-gold-500/30 text-gold-400 transition-all hover:scale-105"
            >
              <ShoppingBag size={22} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-dark-900 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-dark-800 border border-gold-500/30 text-gold-400 hover:bg-dark-700 transition-all"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-dark-900 border-l border-gold-500/30 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-50">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-dark-700 mb-6">
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-gold-500" />
                  <span className="font-bold text-lg text-white">أقسام المتجر</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-dark-800 text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-gold-500 text-dark-900 shadow-lg shadow-gold-500/20'
                          : 'bg-dark-800 text-slate-200 hover:bg-dark-700 hover:text-gold-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{cat.name}</span>
                      </div>
                      <ChevronLeft size={16} className="opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-dark-700 text-xs text-slate-400 space-y-3">
              <div className="flex items-center gap-2 text-gold-400 font-semibold">
                <Phone size={14} />
                <span>خدمة الزبائن: 0550000000</span>
              </div>
              <p className="text-[11px] text-slate-500">كوسمتيك عبد الحق - جميع الحقوق محفوظة © 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* Full-Bleed Banner */}
      <section className="relative w-full px-0 py-0 overflow-hidden">
        <div className="relative w-full h-[450px] md:h-[520px] overflow-hidden group shadow-2xl">
          {HERO_BANNERS.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000"
              />
            </div>
          ))}

          <div className="absolute inset-0 z-20 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent flex flex-col justify-center items-center text-center p-6 md:p-12 transition-opacity duration-500 opacity-100 group-hover:opacity-0 pointer-events-none">
            <span className="bg-gold-500/20 text-gold-400 border border-gold-500/40 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold mb-4 backdrop-blur-md">
              ✨ التشكيلة الحصرية 2026
            </span>
            <h2 className="text-3xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl max-w-3xl leading-tight">
              {HERO_BANNERS[currentSlide].title}
            </h2>
            <p className="text-slate-200 text-sm md:text-xl font-medium max-w-2xl mb-8 drop-shadow-lg">
              {HERO_BANNERS[currentSlide].subtitle}
            </p>
            <button 
              onClick={() => {
                const el = document.getElementById('products-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="pointer-events-auto bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-dark-900 font-black px-8 py-3.5 rounded-full text-sm md:text-base shadow-xl shadow-gold-500/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{HERO_BANNERS[currentSlide].cta}</span>
            </button>
          </div>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2">
            {HERO_BANNERS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-8 bg-gold-500' : 'w-2.5 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_BANNERS.length - 1 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-dark-900/60 hover:bg-gold-500 hover:text-dark-900 text-white backdrop-blur-md transition-all hidden sm:flex"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_BANNERS.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-dark-900/60 hover:bg-gold-500 hover:text-dark-900 text-white backdrop-blur-md transition-all hidden sm:flex"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </section>

      {/* الأقسام */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h3 className="text-xl md:text-2xl font-black text-gold-400 tracking-wide">أقسام المتجر</h3>
          <div className="w-16 h-1 bg-gold-500 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {CATEGORIES.slice(1).map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="bg-dark-800 hover:bg-dark-700 border border-gold-500/20 hover:border-gold-500/60 p-4 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold-500/10 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 text-gold-400 group-hover:bg-gold-500 group-hover:text-dark-900 flex items-center justify-center mb-2.5 transition-all">
                  <Icon size={22} />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-gold-400">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* الأكثر مبيعاً (8 منتجات متواسطة) */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mb-16">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-gold-500" />
            <h3 className="text-2xl md:text-3xl font-black text-white">🔥 الأكثر مبيعاً</h3>
            <Sparkles className="w-6 h-6 text-gold-500" />
          </div>
          <p className="text-slate-400 text-xs md:text-sm">أرقى المنتجات والتشكيلات الأكثر طلباً من زبائننا الكرام</p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent mt-3"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center items-stretch">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white text-dark-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200 flex flex-col justify-between transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gold-500/20 group"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer" onClick={() => setQuickViewProduct(product)}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  <span>متوفر</span>
                </div>

                <button className="absolute top-3 left-3 p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-red-500 shadow-md backdrop-blur-sm transition-all">
                  <Heart size={16} />
                </button>
              </div>

              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm md:text-base text-slate-900 line-clamp-2 mb-2 group-hover:text-gold-600 transition-colors">
                    {product.name}
                  </h4>

                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                      />
                    ))}
                    <span className="text-[11px] text-slate-500 font-semibold mr-1">({product.reviewsCount})</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg md:text-xl font-black text-slate-900">{product.price} دج</span>
                    {product.originalPrice && (
                      <span className="text-xs text-slate-400 line-through font-medium">{product.originalPrice} دج</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-dark-900 hover:bg-dark-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <ShoppingBag size={15} />
                      <span>أضف إلى السلة</span>
                    </button>

                    <button
                      onClick={() => {
                        addToCart(product);
                        setIsCartOpen(true);
                      }}
                      className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-dark-900 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      <span>اطلب الآن 🔥</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-[90%] max-w-md bg-dark-900 border-r border-gold-500/30 shadow-2xl p-6 flex flex-col justify-between z-50">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-dark-700 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-gold-500" />
                  <h3 className="font-bold text-lg text-white">سلة التسوق ({cartItemsCount})</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-xl bg-dark-800 text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <ShoppingBag size={48} className="mx-auto text-slate-600" />
                  <p className="font-semibold">سلة التسوق فارغة حالياً</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="bg-gold-500 text-dark-900 font-bold px-6 py-2 rounded-xl text-xs"
                  >
                    تصفح المنتجات
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-dark-800 p-3 rounded-2xl flex items-center gap-3 border border-dark-700">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                      <div className="flex-grow">
                        <h5 className="text-xs font-bold text-white line-clamp-1">{item.name}</h5>
                        <span className="text-xs font-black text-gold-400">{item.price} دج</span>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded bg-dark-700 text-slate-300">
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded bg-dark-700 text-slate-300">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-500 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-dark-700 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-slate-300">المجموع الكلي:</span>
                  <span className="text-gold-400 font-black">{cartTotal} دج</span>
                </div>
                <button 
                  onClick={() => alert('تم تأكيد طلبك بنجاح! سنتصل بك لتأكيد الشحن.')}
                  className="w-full bg-gradient-to-r from-gold-400 to-gold-600 text-dark-900 font-black py-3.5 rounded-xl text-sm shadow-xl shadow-gold-500/20"
                >
                  تأكيد الطلب والدفع عند الاستلام 🚚
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-dark-950 border-t border-gold-500/20 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex justify-center items-center gap-2">
            <Crown className="w-5 h-5 text-gold-500" />
            <span className="font-bold text-slate-300">كوسمتيك عبد الحق</span>
          </div>
          <p>© 2026 كوسمتيك عبد الحق - جميع الحقوق محفوظة.</p>
        </div>
      </footer>

    </div>
  );
}
