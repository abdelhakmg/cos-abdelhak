import { state, INITIAL_WILAYAS_58 } from '../store/state.js';
import { safeCall } from '../utils/helpers.js';

// 🌟 نظام إدارة حالة الكتالوج والجلب الديناميكي (Smart Pagination Engine)
window.categoryCursors = {}; // حفظ نقطة التوقف لكل قسم بشكل مستقل
window.categoryHasMore = {}; // تتبع هل يوجد المزيد في فايرباس لكل قسم
let isFetchingProducts = false;
window.activeCategoryFilter = 'جميع المنتجات'; 

// 🌟 دالة مخصصة لترتيب الصفحة الرئيسية (أفضل 8 منتجات مبيعاً) وتجلب مرة واحدة
export async function loadHomeBestSellers() {
    try {
        const snapshot = await window.db.collection('products')
            .where('inStock', '==', true)
            .orderBy('salesCount', 'desc')
            .limit(8)
            .get();
            
        const bestSellers = [];
        snapshot.forEach(doc => bestSellers.push({id: doc.id, ...doc.data()}));
        
        // دمجها في المصفوفة المركزية دون تكرار
        bestSellers.forEach(newP => {
            if (!state.products.find(p => p.id === newP.id)) state.products.push(newP);
        });
        
        const grid = document.getElementById('home-products');
        if (grid) grid.innerHTML = bestSellers.map(window.renderSingleProductCard).join('');
        
        const btn = document.getElementById('load-more-home-btn');
        if (btn) btn.style.display = 'none'; // الصفحة الرئيسية لا تحتاج لزر المزيد
    } catch(err) {
        console.error("Error loading home best sellers:", err);
    }
}
// 🌟 متغيرات الحالة القديمة
let ordersUnsubscribe = null;
let analyticsUnsubscribe = null;
let isSyncInitialized = false;

// 🌟 دالة جلب المنتجات بالتدريج (Pagination) وفلترة الأقسام
export async function loadProducts(isLoadMore = false, category = 'جميع المنتجات') {
    if (typeof window.db === 'undefined' || isFetchingProducts) return;
    
    if (!isLoadMore) {
        window.activeCategoryFilter = category;
    }

    const cat = window.activeCategoryFilter;
    
    // إذا طلبنا المزيد ولا يوجد شيء في فايرباس لهذا القسم، نتوقف
    if (isLoadMore && window.categoryHasMore[cat] === false) return;

    isFetchingProducts = true;
    const btn = document.getElementById('load-more-catalog-btn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...';

    try {
        let query = window.db.collection("products");
        
        if (cat !== 'جميع المنتجات') {
            query = query.where("category", "==", cat);
        }
        
        query = query.orderBy("createdAt", "desc");
        
        // 🌟 30 منتج لقسم الكل، 16 لباقي الأقسام
        const limitCount = cat === 'جميع المنتجات' ? 30 : 16;
        query = query.limit(limitCount);
        
        if (isLoadMore && window.categoryCursors[cat]) {
            query = query.startAfter(window.categoryCursors[cat]);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            window.categoryHasMore[cat] = false;
            safeCall('applyFilters'); // إعادة رسم الواجهة
            isFetchingProducts = false;
            return;
        }

        window.categoryCursors[cat] = snapshot.docs[snapshot.docs.length - 1];
        window.categoryHasMore[cat] = snapshot.docs.length === limitCount;

        const fetchedProducts = [];
        snapshot.forEach((doc) => fetchedProducts.push({ id: doc.id, ...doc.data() }));

        // 🌟 دمج المنتجات الجديدة في الـ State المركزية بدون تكرار
        fetchedProducts.forEach(newP => {
            const index = state.products.findIndex(p => p.id === newP.id);
            if (index === -1) {
                state.products.push(newP);
            } else {
                state.products[index] = newP; // تحديث البيانات إن وجدت
            }
        });

        // 🌟 توجيه الرسم للكتالوج فقط (يفصل الواجهة عن الـ Fetching)
        safeCall('renderDynamicSidebarFilters');
        safeCall('renderBrandsFilterSidebar');
        safeCall('applyFilters');
        safeCall('renderAdminProductsTable');
        
        if (!isLoadMore) safeCall('checkInitialProductDeepLink');

    } catch (error) {
        console.error("Error fetching products:", error);
        if (btn) btn.innerHTML = 'حدث خطأ، حاول مجدداً <i class="fa-solid fa-rotate-right"></i>';
    } finally {
        isFetchingProducts = false;
    }
}
window.loadMoreProducts = () => loadProducts(true, window.activeCategoryFilter);
export function initFirebaseSync() {
    if (typeof window.firebase === 'undefined' || typeof window.db === 'undefined') {
        console.error("لم يتم تهيئة Firebase بشكل صحيح.");
        return;
    }

    if (isSyncInitialized) return;
    isSyncInitialized = true;

    window.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        console.warn("Firestore persistence warning:", err.code);
    });

    // 1. جلب المنتجات لمرة واحدة فقط (تم إيقاف onSnapshot المدمر للقراءات)
    loadProducts(false);
    // 2. مزامنة الولايات
    window.db.collection("wilayas").onSnapshot((snapshot) => {
        state.WILAYAS = [];
        snapshot.forEach((doc) => {
            state.WILAYAS.push({ id: doc.id, ...doc.data() });
        });
        
        if (state.WILAYAS.length === 0) {
            const batch = window.db.batch();
            INITIAL_WILAYAS_58.forEach(w => {
                const ref = window.db.collection("wilayas").doc(w.code);
                batch.set(ref, w);
            });
            batch.commit().catch(err => console.error("Batch error:", err));
        } else {
            state.WILAYAS.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            safeCall('populateWilayas');
            safeCall('populateCartWilayas');
            safeCall('renderAdminWilayasList');
        }
    }, (error) => console.error("Error fetching wilayas:", error));

    // 3. مزامنة الفئات (الأقسام)
    window.db.collection("categories").onSnapshot((snapshot) => {
        state.categories = [];
        snapshot.forEach((doc) => {
            state.categories.push({ id: doc.id, ...doc.data() });
        });
        safeCall('updateAppHeaderInfo');
        safeCall('populateAdminDropdowns');
        safeCall('renderAdminCategoriesList');
    }, (error) => console.error("Error fetching categories:", error));

    // 4. مزامنة الإعدادات العامة للمتجر
    window.db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            state.storeSettings = { ...state.storeSettings, ...data };
            // 🌟 إظهار أو إخفاء زر الخريطة بناءً على الرابط المحفوظ
            const gpsBtn = document.getElementById('link-gps');
            if (gpsBtn) {
                gpsBtn.href = data.gpsLink || '#';
                gpsBtn.style.display = data.gpsLink ? 'flex' : 'none';
            }
            if (data.brands) state.brands = data.brands;
            if (data.bannerMessages) state.bannerMessages = data.bannerMessages;
            if (data.categoryFilters) state.categoryFilters = data.categoryFilters;
            if (data.coupons) state.coupons = data.coupons;

            state.availableSkinTypes = (data.skinTypes && data.skinTypes.length > 0) ? data.skinTypes : state.availableSkinTypes;
            state.availableHairTypes = (data.hairTypes && data.hairTypes.length > 0) ? data.hairTypes : state.availableHairTypes;
        }
        
        safeCall('updateAppHeaderInfo');
        safeCall('updateSplashScreenText');
        safeCall('renderDynamicSidebarFilters');
        safeCall('populateAdminDropdowns');
        safeCall('renderAdminAttributesTab'); 
        safeCall('renderAdminBrandsList'); 
        safeCall('renderBannerTextsList'); 
        safeCall('renderAdminCouponsList');
        safeCall('startBannerTicker'); 
        safeCall('updateStoreFooterLinks');
    }, (error) => console.error("Error settings:", error));

    // 5. مزامنة البانر الإعلاني
    window.db.collection("heroSlides").onSnapshot((snapshot) => {
        state.heroSlides = [];
        snapshot.forEach((doc) => {
            state.heroSlides.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderHeroSlider');
        safeCall('renderAdminHeroSlidesList');
    }, (error) => console.error("Error fetching hero slides:", error));

    // 6. تشغيل نظام تتبع الزوار الذكي (داخل الدالة بعد تهيئة Firebase)
    initVisitorTracking();

    // 7. مزامنة الطلبيات ورادار الزوار للإدارة إذا كان المدير مسجلاً
    if (localStorage.getItem('cosAdminLoggedIn') === 'true') {
        initAdminOrdersSync();
        initAdminAnalyticsSync();
    }
} // 👈 هنا ينتهي قوس initFirebaseSync الصحيح

// 🌟 دالة محمية من التكرار لجلب آخر 200 طلبية للمسؤول فقط
export function initAdminOrdersSync(limitCount = 200) {
    if (typeof window.db === 'undefined') return;
    
    if (ordersUnsubscribe) {
        ordersUnsubscribe();
    }

    ordersUnsubscribe = window.db.collection("orders")
        .orderBy("createdAt", "desc")
        .limit(limitCount)
        .onSnapshot((snapshot) => {
            state.orders = [];
            snapshot.forEach((doc) => {
                state.orders.push({ id: doc.id, ...doc.data() });
            });
            safeCall('renderAdminDashboard');
        }, (error) => console.error("Error fetching orders:", error));
}

// ==========================================
// 🟢 محرك رادار الزوار الذكي (Live Presence & Daily/Monthly Analytics)
// ==========================================
export async function initVisitorTracking() {
    if (typeof window.db === 'undefined') return;

    let sessionId = sessionStorage.getItem('cos_session_id');
    const isNewSession = !sessionId;
    if (!sessionId) {
        sessionId = 'v_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
        sessionStorage.setItem('cos_session_id', sessionId);
    }

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);
    const analyticsRef = window.db.collection("settings").doc("analytics");

    const updatePresence = async (countVisit = false) => {
        try {
            const doc = await analyticsRef.get();
            const nowMs = Date.now();
            let data = doc.exists ? doc.data() : {};

            let dayDate = data.dayDate || todayKey;
            let monthDate = data.monthDate || monthKey;
            let todayViews = Number(data.todayViews) || 0;
            let monthViews = Number(data.monthViews) || 0;
            let activeSessions = data.activeSessions || {};

            if (dayDate !== todayKey) {
                dayDate = todayKey;
                todayViews = 0;
            }
            if (monthDate !== monthKey) {
                monthDate = monthKey;
                monthViews = 0;
            }

            if (countVisit) {
                todayViews += 1;
                monthViews += 1;
            }

            Object.keys(activeSessions).forEach(id => {
                if (nowMs - activeSessions[id] > 240000) {
                    delete activeSessions[id];
                }
            });

            activeSessions[sessionId] = nowMs;

            await analyticsRef.set({
                dayDate,
                monthDate,
                todayViews,
                monthViews,
                activeSessions
            }, { merge: true });
        } catch (err) {
            console.warn("Analytics tracking info:", err.message);
        }
    };

    updatePresence(isNewSession);

    setInterval(() => {
        if (document.visibilityState === 'visible') {
            updatePresence(false);
        }
    }, 120000);

    window.addEventListener('beforeunload', () => {
        analyticsRef.update({
            [`activeSessions.${sessionId}`]: window.firebase.firestore.FieldValue.delete()
        }).catch(() => {});
    });
}

export function initAdminAnalyticsSync() {
    if (typeof window.db === 'undefined') return;
    if (analyticsUnsubscribe) {
        analyticsUnsubscribe();
    }

    analyticsUnsubscribe = window.db.collection("settings").doc("analytics")
        .onSnapshot((doc) => {
            if (!doc.exists) return;
            const data = doc.data();
            const nowMs = Date.now();
            const todayKey = new Date().toISOString().slice(0, 10);
            const monthKey = new Date().toISOString().slice(0, 7);

            const sessions = data.activeSessions || {};
            const liveCount = Object.values(sessions).filter(ts => (nowMs - ts) <= 240000).length;

            const todayCount = (data.dayDate === todayKey) ? (data.todayViews || 0) : 0;
            const monthCount = (data.monthDate === monthKey) ? (data.monthViews || 0) : 0;

            const liveEl = document.getElementById('stat-visitors-live');
            const todayEl = document.getElementById('stat-visitors-today');
            const monthEl = document.getElementById('stat-visitors-month');

            if (liveEl) liveEl.innerText = Math.max(1, liveCount).toLocaleString();
            if (todayEl) todayEl.innerText = todayCount.toLocaleString();
            if (monthEl) monthEl.innerText = monthCount.toLocaleString();
        }, (err) => console.warn("Admin analytics sync warning:", err));
}

window.initVisitorTracking = initVisitorTracking;
window.initAdminAnalyticsSync = initAdminAnalyticsSync;
window.initFirebaseSync = initFirebaseSync;
window.initAdminOrdersSync = initAdminOrdersSync;
// ==========================================
// 🌟 محرك البحث الذكي والمحلي (بحث عميق بدون قراءات إضافية)
// ==========================================
let localSearchIndex = [];
let isIndexLoaded = false;

// 1. تحميل الفهرس (قراءة واحدة فقط عند أول بحث للزائر)
export async function loadSearchIndex() {
    if (isIndexLoaded) return;
    try {
        const doc = await window.db.collection('store_settings').doc('search_index').get();
        if (doc.exists) {
            localSearchIndex = doc.data().items || [];
            isIndexLoaded = true;
            console.log('✅ تم تحميل فهرس البحث السريع بنجاح!');
        }
    } catch (error) {
        console.error("❌ خطأ في تحميل الفهرس:", error);
    }
}

// 2. دالة البحث المتقدم (تعمل محلياً في هاتف الزبون بسرعة الخيال)
export function performAdvancedSearch(query) {
    if (!isIndexLoaded) return;
    
    if (!query.trim()) {
        safeCall('applyFilters'); // العودة للكتالوج الطبيعي عند تفريغ البحث
        return;
    }

    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    
    // البحث في الفهرس الخفيف لجميع منتجات المتجر
    const matchedProducts = localSearchIndex.filter(product => {
        return searchTerms.every(term => product.keywords.includes(term));
    });

    const grid = document.getElementById('catalog-products');
    const badge = document.getElementById('products-count-badge');
    const loadMoreBtn = document.getElementById('load-more-catalog-btn');

    if (badge) badge.innerText = matchedProducts.length;
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    if (grid) {
        grid.innerHTML = matchedProducts.length === 0 ? 
            '<div class="col-span-full text-center py-16 space-y-3"><i class="fa-solid fa-box-open text-4xl text-gray-600"></i><p class="text-gray-400 text-sm">لا توجد نتائج مطابقة لبحثك.</p></div>' :
            matchedProducts.map(p => window.renderSingleProductCard(p)).join(''); // يعتمد على بيانات الفهرس الخفيفة
    }
    
    safeCall('showPage', 'catalog');
}

// تصدير الدوال لتكون متاحة لشريط البحث في HTML
window.performAdvancedSearch = performAdvancedSearch;
window.loadSearchIndex = loadSearchIndex;
