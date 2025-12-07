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
    if (!select) return;

    // Sort alphabetically
    const sorted = menuData.neighborhoods.sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(n => {
        const option = document.createElement('option');
        option.value = n.name;
        option.dataset.fee = n.fee;
        option.textContent = `${n.name} (+ R$ ${n.fee.toFixed(2).replace('.', ',')})`;
        select.appendChild(option);
    });

    // Update total on change
    select.addEventListener('change', updateCheckoutTotal);
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
                    <div class="product-name">${p.name}</div>
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
function updateCartUI() {
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    if (totalQty > 0) {
        cartBadge.style.display = 'inline-block';
        cartBadge.innerText = totalQty;
    } else {
        cartBadge.style.display = 'none';
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

function checkout() {
    if (cart.length === 0) return;
    checkoutModal.classList.add('open');
    updateCheckoutTotal();
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('open');
}

function finalizeCheckout() {
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
    // Extract name only from option text (remove fee) if needed, but the text is fine "Centro (+ R$ 5,00)"

    const fee = parseFloat(neighborhoodSelect.options[neighborhoodSelect.selectedIndex].dataset.fee || 0);
    const payment = document.getElementById('payment-method').value;
    const change = document.getElementById('client-change').value;

    if (!name || !street || !number) {
        alert('Por favor, preencha Nome, Rua e Número.');
        return;
    }

    let message = "*NOVO PEDIDO - TOP PIZZA* 🍕\n\n";
    message += `👤 *Cliente:* ${name}\n`;
    message += `📞 *Telefone:* ${phone}\n`;
    message += `📍 *Endereço:* ${street}, ${number} - ${neighborhood}\n`;
    if (complement) message += `   Ref: ${complement}\n`;
    message += `\n`;

    message += "*🛒 ITENS DO PEDIDO:*\n";
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        if (item.secondFlavorName) {
            message += `• ${item.qty}x Pizza Meio a Meio: ${item.name} / ${item.secondFlavorName}`;
        } else {
            message += `• ${item.qty}x ${item.name}`;
        }

        if (item.obs) message += `\n  _Ops: ${item.obs}_`;
        message += `\n`;
    });

    const total = subtotal + fee;

    message += `\n🧾 *Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    message += `🛵 *Taxa de Entrega:* R$ ${fee.toFixed(2).replace('.', ',')}\n`;
    message += `💰 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;

    message += `💳 *Pagamento:* ${payment}\n`;
    if (payment === 'Dinheiro' && change) {
        message += `💵 *Troco para:* R$ ${parseFloat(change).toFixed(2).replace('.', ',')}\n`;
    }

    message += `\n------------------------------\n`;
    message += `Aguardo a confirmação!`;

    const encoded = encodeURIComponent(message);
    const botNumber = '558894391768';

    // Open chat directly with the bot (using api.whatsapp.com is more robust for desktop)
    window.location.href = `https://api.whatsapp.com/send?phone=${botNumber}&text=${encoded}`;
}

// Start
window.onload = init;
