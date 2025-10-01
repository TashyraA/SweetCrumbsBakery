/*********************
 * Mobile nav toggle *
 *********************/
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('nav ul');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
    menuToggle.textContent = menuToggle.classList.contains('active') ? '✖' : '☰';
  });
}

/********************************************
 * Animate menu cards on scroll into view   *
 ********************************************/
const menuItems = document.querySelectorAll('.menu-item');
function showOnScroll() {
  const triggerBottom = window.innerHeight * 0.85;
  menuItems.forEach(item => {
    const top = item.getBoundingClientRect().top;
    if (top < triggerBottom) item.classList.add('show');
  });
}
window.addEventListener('scroll', showOnScroll);
showOnScroll();

/********************************************
 * Category filtering controls (if present) *
 ********************************************/
const categoryButtons = document.querySelectorAll('.category-btn');

/**************************************
 * Drawer Cart (Shopify-like)         *
 **************************************/
const drawer = document.getElementById('cartDrawer');
const backdrop = document.getElementById('cartBackdrop');
const closeDrawerBtn = document.getElementById('closeDrawer');
const cartList = document.getElementById('cartList');
const subtotalAmount = document.getElementById('subtotalAmount');
const headerCartCount = document.getElementById('cartCount');
const checkoutDrawerBtn = document.getElementById('drawerCheckout');

/** cart = [{id,name,price,image,qty}] */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Helpers
const money = n =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const totalQty = () => cart.reduce((sum, l) => sum + l.qty, 0);
const subtotal = () => cart.reduce((sum, l) => sum + l.qty * l.price, 0);

// Save cart to localStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Open/close drawer
function openDrawer() {
  if (!drawer || !backdrop) return;
  drawer.classList.add('open');
  backdrop.classList.add('show');
  drawer.setAttribute('aria-hidden', 'false');
}
function closeDrawer() {
  if (!drawer || !backdrop) return;
  drawer.classList.remove('open');
  backdrop.classList.remove('show');
  drawer.setAttribute('aria-hidden', 'true');
}
if (backdrop) backdrop.addEventListener('click', closeDrawer);
if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);

// Render cart UI
function renderCart() {
  if (!cartList) return;
  cartList.innerHTML = '';

  cart.forEach((line) => {
    const li = document.createElement('li');
    li.className = 'cart-line';
    li.dataset.id = line.id;

    li.innerHTML = `
      <img class="cart-thumb" src="${line.image}" alt="${line.name}">
      <div class="cart-info">
        <span class="cart-title">${line.name}</span>
        <span class="cart-meta">${money(line.price)} each</span>
        <div class="qty-box" role="group" aria-label="Quantity selector">
          <button class="qty-btn dec" aria-label="Decrease">–</button>
          <span class="qty" aria-live="polite">${line.qty}</span>
          <button class="qty-btn inc" aria-label="Increase">+</button>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:.25rem;">
        <span class="line-total">${money(line.qty * line.price)}</span>
        <button class="remove-line" aria-label="Remove">🗑</button>
      </div>
    `;

    cartList.appendChild(li);
  });

  if (subtotalAmount) subtotalAmount.textContent = money(subtotal());
  if (headerCartCount) headerCartCount.textContent = String(totalQty());

  saveCart(); // Ensure always saved after render
}

// Add item (merge by id, qty limited to 3)
function addToCart(item) {
  const found = cart.find(l => l.id === item.id);
  if (found) {
    found.qty = Math.min(3, found.qty + item.qty);
  } else {
    cart.push({ ...item, qty: Math.min(3, item.qty) });
  }
  renderCart();
}

// Menu card events
document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const card = target.closest('.menu-item');
  if (!card) return;

  if (target.closest('.dec')) {
    const qtySpan = card.querySelector('.qty');
    const current = parseInt(qtySpan?.textContent || '1', 10);
    qtySpan.textContent = String(Math.max(1, current - 1));
    return;
  }

  if (target.closest('.inc')) {
    const qtySpan = card.querySelector('.qty');
    const current = parseInt(qtySpan?.textContent || '1', 10);
    qtySpan.textContent = String(Math.min(3, current + 1));
    return;
  }

  if (target.closest('.add-btn')) {
    const qtySpan = card.querySelector('.qty');
    const qty = parseInt(qtySpan?.textContent || '1', 10);

    const item = {
      id: card.dataset.id,
      name: card.dataset.name,
      price: Number(card.dataset.price || 0),
      image: card.querySelector('img')?.src || 'images/default.jpg',
      qty: Math.min(3, Math.max(1, qty))
    };

    if (item.id && item.name) {
      addToCart(item);
      openDrawer();
    }
  }
});

// Drawer events (qty +/- and remove)
if (cartList) {
  cartList.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const li = target.closest('.cart-line');
    if (!li) return;

    const id = li.dataset.id;
    const line = cart.find(l => l.id === id);
    if (!line) return;

    if (target.classList.contains('inc')) {
      line.qty = Math.min(3, line.qty + 1);
      renderCart();
    } else if (target.classList.contains('dec')) {
      line.qty = Math.max(1, line.qty - 1);
      renderCart();
    } else if (target.classList.contains('remove-line')) {
      cart = cart.filter(l => l.id !== id);
      renderCart();
      if (cart.length === 0) closeDrawer();
    }
  });
}

// Checkout button
if (checkoutDrawerBtn) {
  checkoutDrawerBtn.addEventListener('click', () => {
    sessionStorage.setItem('orderCart', JSON.stringify(cart));
    window.location.href = 'order.html';
  });
}

/****************************************************
 * Category filtering
 ****************************************************/
if (categoryButtons && categoryButtons.length) {
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const category = button.getAttribute('data-category');
      menuItems.forEach(item => {
        const match = category === 'all' || item.getAttribute('data-category') === category;
        item.style.display = match ? 'block' : 'none';
      });
      showOnScroll();
    });
  });
}

/*********************************************
 * Order page display (order.html)
 *********************************************/
const orderCartList = document.getElementById('orderCartItems');
if (orderCartList) {
  const headerCount = document.getElementById('cartCount');
  let orderCart = JSON.parse(localStorage.getItem('cart') || '[]'); // Always pull latest from localStorage

  function renderOrderCart() {
    orderCartList.innerHTML = '';
    if (!orderCart.length) {
      orderCartList.innerHTML = '<li>Your cart is empty.</li>';
    } else {
      orderCart.forEach(line => {
        const li = document.createElement('li');
        li.textContent = `${line.name} × ${line.qty} — ${money(line.price * line.qty)}`;
        orderCartList.appendChild(li);
      });
    }

    if (headerCount) {
      const count = orderCart.reduce((s, l) => s + l.qty, 0);
      headerCount.textContent = String(count);
    }
  }

  renderOrderCart();

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you for your order!');
      orderCart = [];
      sessionStorage.setItem('orderCart', JSON.stringify(orderCart));
      localStorage.removeItem('cart'); // Clear main cart after order
      renderOrderCart();
      checkoutForm.reset();
    });
  }
}

// Initial render
renderCart();
