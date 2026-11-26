const admin = require('firebase-admin');

// تهيئة Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

// دالة موحدة لتنظيف رقم الهاتف الجزائري
function normalizePhone(raw) {
    let p = String(raw || '').trim().replace(/\s+/g, '');
    if (p.startsWith('+213')) p = '0' + p.substring(4);
    else if (p.startsWith('00213')) p = '0' + p.substring(5);
    return p;
}

module.exports = async (req, res) => {
    // 🌟 1. طلبات تتبع الطلبيات عبر GET
    if (req.method === 'GET') {
        try {
            const phoneQuery = normalizePhone(req.query.phone);
            if (!phoneQuery) {
                return res.status(400).json({ error: 'رقم الهاتف مطلوب.' });
            }

            const snapshot = await db.collection('orders')
                .where('phone', '==', phoneQuery)
                .get();

            const orders = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                orders.push({
                    id: doc.id,
                    customer: data.customer,
                    phone: data.phone,
                    wilaya: data.wilaya,
                    commune: data.commune,
                    product: data.product,
                    total: data.total,
                    status: data.status,
                    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null
                });
            });

            orders.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

            return res.status(200).json({ success: true, orders });
        } catch (error) {
            console.error("Tracking API Error:", error);
            return res.status(500).json({ error: 'حدث خطأ أثناء البحث عن الطلب.' });
        }
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'طريقة غير مسموحة' });

    try {
        const orderData = req.body || {};

        if (!orderData.customer || !orderData.phone || !orderData.wilaya) {
            return res.status(400).json({ error: 'البيانات غير مكتملة، يرجى ملء كافة الحقول.' });
        }

        if (!orderData.purchasedItems || !Array.isArray(orderData.purchasedItems) || orderData.purchasedItems.length === 0) {
            return res.status(400).json({ error: 'سلة المشتريات فارغة أو البيانات مفقودة.' });
        }

        // 🔒 1. توحيد رقم الهاتف وفحص السبام (طلب واحد كل دقيقتين)
        const cleanPhone = normalizePhone(orderData.phone);
        if (!/^(05|06|07)[0-9]{8}$/.test(cleanPhone)) {
            return res.status(400).json({ error: 'رقم الهاتف الجزائري غير صحيح.' });
        }

        const recentOrders = await db.collection('orders').where('phone', '==', cleanPhone).get();
        let isSpam = false;
        const twoMinutesAgo = Date.now() - 120000;

        if (!recentOrders.empty) {
            recentOrders.forEach(doc => {
                const data = doc.data();
                if (data.createdAt) {
                    const orderTime = data.createdAt.toDate ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime();
                    if (orderTime > twoMinutesAgo) {
                        isSpam = true;
                    }
                }
            });
        }

        if (isSpam) {
            return res.status(429).json({ error: 'لقد قمت بإرسال طلب للتو! يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.' });
        }

        // 🔒 2. التحقق من طريقة الدفع وتحديد الحالة حصراً من السيرفر
        const allowedMethods = ['cod', 'in_store', 'baridimob'];
        const safePaymentMethod = allowedMethods.includes(orderData.paymentMethod) ? orderData.paymentMethod : 'cod';

        if (safePaymentMethod === 'baridimob' && (!orderData.baridimobReceipt || typeof orderData.baridimobReceipt !== 'string' || !orderData.baridimobReceipt.startsWith('https://'))) {
            return res.status(400).json({ error: 'يرجى إرفاق وصل دفع بريدي موب صالح لتأكيد الطلب.' });
        }

        const safePaymentStatus = safePaymentMethod === 'baridimob'
            ? 'paid_pending_check'
            : (safePaymentMethod === 'in_store' ? 'pending' : 'cod_pending');

        // 🔒 3. حساب السعر الحقيقي للمنتجات من قاعدة البيانات (وحماية الكميات)
        let calculatedProductsTotal = 0;
        const batch = db.batch();
        let hasBatchUpdates = false;

        for (const item of orderData.purchasedItems) {
            const itemQty = Math.max(1, Math.min(100, parseInt(item.qty, 10) || 1));
            const itemId = String(item.id || '');
            const isSpecialItem = itemId.startsWith('custom_') || itemId.startsWith('gift_') || itemId.startsWith('cp_');

            if (itemId && !isSpecialItem) {
                const productDoc = await db.collection('products').doc(itemId).get();
                if (productDoc.exists) {
                    const productData = productDoc.data();
                    calculatedProductsTotal += (Number(productData.price) || 0) * itemQty;

                    batch.update(productDoc.ref, {
                        salesCount: admin.firestore.FieldValue.increment(itemQty)
                    });
                    hasBatchUpdates = true;
                }
            } else if (item.price) {
                // المنتجات المخصصة والورشة والهدايا
                calculatedProductsTotal += Math.max(0, Number(item.price) || 0) * itemQty;
            }
        }

        if (hasBatchUpdates) {
            await batch.commit();
        }

        // 🔒 4. حماية السعر النهائي مع احترام الكوبونات الفعالة وتكلفة التوصيل
        let maxPossibleDiscount = 0;
        try {
            const mainSettingsDoc = await db.collection('settings').doc('main').get();
            const coupons = mainSettingsDoc.exists ? (mainSettingsDoc.data().coupons || []) : [];
            for (const c of coupons) {
                const disc = c.type === 'percent'
                    ? Math.round(calculatedProductsTotal * (Math.min(100, Number(c.value) || 0) / 100))
                    : Math.max(0, Number(c.value) || 0);
                if (disc > maxPossibleDiscount) maxPossibleDiscount = disc;
            }
        } catch (e) {
            console.warn("Coupons check fallback:", e.message);
        }

        const minAllowedTotal = Math.max(0, calculatedProductsTotal - maxPossibleDiscount);
        const clientTotal = Number(orderData.total);
        const finalTotal = (isNaN(clientTotal) || clientTotal < minAllowedTotal)
            ? minAllowedTotal
            : clientTotal;

        // 5. حفظ الطلبية المؤمّنة
        const secureOrder = {
            customer: String(orderData.customer).trim(),
            phone: cleanPhone,
            wilaya: String(orderData.wilaya).trim(),
            commune: String(orderData.commune || '').trim(),
            product: String(orderData.product || '').trim(),
            total: finalTotal,
            status: 'جديد',
            date: new Date().toLocaleDateString('ar-DZ'),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),

            paymentMethod: safePaymentMethod,
            paymentStatus: safePaymentStatus,
            baridimobReceipt: safePaymentMethod === 'baridimob' ? orderData.baridimobReceipt : null,

            attachedImage1: orderData.attachedImage1 || null,
            attachedImage2: orderData.attachedImage2 || null,
            attachedImage3: orderData.attachedImage3 || null
        };

        const orderRef = await db.collection('orders').add(secureOrder);

        return res.status(200).json({ success: true, orderId: orderRef.id });
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
    }
};
