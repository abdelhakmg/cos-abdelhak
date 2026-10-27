import { state, INITIAL_WILAYAS_58 } from '../store/state.js';
import { safeCall } from '../utils/helpers.js';

// 🌟 نظام إدارة حالة الكتالوج والجلب الديناميكي السريع
window.categoryCursors = {}; 
window.categoryHasMore = {}; 
window.loadedCountsPerCategory = {}; // لتتبع عدد المنتجات المعروضة في كل قسم بدقة
let activeFetchVersion = 0; // لمنع تعارض الطلبات دون تجميد الواجهة
window.activeCategoryFilter = 'جميع المنتجات'; 

// 🌟 1. دالة الصفحة الرئيسية (أفضل 8 منتجات مبيعاً - سريعة ومضمونة)
export async function loadHomeBestSellers() {
    if (typeof window.db === 'undefined') return;
    try {
        const snapshot = await window.db.collection('products').limit(24).get();
        let prods = [];
        snapshot.forEach(doc => prods.push({ id: doc.id, ...doc.data() }));

        // دمج في الذاكرة المركزية دون تكرار
        prods.forEach(newP => {
            const idx = state.products.findIndex(p => p.id === newP.id);
            if (idx === -1) state.products.push(newP);
            else state.products[idx] = newP;
        });

        // فلترة المتوفر وترتيبه محلياً حسب الأكثر مبيعاً ثم أخذ 8
        const bestSellers = prods
            .filter(p => p.inStock !== false)
            .sort((a, b) => (Number(b.salesCount) || 0) - (Number(a.salesCount) || 0))
            .slice(0, 8);

        const grid = document.getElementById('home-products');
        if (grid && typeof window.renderSingleProductCard === 'function') {
            grid.innerHTML = bestSellers.map(window.renderSingleProductCard).join('');
        }

        const btn = document.getElementById('load-more-home-btn');
        if (btn) btn.style.display = 'none';
    } catch (err) {
        console.error("Error loading home best sellers:", err);
    }
}

// 🌟 2. دالة جلب كافة المنتجات للمدير فقط (للوحة التحكم وفهرس البحث الشامل)
export async function loadAllProductsForAdmin() {
    if (typeof window.db === 'undefined') return;
    try {
        const snapshot = await window.db.collection("products").get();
        const allProds = [];
        snapshot.forEach(doc => allProds.push({ id: doc.id, ...doc.data() }));

        // ترتيب الأحدث أولاً محلياً
        allProds.sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return tB - tA;
        });

        state.products = allProds;
        safeCall('renderAdminProductsTable');
        safeCall('populateAdminDropdowns');
        safeCall('renderDynamicSidebarFilters');
        safeCall('renderBrandsFilterSidebar');
        safeCall('applyFilters');
    } catch (err) {
        console.error("Admin full products load error:", err);
    }
}
window.loadAllProductsForAdmin = loadAllProductsForAdmin;

// 🌟 3. دالة جلب المنتجات للزوار بالتدريج (30 للكل / 16 للأقسام) بسرعة فائقة
export async function loadProducts(isLoadMore = false, category = 'جميع المنتجات') {
    if (typeof window.db === 'undefined') return;

    const isAdmin = localStorage.getItem('cosAdminLoggedIn') === 'true';

    // إذا كان المدير مسجلاً وطلب الجلب الأولي، نجلب له كل المنتجات بدون قيود
    if (isAdmin && !isLoadMore && state.products.length <= 30) {
        await loadAllProductsForAdmin();
    }

    const cat = (category || window.activeCategoryFilter || 'جميع المنتجات').trim();
    window.activeCategoryFilter = cat;

    const step = cat === 'جميع المنتجات' ? 30 : 16;

    if (!isLoadMore) {
        window.loadedCountsPerCategory[cat] = step;
    } else {
        if (window.categoryHasMore[cat] === false) return;
        window.loadedCountsPerCategory[cat] = (window.loadedCountsPerCategory[cat] || step) + step;
    }

    const currentFetchId = ++activeFetchVersion;

    const btn = document.getElementById('load-more-catalog-btn');
    if (btn && isLoadMore) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري جلب المزيد...';
    }

    try {
        let query = window.db.collection("products");

        // ⚠️ هام جداً: عدم دمج where مع orderBy لتجنب تعليق Firebase بسبب الفهارس المركبة
        if (cat !== 'جميع المنتجات') {
            query = query.where("category", "==", cat);
        }

        query = query.limit(step);

        if (isLoadMore && window.categoryCursors[cat]) {
            query = query.startAfter(window.categoryCursors[cat]);
        }

        const snapshot = await query.get();

        // إذا قام الزبون بتغيير القسم أثناء التحميل، نتجاهل النتيجة القديمة
        if (currentFetchId !== activeFetchVersion) return;

        if (snapshot.empty) {
            window.categoryHasMore[cat] = false;
            safeCall('applyFilters', isLoadMore);
            return;
        }

        window.categoryCursors[cat] = snapshot.docs[snapshot.docs.length - 1];
        window.categoryHasMore[cat] = snapshot.docs.length === step;

        const fetchedProducts = [];
        snapshot.forEach((doc) => {
            fetchedProducts.push({ id: doc.id, ...doc.data() });
        });

        // دمج المنتجات الجديدة في state.products بدون تكرار
        fetchedProducts.forEach(newP => {
            const index = state.products.findIndex(p => p.id === newP.id);
            if (index === -1) {
                state.products.push(newP);
            } else {
                state.products[index] = newP;
            }
        });

        safeCall('renderDynamicSidebarFilters');
        safeCall('renderBrandsFilterSidebar');
        safeCall('applyFilters', isLoadMore);
        if (isAdmin) safeCall('renderAdminProductsTable');
        if (!isLoadMore) safeCall('checkInitialProductDeepLink');

    } catch (error) {
        console.error("Error fetching products:", error);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'حدث خطأ، اضغط للمحاولة مجدداً <i class="fa-solid fa-rotate-right mr-2"></i>';
        }
    } finally {
        if (btn) btn.disabled = false;
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
// 🌟 محرك البحث الذكي والمحلي (بحث عميق في كامل المتجر)
// ==========================================
let localSearchIndex = [];
let isIndexLoaded = false;

export async function loadSearchIndex() {
    if (isIndexLoaded) return;
    try {
        // 🔒 تم تصحيح المسار إلى settings بدلاً من store_settings ليتوافق مع firestore.rules
        const doc = await window.db.collection('settings').doc('search_index').get();
        if (doc.exists && doc.data().items) {
            localSearchIndex = doc.data().items || [];
            isIndexLoaded = true;
            // تحديث عداد إجمالي المنتجات الكلي في المتجر إن كنا في قسم جميع المنتجات
            window.totalStoreProductsCount = localSearchIndex.length;
        }
    } catch (error) {
        console.warn("Search index notice:", error.message);
    }
}

export async function performAdvancedSearch(query) {
    const q = (query || '').trim();
    
    if (!q) {
        safeCall('applyFilters', false);
        return;
    }

    if (!isIndexLoaded) {
        await loadSearchIndex();
    }

    const searchTerms = q.toLowerCase().split(/\s+/);
    
    // البحث في الفهرس الشامل، وإذا لم يكن الفهرس منشأ بعد نبحث في state.products كاحتياط
    const searchPool = localSearchIndex.length > 0 ? localSearchIndex : state.products;

    const matchedProducts = searchPool.filter(product => {
        const textToSearch = product.keywords || `${product.name || ''} ${product.desc || ''} ${product.category || ''} ${product.brand || ''}`.toLowerCase();
        return searchTerms.every(term => textToSearch.includes(term));
    });

    safeCall('showPage', 'catalog');
    
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = `نتائج البحث عن: "${q}"`;

    const grid = document.getElementById('catalog-products');
    const badge = document.getElementById('products-count-badge');
    const loadMoreBtn = document.getElementById('load-more-catalog-btn');

    if (badge) badge.innerText = matchedProducts.length;
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    if (grid && typeof window.renderSingleProductCard === 'function') {
        grid.innerHTML = matchedProducts.length === 0 ? 
            '<div class="col-span-full text-center py-16 space-y-3"><i class="fa-solid fa-box-open text-4xl text-gray-600"></i><p class="text-gray-400 text-sm">لا توجد منتجات مطابقة لبحثك.</p></div>' :
            matchedProducts.map(p => window.renderSingleProductCard(p)).join('');
    }
}

window.performAdvancedSearch = performAdvancedSearch;
window.loadSearchIndex = loadSearchIndex;
