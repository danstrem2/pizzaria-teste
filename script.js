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

// --- DEBUGGER (Hidden) ---
function logDebug(msg) {
    console.log(`[DEBUG] ${msg}`);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Iniciando script...");
    init();
});

// --- Initialization ---
function init() {
    logDebug("Função init() chamada.");
    setupNav();
    updateCartUI();
    renderNeighborhoods();
    updateStoreStatus();

    // Attempt to sync with live VPS data
    fetchDynamicMenu();

    setInterval(updateStoreStatus, 60000);
    logDebug("Init concluído. Intervalo configurado.");
}

async function fetchDynamicMenu() {
    logDebug("Tentando sincronizar com VPS...");
    try {
        // Use the VPS URL directly since we know it
        const response = await fetch('https://zap.dasilvadocumentos.com.br/api/menu');
        if (!response.ok) throw new Error('Falha na API: ' + response.status);

        const liveData = await response.json();

        if (liveData && liveData.openingHours) {
            window.menuData = liveData;
            logDebug("🔥 SUCESSO: Dados sincronizados com VPS!");
            // Re-render components that depend on data
            renderNeighborhoods();
            updateStoreStatus();
            updateStoreInfoUI(); // FORCE UI UPDATE
        } else {
            logDebug("⚠️ Aviso: API retornou dados inválidos.");
        }
    } catch (e) {
        logDebug("❌ Erro ao sincronizar (Usando dados locais): " + e.message);
    }
}

function updateStoreInfoUI() {
    if (!window.menuData || !window.menuData.storeInfo) return;

    const info = window.menuData.storeInfo;

    // Update Header/Title
    document.title = info.name || "Pizzaria";

    // Header text
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) headerTitle.innerText = info.name;

    const headerSlogan = document.querySelector('header p');
    if (headerSlogan) headerSlogan.innerText = info.slogan || "As melhores pizzas da cidade!";

    // Update Modal
    // Update Modal
    const modalTitle = document.getElementById('store-info-name');
    if (modalTitle) modalTitle.innerText = info.name;

    // Try finding modal elements by context if IDs vary
    // Try finding modal elements by context if IDs vary
    const modalSlogan = document.getElementById('store-info-slogan');
    if (modalSlogan) modalSlogan.innerText = info.slogan;

    // Phone / Address - usually found by icon proximity or specific IDs
    // Assuming standard layout from provided screenshots/context
    const phoneIcon = document.querySelector('#store-info-modal .fa-whatsapp');
    if (phoneIcon && phoneIcon.nextSibling) {
        phoneIcon.nextSibling.textContent = " " + (info.phone || "(00) 00000-0000");
    }

    const mapIcon = document.querySelector('#store-info-modal .fa-map-marker-alt');
    if (mapIcon && mapIcon.nextSibling) {
        mapIcon.nextSibling.textContent = " " + (info.address || "Endereço não informado");
    }

    const clockIcon = document.querySelector('#store-info-modal .fa-clock');
    if (clockIcon && clockIcon.nextSibling) {
        clockIcon.nextSibling.textContent = " Entrega em ~" + (info.deliveryTime || "40") + " min";
    }
}

// --- Store Status (Open/Closed) ---
function updateStoreStatus() {
    const statusDot = document.getElementById('store-status-dot');
    const statusText = document.getElementById('store-status-text');

    if (!statusDot || !statusText) {
        logDebug("Elementos de status (dot/text) não encontrados no HTML!");
        return;
    }

    logDebug("Verificando status da loja...");

    // Safety: Retry if data missing
    if (typeof menuData === 'undefined' || !menuData.openingHours) {
        logDebug("menuData INDEFINIDO. Tentando novamente em 500ms...");
        if (window.menuData) {
            logDebug("Achei window.menuData! Usando...");
            menuData = window.menuData;
        } else {
            setTimeout(updateStoreStatus, 500);
            return;
        }
    }

    try {
        const now = new Date();
        const dayIndex = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        logDebug(`Dia: ${dayIndex}, Hora (min): ${currentTime}`);

        const hours = menuData.openingHours[dayIndex];

        if (!hours || !hours.active) {
            logDebug("Loja FECHADA hoje (configuração).");
            statusDot.className = 'status-dot closed';
            statusText.innerText = 'Fechado hoje';
            statusDot.style.animation = 'none';
            return;
        }

        const [openH, openM] = hours.open.split(':').map(Number);
        const [closeH, closeM] = hours.close.split(':').map(Number);
        const openTime = openH * 60 + openM;
        const closeTime = closeH * 60 + closeM;

        logDebug(`Horário: ${hours.open} - ${hours.close} (${openTime} - ${closeTime})`);

        if (currentTime >= openTime && currentTime < closeTime) {
            logDebug("STATUS: ABERTO");
            statusDot.className = 'status-dot open';
            statusText.innerText = 'Aberto agora';
            statusDot.style.animation = 'pulse 1.5s infinite';
        } else {
            logDebug("STATUS: FECHADO");
            statusDot.className = 'status-dot closed';
            statusText.innerText = `Fechado • Abre às ${hours.open}`;
            statusDot.style.animation = 'none';
        }
    } catch (e) {
        logDebug("ERRO FATAL no updateStoreStatus: " + e.message);
        console.error("Store status error:", e);
        statusText.innerText = "Erro no Script";
    }
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

    // Update min fee display
    const minFeeEl = document.getElementById('min-delivery-fee');
    if (minFeeEl && menuData.neighborhoods.length > 0) {
        const minFee = Math.min(...menuData.neighborhoods.map(n => n.fee));
        minFeeEl.innerHTML = `🛵 Taxa de entrega a partir de <strong>R$ ${minFee.toFixed(2).replace('.', ',')}</strong>`;
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

// renderNeighborhoods is already defined above with map badge support

// --- CEP Lookup with ViaCEP API ---
async function lookupCEP() {
    const cepInput = document.getElementById('client-cep');
    const cepStatus = document.getElementById('cep-status');
    const streetInput = document.getElementById('client-street');
    const neighborhoodSelect = document.getElementById('client-neighborhood');
    const neighborhoodWarning = document.getElementById('neighborhood-warning');

    // Clean CEP (remove dash and spaces)
    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        cepStatus.innerHTML = '<span style="color:#ef4444;">❌ CEP deve ter 8 dígitos</span>';
        return;
    }

    cepStatus.innerHTML = '<span style="color:#666;">⏳ Buscando...</span>';
    neighborhoodWarning.style.display = 'none';

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            cepStatus.innerHTML = '<span style="color:#ef4444;">❌ CEP não encontrado</span>';
            return;
        }

        // Auto-fill street
        if (streetInput && data.logradouro) {
            streetInput.value = data.logradouro;
        }

        // Check if neighborhood is in our delivery area
        const viaBairro = data.bairro.toLowerCase().trim();
        let found = false;

        for (let i = 0; i < neighborhoodSelect.options.length; i++) {
            const opt = neighborhoodSelect.options[i];
            if (opt.value && opt.value.toLowerCase().trim() === viaBairro) {
                neighborhoodSelect.selectedIndex = i;
                neighborhoodSelect.dispatchEvent(new Event('change'));
                found = true;
                break;
            }
        }

        if (found) {
            cepStatus.innerHTML = `<span style="color:#22c55e;">✅ ${data.bairro}, ${data.localidade}</span>`;
            neighborhoodWarning.style.display = 'none';
        } else {
            cepStatus.innerHTML = `<span style="color:#f59e0b;">⚠️ ${data.bairro}, ${data.localidade}</span>`;
            neighborhoodWarning.innerHTML = `❌ Infelizmente não entregamos no bairro "${data.bairro}". Verifique os bairros atendidos.`;
            neighborhoodWarning.style.display = 'block';
            neighborhoodSelect.selectedIndex = 0;
        }

    } catch (error) {
        console.error('CEP Lookup Error:', error);
        cepStatus.innerHTML = '<span style="color:#ef4444;">❌ Erro na busca. Tente novamente.</span>';
    }
}

// --- SEARCH MODAL ---
function openSearchModal() {
    document.getElementById('search-modal').classList.add('open');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
    setTimeout(() => document.getElementById('search-input').focus(), 100);
}

function closeSearchModal() {
    document.getElementById('search-modal').classList.remove('open');
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');

    if (!query || query.length < 2) {
        resultsContainer.innerHTML = '<p style="color:#666; text-align:center;">Digite pelo menos 2 caracteres</p>';
        return;
    }

    // Search in all categories
    const results = [];
    menuData.categories.forEach(cat => {
        cat.products.forEach(p => {
            if (p.name.toLowerCase().includes(query) || (p.desc && p.desc.toLowerCase().includes(query))) {
                results.push({ ...p, category: cat.name });
            }
        });
    });

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="color:#666; text-align:center;">Nenhum produto encontrado</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(p => `
        <div onclick="closeSearchModal(); openProductModal('${p.name.replace(/'/g, "\\'")}', ${p.price}, '${(p.desc || '').replace(/'/g, "\\'")}', '${p.category}')" 
             style="padding:12px; border-bottom:1px solid #eee; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>${p.name}</strong>
                <div style="font-size:12px; color:#666;">${p.category}</div>
            </div>
            <span style="color:var(--primary-color); font-weight:bold;">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
        </div>
    `).join('');
}

// --- SHARE STORE ---
function shareStore() {
    const shareData = {
        title: 'Pizzaria Habibs',
        text: 'Confira as melhores pizzas da cidade! 🍕',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Link copiado para a área de transferência! 📋');
        }).catch(() => {
            prompt('Copie o link:', window.location.href);
        });
    }
}

// --- STORE INFO MODAL ---
function openStoreInfoModal() {
    // Load store info from menuData if available
    if (menuData.storeInfo) {
        const info = menuData.storeInfo;
        document.getElementById('store-info-name').textContent = info.name || 'Pizzaria Habibs';
        document.getElementById('store-info-slogan').textContent = info.slogan || 'As melhores pizzas da cidade!';
        document.getElementById('store-info-phone').textContent = info.phone || '(88) 99999-9999';
        document.getElementById('store-info-address').textContent = info.address || 'Endereço não informado';
        document.getElementById('store-info-delivery-time').textContent = info.deliveryTime || '40';
    }
    document.getElementById('store-info-modal').classList.add('open');
}

function closeStoreInfoModal() {
    document.getElementById('store-info-modal').classList.remove('open');
}
