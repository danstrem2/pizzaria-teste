// --- State ---
let cart = [];
let currentProduct = null;
let currentModalQty = 1;

// --- DOM Elements ---
const homeView = document.getElementById('home-view');
const requestsView = document.getElementById('requests-view');
const cartView = document.getElementById('cart-view');
const views = { home: homeView, requests: requestsView, cart: cartView };

const categoryTabs = document.getElementById('category-tabs');
const popularCarousel = document.getElementById('popular-carousel');
const productSections = document.getElementById('product-sections');
const cartContainer = document.getElementById('cart-container');
const cartBadge = document.getElementById('cart-badge');

const productModal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalPrice = document.getElementById('modal-price');
const modalQty = document.getElementById('modal-qty');
const modalObs = document.getElementById('modal-obs');

// --- Initialization ---
function init() {
    renderCategories();
    renderPopular();
    renderProducts();
    setupNav();
    updateCartUI();
    renderNeighborhoods(); // New
}

function renderNeighborhoods() {
    const select = document.getElementById('client-neighborhood');
    const mapContainer = document.getElementById('delivery-neighborhoods');

    // Sort alphabetically
    const sorted = menuData.neighborhoods.sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(n => {
        // Populate checkout dropdown
        if (select) {
            const option = document.createElement('option');
            option.value = n.name;
            option.dataset.fee = n.fee;
            option.textContent = `${n.name} (+ R$ ${n.fee.toFixed(2).replace('.', ',')})`;
            select.appendChild(option);
        }

        // Populate map section badges
        if (mapContainer) {
            const badge = document.createElement('span');
            badge.className = 'neighborhood-badge';
            badge.textContent = n.name;
            mapContainer.appendChild(badge);
        }
    });

    // Update total on change
    if (select) {
        select.addEventListener('change', updateCheckoutTotal);
    }
}

// --- Navigation ---
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.target;
            showView(target);

            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function showView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');

    // Update nav icons if triggered programmatically
    document.querySelectorAll('.nav-item').forEach(nav => {
        if (nav.dataset.target === viewName) nav.classList.add('active');
        else nav.classList.remove('active');
    });

    if (viewName === 'cart') {
        renderCart();
    }
}

// --- Render Home ---
function renderCategories() {
    menuData.categories.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
        btn.innerText = cat.name;
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`section-${cat.id}`).scrollIntoView({ behavior: 'smooth' });
        };
        categoryTabs.appendChild(btn);
    });
}

function renderPopular() {
    const popular = [];
    Object.values(menuData.products).forEach(list => {
        list.forEach(p => {
            if (p.isPopular) popular.push(p);
        });
    });

    popular.forEach(p => {
        const div = document.createElement('div');
        div.className = 'popular-card';
        div.onclick = () => openModal(p);
        div.innerHTML = `
            <img src="${p.image}" class="popular-img">
            <div class="popular-name">${p.name}</div>
            <div class="popular-price">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
        `;
        popularCarousel.appendChild(div);
    });
}

function renderProducts() {
    menuData.categories.forEach(cat => {
        const section = document.createElement('div');
        section.id = `section-${cat.id}`;

        const title = document.createElement('div');
        title.className = 'section-title';
        title.innerText = cat.name;
        section.appendChild(title);

        const list = document.createElement('div');
        list.className = 'product-list';

        menuData.products[cat.id].forEach(p => {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.onclick = () => openModal(p);
            item.innerHTML = `
                <div class="product-info">
                    <div class="product-name">
                        ${p.name} 
                        ${p.isPopular ? '<span class="badge-popular"><i class="fas fa-star"></i> Top</span>' : ''}
                    </div>
                    <div class="product-desc">${p.description}</div>
                    <div class="product-price">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
                </div>
                <img src="${p.image}" class="product-img">
            `;
            list.appendChild(item);
        });

        section.appendChild(list);
        productSections.appendChild(section);
    });
}

// --- Modal Logic ---
function openModal(product) {
    currentProduct = product;
    currentModalQty = 1;
    modalTitle.innerText = product.name;
    modalDesc.innerText = product.description;
    modalObs.value = '';
    updateModalPrice();

    // Reset 2nd flavor
    const secondFlavorContainer = document.getElementById('second-flavor-container');
    const secondFlavorSelect = document.getElementById('second-flavor-select');

    // Logic: Only show 2nd flavor for "Pizzas" and maybe only "Grande" if desired.
    // For now, let's assume all PIZZAS can be half-half.
    // We determine if it's a pizza by checking the category of the product or just presence in 'pizzas' list.
    const isPizza = menuData.products.pizzas.find(p => p.id === product.id);

    if (isPizza) {
        secondFlavorContainer.style.display = 'block';
        secondFlavorSelect.innerHTML = '<option value="">Não, quero inteira</option>';

        // Populate with other pizzas
        menuData.products.pizzas.forEach(p => {
            if (p.id !== product.id) { // Don't allow same flavor (redundant)
                const option = document.createElement('option');
                option.value = p.id;
                option.dataset.price = p.price;
                option.dataset.name = p.name;
                option.textContent = p.name;
                secondFlavorSelect.appendChild(option);
            }
        });
    } else {
        secondFlavorContainer.style.display = 'none';
        secondFlavorSelect.innerHTML = '<option value="">Não, quero inteira</option>';
    }

    productModal.classList.add('open');
    secondFlavorSelect.onchange = updateModalPrice;
}

function closeModal() {
    productModal.classList.remove('open');
    currentProduct = null;
}

function adjustModalQty(delta) {
    if (currentModalQty + delta >= 1) {
        currentModalQty += delta;
        updateModalPrice();
    }
}

function updateModalPrice() {
    if (currentProduct) {
        modalQty.innerText = currentModalQty;

        // Check 2nd flavor price
        const secondFlavorSelect = document.getElementById('second-flavor-select');
        let finalPrice = currentProduct.price;

        if (secondFlavorSelect && secondFlavorSelect.value) {
            const selectedOption = secondFlavorSelect.options[secondFlavorSelect.selectedIndex];
            const p2Price = parseFloat(selectedOption.dataset.price);
            // Rule: Higher Price
            if (p2Price > finalPrice) {
                finalPrice = p2Price;
            }
        }

        const total = finalPrice * currentModalQty;
        modalPrice.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Store temp price for add to cart
        currentProduct._tempPrice = finalPrice;
    }
}

function addToCartFromModal() {
    if (!currentProduct) return;

    const existingItem = cart.find(item => item.id === currentProduct.id && item.obs === modalObs.value);

    if (existingItem) {
        existingItem.qty += currentModalQty;
    } else {
        cart.push({
            ...currentProduct,
            price: currentProduct._tempPrice || currentProduct.price, // Use calculated price
            qty: currentModalQty,
            obs: modalObs.value,
            secondFlavorName: document.getElementById('second-flavor-select').value ?
                document.getElementById('second-flavor-select').options[document.getElementById('second-flavor-select').selectedIndex].dataset.name : null
        });
    }

    updateCartUI();
    closeModal();
    // Optional: Auto switch to cart? No, user might want to buy more.
    alert('Produto adicionado ao carrinho!');
}

// --- Cart Logic ---
const floatingCartBar = document.getElementById('floating-cart-bar');
const floatingCount = document.getElementById('floating-count');
const floatingTotal = document.getElementById('floating-total');

function updateCartUI() {
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Update Badge
    if (totalQty > 0) {
        cartBadge.style.display = 'inline-block';
        cartBadge.innerText = totalQty;
    } else {
        cartBadge.style.display = 'none';
    }

    // Update Floating Bar
    if (floatingCartBar) {
        if (totalQty > 0) {
            floatingCount.innerText = totalQty;
            floatingTotal.innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
            floatingCartBar.classList.add('visible');
            // Adjust body padding to avoid overlap if needed, but styling handles it usually
        } else {
            floatingCartBar.classList.remove('visible');
        }
    }
}

function renderCart() {
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <h3>Seu carrinho está vazio</h3>
                <p>Adicione produtos ao carrinho e faça o pedido</p>
                <button class="btn-primary" onclick="showView('home')">Ver cardápio</button>
            </div>
        `;
        return;
    }

    let total = 0;
    let html = '<div class="cart-items">';

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        html += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div style="font-size:12px; color:#666;">${item.obs ? 'Obs: ' + item.obs : ''}</div>
                    <p>R$ ${itemTotal.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="cart-controls">
                    <button class="qty-btn" onclick="updateCartItem(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateCartItem(${index}, 1)">+</button>
                </div>
            </div>
        `;
    });

    html += '</div>';

    html += `
        <div style="background:white; padding:15px; border-radius:8px; margin-top:20px;">
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:18px; margin-bottom:15px;">
                <span>Total</span>
                <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
            </div>
            <button class="btn-primary" onclick="checkout()">Fazer Pedido</button>
        </div>
    `;

    cartContainer.innerHTML = html;
}

function updateCartItem(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
    renderCart();
}

// --- Checkout Logic ---
const checkoutModal = document.getElementById('checkout-modal');
const paymentMethodSelect = document.getElementById('payment-method');
const changeContainer = document.getElementById('change-container');

paymentMethodSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Dinheiro') {
        changeContainer.style.display = 'block';
    } else {
        changeContainer.style.display = 'none';
    }
});

function updateCheckoutTotal() {
    const feeDisplay = document.getElementById('delivery-fee-display');
    const select = document.getElementById('client-neighborhood');
    if (!select || !feeDisplay) return;

    const fee = parseFloat(select.options[select.selectedIndex].dataset.fee || 0);

    // Calculate Cart Total
    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const total = cartTotal + fee;

    if (fee > 0) {
        feeDisplay.innerHTML = `Taxa: R$ ${fee.toFixed(2).replace('.', ',')} | <b>Total: R$ ${total.toFixed(2).replace('.', ',')}</b>`;
    } else {
        feeDisplay.innerHTML = `Selecione um bairro para ver a taxa.`;
    }
}

function checkOpeningHours() {
    if (!menuData.openingHours) return { isOpen: true }; // Default open if not set

    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const config = menuData.openingHours[day];

    if (!config || !config.active) {
        return { isOpen: false, msg: 'Estamos fechados hoje! 😴' };
    }

    if (currentTime < config.open || currentTime > config.close) {
        return { isOpen: false, msg: `Estamos fechados! 🕒\nNosso horário hoje é das ${config.open} às ${config.close}.` };
    }

    return { isOpen: true };
}

function checkout() {
    // Validate Hours
    const status = checkOpeningHours();
    if (!status.isOpen) {
        alert(status.msg);
        return;
    }

    if (cart.length === 0) return;
    checkoutModal.classList.add('open');
    updateCheckoutTotal();
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('open');
}

async function finalizeCheckout() {
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;

    // Address Fields
    const street = document.getElementById('client-street').value;
    const number = document.getElementById('client-number').value;
    const complement = document.getElementById('client-complement').value;
    const neighborhoodSelect = document.getElementById('client-neighborhood');

    // Validate neighborhood
    if (!neighborhoodSelect.value) {
        alert('Por favor, selecione o Bairro.');
        return;
    }

    const neighborhood = neighborhoodSelect.options[neighborhoodSelect.selectedIndex].text;
    const fee = parseFloat(neighborhoodSelect.options[neighborhoodSelect.selectedIndex].dataset.fee || 0);
    const payment = document.getElementById('payment-method').value;
    const change = document.getElementById('client-change').value;

    if (!name || !street || !number || !phone) {
        alert('Por favor, preencha Nome, Telefone, Rua e Número.');
        return;
    }

    // Prepare Payload
    let subtotal = 0;
    const cartItems = cart.map(item => {
        subtotal += item.price * item.qty;
        return {
            name: item.name,
            qty: item.qty,
            flavor2: item.secondFlavorName || null,
            obs: item.obs || ''
        };
    });

    const total = subtotal + fee;

    const payload = {
        clientInfo: {
            name: name,
            phone: phone,
            address: `${street}, ${number} ${complement ? '- ' + complement : ''}`,
            district: neighborhood,
            deliveryFee: `R$ ${fee.toFixed(2).replace('.', ',')}`,
            subtotal: `R$ ${subtotal.toFixed(2).replace('.', ',')}`
        },
        cart: cartItems,
        total: `R$ ${total.toFixed(2).replace('.', ',')}`,
        paymentMethod: payment + (change ? ` (Troco para R$ ${change})` : '')
    };

    // UI Feedback
    const btn = document.querySelector('.add-to-cart-btn'); // The button inside checkout modal (make sure class matches)
    const originalText = btn ? btn.innerText : 'Enviar';
    if (btn) {
        btn.innerText = '⏳ Enviando Pedido...';
        btn.disabled = true;
    }

    try {
        const apiUrl = (window.AppConfig && window.AppConfig.apiBaseUrl) ? window.AppConfig.apiBaseUrl : 'http://localhost:3001';

        const response = await fetch(`${apiUrl}/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Pedido Enviado com Sucesso!\n\nVerifique seu WhatsApp, o Robô já mandou a confirmação e o pagamento.');
            cart = [];
            updateCartUI();
            closeCheckoutModal();
        } else {
            alert('❌ Erro ao enviar: ' + (data.error || 'Erro desconhecido.'));
        }
    } catch (error) {
        console.error('Erro de Pedido:', error);
        alert('⚠️ Erro de Conexão!\n\nO Robô parece estar offline ou bloqueado. Tente novamente ou chame no WhatsApp.');
    } finally {
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

// --- API SYNC ---
async function fetchMenuData() {
    try {
        const apiHost = (window.AppConfig && window.AppConfig.apiBaseUrl) ? window.AppConfig.apiBaseUrl : 'http://localhost:3001';
        const response = await fetch(`${apiHost}/api/menu`);
        if (response.ok) {
            const newData = await response.json();
            if (newData && typeof menuData !== 'undefined') {
                Object.assign(menuData, newData); // Update global object
                console.log('Menu Data synced from API');
            }
        }
    } catch (e) {
        console.warn('Using static menu data (API unreachable)');
    }
}

// Start
window.onload = async function () {
    // 1. Load Config
    if (window.AppConfig) {
        // Set Page Title
        if (window.AppConfig.storeName) {
            document.title = `${window.AppConfig.storeName} - Pedidos Online`;

            // Set Header Name
            const headerName = document.querySelector('.shop-name');
            if (headerName) headerName.innerText = window.AppConfig.storeName;
        }
    }

    // 2. Sync Data
    await fetchMenuData();

    // Initialize UI
    if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
    if (typeof renderPopular === 'function') renderPopular();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof renderNeighborhoods === 'function') renderNeighborhoods();
};

function renderNeighborhoods() {
    const select = document.getElementById('client-neighborhood');
    if (!select) return;

    // Clear existing (keep first option)
    select.innerHTML = '<option value="">Selecione seu bairro...</option>';

    if (menuData.neighborhoods && Array.isArray(menuData.neighborhoods)) {
        menuData.neighborhoods.forEach(nb => {
            const option = document.createElement('option');
            option.value = nb.name; // ID or Name
            option.textContent = `${nb.name} (+ R$ ${nb.fee.toFixed(2).replace('.', ',')})`;
            option.dataset.fee = nb.fee;
            select.appendChild(option);
        });

        // Add Listener
        select.onchange = updateCheckoutTotal;
    }
}
