const admin = require('firebase-admin');

// تهيئة Firebase Admin SDK للوصول الآمن (يجب وضع هذه المتغيرات في إعدادات Vercel)
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

module.exports = async (req, res) => {
    // التأكد من أن الطلب هو POST
    if (req.method !== 'POST') return res.status(405).json({ error: 'طريقة غير مسموحة' });

    try {
        const orderData = req.body;

        // 1. حماية أساسية: التحقق من وجود البيانات الضرورية
        if (!orderData.customer || !orderData.phone || !orderData.wilaya) {
            return res.status(400).json({ error: 'البيانات غير مكتملة، يرجى ملء كافة الحقول.' });
        }

        // 2. معالجة وتأمين البيانات قبل حفظها
        const secureOrder = {
            customer: orderData.customer,
            phone: orderData.phone,
            wilaya: orderData.wilaya,
            commune: orderData.commune,
            product: orderData.product,
            total: Number(orderData.total), // تأمين السعر كرقم
            status: 'جديد',
            date: new Date().toLocaleDateString('ar-DZ'),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            attachedImage1: orderData.attachedImage1 || null,
            attachedImage2: orderData.attachedImage2 || null,
            attachedImage3: orderData.attachedImage3 || null
        };

        // 3. إضافة الطلبية إلى قاعدة البيانات
        const orderRef = await db.collection('orders').add(secureOrder);

        // 4. تحديث المبيعات بأمان من السيرفر إذا تم تمرير معرفات المنتجات
        if (orderData.purchasedItems && Array.isArray(orderData.purchasedItems)) {
            const batch = db.batch();
            orderData.purchasedItems.forEach(item => {
                if (item.id && !String(item.id).startsWith('custom_') && !String(item.id).startsWith('gift_')) {
                    const productRef = db.collection('products').doc(item.id);
                    batch.update(productRef, {
                        salesCount: admin.firestore.FieldValue.increment(item.qty || 1)
                    });
                }
            });
            await batch.commit();
        }

        return res.status(200).json({ success: true, orderId: orderRef.id });
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
    }
};
