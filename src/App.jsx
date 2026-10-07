import React, { useState } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { 
  ShoppingBag, Heart, Search, User, Crown, ShieldCheck, 
  Gift, Lock, Truck, Trash2, ChevronLeft, Star, SlidersHorizontal 
} from 'lucide-react';

const PRODUCTS_DATABASE = [
  { id: '1', name: 'عطر ميس ديور أو دو بارفان', brand: 'Dior', price: 5900, oldPrice: 6900, discount: '-14%', rating: 5, reviews: 32, category: 'العطور', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500', desc: 'عطر أنثوي فاخر يجمع بين نفحات الزهور والفاكهة مع لمسة من المسك.' },
  { id: '2', name: 'أحمر شفاه مايبيلين', brand: 'Maybelline', price: 1900, oldPrice: null, discount: null, rating: 5, reviews: 25, category: 'المكياج', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500', desc: 'لون ثابت ومظهر مخملي يناسب جميع الإطلالات.' },
  { id: '3', name: 'كريم أساس لوريال باريس', brand: "L'Oréal", price: 2890, oldPrice: null, discount: null, rating: 4, reviews: 31, category: 'المكياج', image: 'https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=500', desc: 'تغطية مثالية تدوم طوال اليوم بشرة متألقة.' },
  { id: '4', name: 'ماسكارا لانكوم', brand: 'Lancôme', price: 2690, oldPrice: null, discount: null, rating: 5, reviews: 42, category: 'المكياج', image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500', desc: 'تكثيف وتطويل الرموش بشكل احترافي.' },
  { id: '5', name: 'بودرة مضغوطة', brand: 'Essence', price: 1850, oldPrice: null, discount: null, rating: 4, reviews: 18, category: 'المكياج', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500', desc: 'لمسة نهائية خالية من اللمعان.' },
  { id: '6', name: 'بوكس مكياج فاخر', brand: 'Luxe Beauty', price: 8500, oldPrice: 9500, discount: '-10%', rating: 5, reviews: 50, category: 'الهدايا', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500', desc: 'مجموعة متكاملة من أرقى منتجات التجميل لتكون الهدية المثالية.' }
];

function MainApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS_DATABASE[0]);
  const { cart, addToCart, updateQty, removeFromCart, subtotal, shipping, discount, total } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      
      {/* 1. Header (الترويسة الرئيسية) */}
      <header className="bg-black text-white sticky top-0 z-50 border-b border-[#D4AF37]/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#B8860B] via-[#D4AF37] to-[#E5C158] flex items-center justify-center text-black font-bold">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black bg-gradient-to-r from-[#E5C158] to-[#D4AF37] bg-clip-text text-transparent block leading-tight">Luxe Beauty</span>
              <span className="text-[9px] text-gray-400 block tracking-widest -mt-1">LUXURY STORE</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 font-semibold text-sm">
            <button onClick={() => setCurrentPage('home')} class={`hover:text-[#D4AF37] transition ${currentPage === 'home' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-gray-300'}`}>الرئيسية</button>
            <button onClick={() => setCurrentPage('catalog')} class={`hover:text-[#D4AF37] transition ${currentPage === 'catalog' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-gray-300'}`}>المنتجات</button>
            <button onClick={() => setCurrentPage('catalog')} className="text-gray-300 hover:text-[#D4AF37] transition">العطور</button>
            <button onClick={() => setCurrentPage('catalog')} className="text-gray-300 hover:text-[#D4AF37] transition">المكياج</button>
            <button onClick={() => setCurrentPage('gifts')} class={`hover:text-[#D4AF37] transition ${currentPage === 'gifts' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1' : 'text-gray-300'}`}>الهدايا</button>
            <button className="text-gray-300 hover:text-[#D4AF37] transition">اتصل بنا</button>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-300 hover:text-[#D4AF37]"><Search className="w-5 h-5" /></button>
            <button className="p-2 text-gray-300 hover:text-[#D4AF37]"><User className="w-5 h-5" /></button>
            <button onClick={() => setCurrentPage('cart')} className="p-2 text-gray-300 hover:text-[#D4AF37] relative">
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black font-bold text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Body Views (عرض الصفحات) */}
      <main className="flex-grow">
        
        {/* VIEW 1: HOME PAGE */}
        {currentPage === 'home' && (
          <div>
            <section className="bg-black text-white py-20 border-b border-[#D4AF37]/20 relative overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 text-right">
                  <h1 className="text-4xl md:text-6xl font-black leading-tight">
                    اكتشفي <span className="bg-gradient-to-r from-[#E5C158] to-[#D4AF37] bg-clip-text text-transparent">لمستك الخاصة</span>
                  </h1>
                  <p className="text-xl text-gray-300 font-light">
                    عطور • جمال • هدايا • عناية ... <br/>
                    <span className="text-sm text-gray-400">كل ما تحتاجينه في مكان واحد</span>
                  </p>
                  <button onClick={() => setCurrentPage('catalog')} className="px-8 py-3.5 bg-gradient-to-r from-[#E5C158] to-[#B8860B] text-black font-extrabold rounded-lg hover:opacity-90 transition shadow-lg shadow-[#D4AF37]/20 flex items-center gap-3">
                    تسوقي الآن <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <div className="w-80 h-80 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] p-1 shadow-2xl">
                    <div className="w-full h-full bg-[#121212] rounded-full flex items-center justify-center p-8">
                      <img src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500" className="max-h-full object-contain" alt="Perfume" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Cards (4 بطاقات التصفح) */}
            <section className="bg-black py-8 border-b border-[#D4AF37]/20">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: 'أقل من 3000 دج', icon: '💰' },
                  { title: 'أريد شيئاً لنفسي', icon: '❤️' },
                  { title: 'أريد إطلالة كاملة', icon: '✨' },
                  { title: 'أريد هدية', icon: '🎁' }
                ].map((card, idx) => (
                  <div key={idx} onClick={() => setCurrentPage('catalog')} className="bg-[#121212] border border-[#D4AF37]/30 rounded-xl p-5 text-center cursor-pointer hover:border-[#D4AF37] transition group">
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <h3 className="text-white font-bold text-sm group-hover:text-[#D4AF37]">{card.title}</h3>
                  </div>
                ))}
              </div>
            </section>

            {/* Features Bar */}
            <section className="bg-white py-6 border-b">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="flex items-center justify-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
                  <div className="text-right"><h4 className="font-bold text-sm">منتجات أصلية</h4><p className="text-xs text-gray-500">100% مضمونة</p></div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Gift className="w-8 h-8 text-[#D4AF37]" />
                  <div className="text-right"><h4 className="font-bold text-sm">تغليف هدايا</h4><p className="text-xs text-gray-500">بشكل أنيق ومميز</p></div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Lock className="w-8 h-8 text-[#D4AF37]" />
                  <div className="text-right"><h4 className="font-bold text-sm">دفع آمن</h4><p className="text-xs text-gray-500">بجميع طرق الدفع</p></div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Truck className="w-8 h-8 text-[#D4AF37]" />
                  <div className="text-right"><h4 className="font-bold text-sm">توصيل سريع</h4><p className="text-xs text-gray-500">إلى جميع الولايات</p></div>
                </div>
              </div>
            </section>

            {/* Best Sellers Grid */}
            <section className="py-12 max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-black text-center mb-8">🔥 الأكثر مبيعاً</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {PRODUCTS_DATABASE.slice(0, 4).map(prod => (
                  <div key={prod.id} className="bg-white rounded-xl border p-4 shadow-sm text-right flex flex-col justify-between">
                    <div className="h-44 bg-gray-50 rounded-lg p-2 mb-3 cursor-pointer" onClick={() => { setSelectedProduct(prod); setCurrentPage('detail'); }}>
                      <img src={prod.image} className="w-full h-full object-contain" alt={prod.name} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm mb-1">{prod.name}</h3>
                      <div className="text-amber-500 text-xs mb-2">★★★★★ ({prod.reviews})</div>
                      <div className="font-extrabold text-[#B8860B] mb-3">{prod.price.toLocaleString()} دج</div>
                    </div>
                    <button onClick={() => addToCart(prod)} className="w-full py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-[#D4AF37] hover:text-black transition">أضف إلى السلة</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: CATALOG PAGE (قسم المكياج والمنتجات مع الفلترة الجانبية) */}
        {currentPage === 'catalog' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 class="text-2xl font-black mb-6 text-right">المكياج - جمالك يبدأ من هنا</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Sidebar Filter */}
              <div className="bg-white p-6 rounded-xl border h-fit text-right space-y-6">
                <h3 className="font-bold border-b pb-2 flex items-center justify-between">
                  <span>تصفية النتائج</span> <SlidersHorizontal className="w-4 h-4" />
                </h3>
                <div>
                  <h4 className="text-sm font-bold mb-3">الفئة</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {['مكياج الوجه', 'مكياج العيون', 'مكياج الشفاه', 'مستحضرات التجميل'].map((cat, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-[#D4AF37]" defaultChecked={i===0} /> <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-2">السعر</h4>
                  <input type="range" min="500" max="5000" className="w-full accent-[#D4AF37]" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>500 دج</span><span>5000 دج</span></div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6">
                {PRODUCTS_DATABASE.map(prod => (
                  <div key={prod.id} className="bg-white rounded-xl border p-4 text-right flex flex-col justify-between">
                    <div className="h-44 bg-gray-50 rounded-lg p-2 mb-3 cursor-pointer" onClick={() => { setSelectedProduct(prod); setCurrentPage('detail'); }}>
                      <img src={prod.image} className="w-full h-full object-contain" alt={prod.name} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm mb-1">{prod.name}</h3>
                      <div className="text-amber-500 text-xs mb-2">★★★★★ ({prod.reviews})</div>
                      <div className="font-extrabold text-[#B8860B] mb-3">{prod.price.toLocaleString()} دج</div>
                    </div>
                    <button onClick={() => addToCart(prod)} className="w-full py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-[#D4AF37] hover:text-black transition">أضف إلى السلة</button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* VIEW 3: PRODUCT DETAIL VIEW (تفاصيل المنتج المختار) */}
        {currentPage === 'detail' && selectedProduct && (
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="bg-white p-8 rounded-2xl border grid md:grid-cols-2 gap-12 text-right">
              <div className="bg-pink-50/30 rounded-2xl p-8 flex items-center justify-center relative">
                {selectedProduct.discount && (
                  <span className="absolute top-4 right-4 bg-red-500 text-white font-bold text-xs px-3 py-1 rounded-full">{selectedProduct.discount}</span>
                )}
                <img src={selectedProduct.image} className="max-h-80 object-contain" alt={selectedProduct.name} />
              </div>
              <div className="space-y-6">
                <span className="text-xs text-gray-400 font-bold uppercase">{selectedProduct.brand}</span>
                <h1 className="text-3xl font-black text-gray-900">{selectedProduct.name}</h1>
                <div className="text-amber-500 text-sm">★★★★★ ({selectedProduct.reviews} تقييم)</div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-gray-900">{selectedProduct.price.toLocaleString()} دج</span>
                  {selectedProduct.oldPrice && <span className="text-sm text-gray-400 line-through">{selectedProduct.oldPrice.toLocaleString()} دج</span>}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedProduct.desc}</p>
                <div className="text-xs font-bold text-green-600">● متوفر في المخزون</div>
                <button onClick={() => addToCart(selectedProduct)} className="w-full py-3.5 bg-gradient-to-r from-[#E5C158] to-[#B8860B] text-black font-extrabold rounded-xl shadow-lg hover:opacity-90 transition">
                  أضف إلى السلة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: CART & CHECKOUT VIEW (سلة التسوق والدفع) */}
        {currentPage === 'cart' && (
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-black mb-8 text-right">سلة التسوق والدفع</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Cart List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border p-6 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-400 py-10">السلة فارغة حالياً</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-4">
                        <img src={item.image} className="w-16 h-16 object-cover rounded-lg border" alt={item.name} />
                        <div className="text-right">
                          <h4 className="font-bold text-sm">{item.name}</h4>
                          <span className="text-xs text-[#B8860B] font-bold">{item.price.toLocaleString()} دج</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-lg">
                          <button onClick={() => updateQty(item.id, -1)} className="px-3 py-1 font-bold text-gray-600">-</button>
                          <span className="px-3 font-bold text-sm">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="px-3 py-1 font-bold text-gray-600">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-2xl border p-6 h-fit text-right space-y-4">
                <h3 className="font-bold border-b pb-3">ملخص الطلب</h3>
                <div className="flex justify-between text-sm"><span class="text-gray-500">المجموع الفرعي</span><span>{subtotal.toLocaleString()} دج</span></div>
                <div className="flex justify-between text-sm"><span class="text-gray-500">رسوم التوصيل</span><span>{shipping.toLocaleString()} دج</span></div>
                <div className="flex justify-between text-sm text-red-500 font-bold"><span>الخصم</span><span>-{discount.toLocaleString()} دج</span></div>
                <div className="border-t pt-3 flex justify-between font-black text-xl"><span>المجموع الكلي</span><span className="text-[#B8860B]">{total.toLocaleString()} دج</span></div>
                <button onClick={() => alert('تم استلام طلبك بنجاح وسيتم الاتصال بك للـتأكيد!')} className="w-full py-3.5 bg-gradient-to-r from-[#E5C158] to-[#B8860B] text-black font-extrabold rounded-xl shadow-lg hover:opacity-90 transition">
                  إتمام الطلب
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">طرق الدفع: VISA • PayPal • الدفع عند الاستلام</p>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="bg-black text-gray-400 py-8 text-center text-sm border-t border-[#D4AF37]/20">
        <p>© 2026 Luxe Beauty - جميع الحقوق محفوظة.</p>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}
