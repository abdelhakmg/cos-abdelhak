// --- ملف js/ui.js ---

import { state, saveFavsToLocal } from './store/state.js';
import { formatPrice, safeCall, showCustomAlert } from './utils/helpers.js';

// 1. تصميم ورسم بطاقة المنتج (Product Card)
export function renderSingleProductCard(p) {
    let displayImg = (p.images && p.images[0]) || p.image || 'https://via.placeholder.com/300';
    const isFav = state.favorites.includes(p.id);

    return `
        <div class="bg-white text-gray-900 rounded-2xl border p-4 text-right flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-all duration-300 transform hover:-translate-y-2 group relative">
            <button onclick="event.stopPropagation(); toggleFavorite('${p.id}');" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-sm cursor-pointer">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>

            <div class="cursor-pointer" onclick="safeCall('openLandingPage', '${p.id}')">
                <div class="h-48 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center overflow-hidden">
                    <img src="${displayImg}" loading="lazy" class="max-h-full object-contain group-hover:scale-105 transition duration-500">
                </div>
                <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="w-2 h-2 rounded-full ${p.inStock !== false ? 'bg-green-500 animate-ping' : 'bg-red-500'}"></span>
                    <span class="text-[10px] font-bold ${p.inStock !== false ? 'text-green-600' : 'text-red-500'}">${p.inStock !== false ? 'متوفر' : 'غير متوفر'}</span>
                </div>
                <h3 class="font-bold text-sm text-gray-900 truncate my-1 group-hover:text-[#B8860B] transition">${p.name || 'منتج'}</h3>
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-black text-base text-[#B8860B]">${formatPrice(p.price)}</span>
                    ${p.oldPrice ? `<span class="text-xs text-gray-400 line-through">${formatPrice(p.oldPrice)}</span>` : ''}
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <button onclick="event.stopPropagation(); addToCart('${p.id}');" class="w-full py-2.5 bg-black text-white hover:bg-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                    <i class="fa-solid fa-bag-shopping text-xs"></i> أضف إلى السلة
                </button>
                <button onclick="event.stopPropagation(); safeCall('openLandingPage', '${p.id}');" class="w-full py-2.5 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition cursor-pointer">
                    اطلب الآن 🔥
                </button>
            </div>
        </div>
    `;
}

// 2. عرض المنتجات في الصفحة الرئيسية (الأكثر مبيعاً)
export function renderProducts() {
    const grid = document.getElementById('home-products');
    if (!grid) return;

    let bestSellers = [...state.products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 8);
    grid.innerHTML = bestSellers.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">جاري تحميل المنتجات...</p>' : 
        bestSellers.map(renderSingleProductCard).join('');
}

// 3. نظام المفضلة (Wishlist)
export function toggleFavorite(id) {
    if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(favId => favId !== id);
    } else {
        state.favorites.push(id);
    }
    saveFavsToLocal();
    safeCall('updateBadges');
    renderProducts();
    const activePage = document.querySelector('.page-sec.active');
    if (activePage && activePage.id === 'page-wishlist') {
        safeCall('renderWishlistPage');
    }
}

export function renderWishlistPage() {
    const grid = document.getElementById('wishlist-products-grid');
    if (!grid) return;
    const favProducts = state.products.filter(p => state.favorites.includes(p.id));
    grid.innerHTML = favProducts.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">لم تقم بإضافة أي منتج للمفضلة بعد.</p>' : 
        favProducts.map(renderSingleProductCard).join('');
}

// 4. نظام البحث المباشر السريع (Live Search)
export function handleLiveSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    
    const q = query.trim().toLowerCase();
    if (!q) {
        if (dropdown) dropdown.classList.add('hidden');
        if (mobileDropdown) mobileDropdown.classList.add('hidden');
        return;
    }

    const matches = state.products.filter(p => {
        const skinsStr = Array.isArray(p.skinTypes) ? p.skinTypes.join(' ') : (p.skinType || '');
        const hairsStr = Array.isArray(p.hairTypes) ? p.hairTypes.join(' ') : (p.hairType || '');
        
        return (p.name && p.name.toLowerCase().includes(q)) || 
               (p.category && p.category.toLowerCase().includes(q)) ||
               (p.brand && p.brand.toLowerCase().includes(q)) ||
               skinsStr.toLowerCase().includes(q) ||
               hairsStr.toLowerCase().includes(q);
    }).slice(0, 5);

    let htmlContent = '';
    if (matches.length === 0) {
        htmlContent = '<div class="p-4 text-xs text-amber-400 text-center">المنتج غير متوفر، تأكد من البحث يدوياً في الفئات.</div>';
    } else {
        htmlContent = matches.map(p => `
            <div onclick="safeCall('openLandingPage', '${p.id}'); hideAllDropdowns();" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                <img src="${(p.images && p.images[0]) || p.image || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-contain rounded-lg bg-black" loading="lazy">
                <div class="text-right">
                    <p class="text-xs font-bold text-white truncate">${p.name}</p>
                    <p class="text-[10px] text-[#D4AF37] font-bold">${formatPrice(p.price)}</p>
                </div>
            </div>
        `).join('');
    }

    if (dropdown) { dropdown.innerHTML = htmlContent; dropdown.classList.remove('hidden'); }
    if (mobileDropdown) { mobileDropdown.innerHTML = htmlContent; mobileDropdown.classList.remove('hidden'); }
}

export function hideAllDropdowns() {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (mobileDropdown) mobileDropdown.classList.add('hidden');
}

// 5. ربط الدوال بالواجهة
window.renderSingleProductCard = renderSingleProductCard;
window.renderProducts = renderProducts;
window.toggleFavorite = toggleFavorite;
window.renderWishlistPage = renderWishlistPage;
window.handleLiveSearch = handleLiveSearch;
window.hideAllDropdowns = hideAllDropdowns;
