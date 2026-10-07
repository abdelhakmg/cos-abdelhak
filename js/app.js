function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'admin') renderAdminDashboard();
}

function renderProducts() {
    const grid = document.getElementById('home-products');
    const catGrid = document.getElementById('catalog-products');

    const html = products.map(p => `
        <div class="bg-white rounded-2xl border p-4 text-right flex flex-col justify-between shadow-sm">
            <div class="h-44 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center cursor-pointer" onclick="openLandingPage(${p.id})">
                <img src="${p.image}" class="max-h-full object-contain">
            </div>
            <div>
                <h3 class="font-bold text-sm my-1 truncate">${p.name}</h3>
                <div class="font-black text-[#B8860B] mb-3">${p.price.toLocaleString()} دج</div>
            </div>
            <button onclick="openLandingPage(${p.id})" class="w-full py-2.5 gold-gradient text-black font-extrabold text-xs rounded-xl">اطلب الآن 🔥</button>
        </div>
    `).join('');

    if (grid) grid.innerHTML = html;
    if (catGrid) catGrid.innerHTML = html;
}

// Init Application
renderProducts();
