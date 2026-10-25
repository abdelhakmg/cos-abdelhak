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

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'طريقة غير مسموحة' });

    try {
        const orderData = req.body;

        if (!orderData.customer || !orderData.phone || !orderData.wilaya) {
            return res.status(400).json({ error: 'البيانات غير مكتملة، يرجى ملء كافة الحقول.' });
        }

        let calculatedTotal = 0;
        const batch = db.batch();

        // 1. حساب السعر الحقيقي من الخادم وتحديث المبيعات في نفس الوقت
        if (orderData.purchasedItems && Array.isArray(orderData.purchasedItems)) {
            for (const item of orderData.purchasedItems) {
                // تجاوز المنتجات المخصصة أو الهدايا التي قد لا تكون مسجلة بنفس الطريقة
                if (item.id && !String(item.id).startsWith('custom_') && !String(item.id).startsWith('gift_')) {
                    const productDoc = await db.collection('products').doc(item.id).get();
                    if (productDoc.exists) {
                        const productData = productDoc.data();
                        const itemQty = Number(item.qty) || 1;
                        calculatedTotal += (Number(productData.price) || 0) * itemQty;
                        
                        // تحديث المبيعات
                        batch.update(productDoc.ref, {
                            salesCount: admin.firestore.FieldValue.increment(itemQty)
                        });
                    }
                } else if (item.price) {
                    // للمنتجات المخصصة أو الهدايا، نأخذ سعرها الممرر (أو يمكن برمجتها للتحقق من المكونات)
                    calculatedTotal += (Number(item.price) || 0) * (Number(item.qty) || 1);
                }
            }
            await batch.commit();
        } else {
            // كإجراء احتياطي إذا لم يتم تمرير purchasedItems
            calculatedTotal = Number(orderData.total) || 0;
        }

        // 2. معالجة وتأمين البيانات قبل حفظها (نستخدم calculatedTotal بدلاً من orderData.total)
        const secureOrder = {
            customer: orderData.customer,
            phone: orderData.phone,
            wilaya: orderData.wilaya,
            commune: orderData.commune,
            product: orderData.product,
            total: calculatedTotal > 0 ? calculatedTotal : Number(orderData.total), // تأمين السعر
            status: 'جديد',
            date: new Date().toLocaleDateString('ar-DZ'),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            attachedImage1: orderData.attachedImage1 || null,
            attachedImage2: orderData.attachedImage2 || null,
            attachedImage3: orderData.attachedImage3 || null
        };

        // 3. إضافة الطلبية
        const orderRef = await db.collection('orders').add(secureOrder);

        return res.status(200).json({ success: true, orderId: orderRef.id });
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
    }
};
