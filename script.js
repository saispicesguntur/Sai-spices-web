/* =========================
   Sai Spices Shop (Simple)
   ========================= */

const ORDER_ENDPOINT = "https://script.google.com/macros/s/AKfycbzjCjfHAvncaUBKhnn97Mww34dKCdQc1Gqx6dyxklMhwfYrWROhlM_St3u5uHlQoXv20A/exec"; 
// Example format:
// https://script.google.com/macros/s/XXXXX/exec

const PRODUCTS = [
  {
    id: "chilli",
    tag: "Best seller",
    name: "Red Chilli Powder",
    desc: "Freshly ground chilli powder.",
    variants: [
      { label: "100g", price: 65 },
      { label: "200g", price: 119 },
      { label: "500g", price: 189 },
      { label: "1kg",  price: 289 },
    ],
  },
  {
    id: "turmeric",
    tag: "Daily use",
    name: "Turmeric Powder",
    desc: "Pure turmeric, bright colour.",
    variants: [
      { label: "50g",  price: 29 },
      { label: "100g", price: 59 },
    ],
  },
  {
    id: "jeera",
    tag: "Homemade",
    name: "Jeera Powder",
    desc: "Home made jeera powder.",
    variants: [
      { label: "50g",  price: 25 },
      { label: "100g", price: 49 },
      { label: "250g", price: 79 },
    ],
  },
  {
    id: "garam",
    tag: "Homemade",
    name: "Garam Masala",
    desc: "Home made garam masala blend.",
    variants: [
      { label: "50g",  price: 29 },
      { label: "100g", price: 59 },
      { label: "150g", price: 89 },
    ],
  },
];

// cart item shape: { productId, name, variantLabel, unitPrice, qty }
let cart = [];

/* ---------- Helpers ---------- */
const ₹ = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function findProduct(productId) {
  return PRODUCTS.find(p => p.id === productId);
}

function cartKey(productId, variantLabel) {
  return `${productId}__${variantLabel}`;
}

function getSubtotal() {
  return cart.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
}

/* ---------- Render Products ---------- */
function renderProducts() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  PRODUCTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "productCard";

    card.innerHTML = `
      <div class="tag">${p.tag}</div>
      <div class="productTitle">${p.name}</div>
      <p class="productDesc">${p.desc}</p>

      <div class="selectRow">
        <label class="small muted">Select size</label>
        <select data-product="${p.id}" class="variantSelect">
          ${p.variants.map(v => `<option value="${v.label}" data-price="${v.price}">${v.label} — ${₹(v.price)}</option>`).join("")}
        </select>
      </div>

      <div class="priceRow">
        <div class="price" id="price_${p.id}">${₹(p.variants[0].price)}</div>
        <div class="qtyCtrl">
          <button class="qbtn" type="button" data-action="dec" data-product="${p.id}">−</button>
          <div class="qval" id="qty_${p.id}">1</div>
          <button class="qbtn" type="button" data-action="inc" data-product="${p.id}">+</button>
        </div>
      </div>

      <button class="btn btn--primary btn--full" type="button" data-action="add" data-product="${p.id}">
        Add to cart
      </button>
    `;

    grid.appendChild(card);
  });

  // Update price when variant changes
  document.querySelectorAll(".variantSelect").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const productId = e.target.getAttribute("data-product");
      const opt = e.target.selectedOptions[0];
      const price = opt.getAttribute("data-price");
      document.getElementById(`price_${productId}`).textContent = ₹(price);
    });
  });

  // Qty controls + Add
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const productId = btn.getAttribute("data-product");
    const qtyEl = document.getElementById(`qty_${productId}`);
    let qty = Number(qtyEl.textContent || 1);

    if (action === "inc") qtyEl.textContent = String(qty + 1);
    if (action === "dec") qtyEl.textContent = String(Math.max(1, qty - 1));

    if (action === "add") {
      const select = document.querySelector(`select[data-product="${productId}"]`);
      const opt = select.selectedOptions[0];
      const variantLabel = opt.value;
      const unitPrice = Number(opt.getAttribute("data-price"));
      const finalQty = Number(qtyEl.textContent || 1);

      addToCart(productId, variantLabel, unitPrice, finalQty);
      qtyEl.textContent = "1";
      openCart();
    }
  });
}

/* ---------- Cart Operations ---------- */
function addToCart(productId, variantLabel, unitPrice, qty) {
  const product = findProduct(productId);
  if (!product) return;

  const key = cartKey(productId, variantLabel);
  const existing = cart.find(it => it.key === key);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      key,
      productId,
      name: product.name,
      variantLabel,
      unitPrice,
      qty
    });
  }
  updateCartUI();
}

function removeFromCart(key) {
  cart = cart.filter(it => it.key !== key);
  updateCartUI();
}

function changeQty(key, delta) {
  const item = cart.find(it => it.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  updateCartUI();
}

/* ---------- Render Cart ---------- */
function renderCart() {
  const wrap = document.getElementById("cartItems");

  if (cart.length === 0) {
    wrap.innerHTML = `
      <div class="cartItem">
        <div class="muted">Your cart is empty. Add products from the shop.</div>
      </div>
    `;
  } else {
    wrap.innerHTML = cart.map(it => `
      <div class="cartItem">
        <div class="cartItemTop">
          <div>
            <div class="cartItemName">${it.name}</div>
            <div class="cartItemMeta">${it.variantLabel} • ${₹(it.unitPrice)} each</div>
          </div>
          <button class="iconBtn" type="button" data-remove="${it.key}" title="Remove">🗑</button>
        </div>

        <div class="cartItemBottom">
          <div class="qtyCtrl">
            <button class="qbtn" type="button" data-qty="${it.key}" data-delta="-1">−</button>
            <div class="qval">${it.qty}</div>
            <button class="qbtn" type="button" data-qty="${it.key}" data-delta="1">+</button>
          </div>

          <strong>${₹(it.unitPrice * it.qty)}</strong>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("cartSubtotal").textContent = ₹(getSubtotal());
}

function updateCartUI() {
  document.getElementById("cartCount").textContent = String(
    cart.reduce((sum, it) => sum + it.qty, 0)
  );
  renderCart();
}

/* ---------- Drawer Open/Close ---------- */
const cartDrawer = document.getElementById("cartDrawer");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartOverlay = document.getElementById("cartOverlay");
const heroOpenCart = document.getElementById("heroOpenCart");

function openCart() {
  cartDrawer.classList.add("isOpen");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("isOpen");
  cartDrawer.setAttribute("aria-hidden", "true");
}

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
heroOpenCart.addEventListener("click", openCart);

// cart item events (remove / qty)
document.getElementById("cartItems").addEventListener("click", (e) => {
  const removeBtn = e.target.closest("[data-remove]");
  if (removeBtn) {
    removeFromCart(removeBtn.getAttribute("data-remove"));
    return;
  }

  const qtyBtn = e.target.closest("[data-qty]");
  if (qtyBtn) {
    const key = qtyBtn.getAttribute("data-qty");
    const delta = Number(qtyBtn.getAttribute("data-delta"));
    changeQty(key, delta);
  }
});

/* ---------- Checkout Submit ---------- */
const checkoutForm = document.getElementById("checkoutForm");
const successMsg = document.getElementById("successMsg");
const errorMsg = document.getElementById("errorMsg");
const placeOrderBtn = document.getElementById("placeOrderBtn");

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  successMsg.style.display = "none";
  errorMsg.style.display = "none";

  if (cart.length === 0) {
    alert("Your cart is empty. Please add products first.");
    return;
  }

  if (!ORDER_ENDPOINT || ORDER_ENDPOINT.includes("PASTE_YOUR")) {
    alert("ORDER_ENDPOINT is not set. Please paste your Google Apps Script URL in script.js");
    return;
  }

  const formData = new FormData(checkoutForm);
  const payload = {
    timestamp: new Date().toISOString(),
    deliveryRegion: "AP & TG only",
    customer: {
      name: formData.get("name")?.trim(),
      phone: formData.get("phone")?.trim(),
      email: formData.get("email")?.trim() || "",
      address: formData.get("address")?.trim(),
      city: formData.get("city")?.trim(),
      pincode: formData.get("pincode")?.trim(),
      notes: formData.get("notes")?.trim() || ""
    },
    items: cart.map(it => ({
      product: it.name,
      size: it.variantLabel,
      unitPrice: it.unitPrice,
      qty: it.qty,
      lineTotal: it.unitPrice * it.qty
    })),
    subtotal: getSubtotal()
  };

  // basic phone check
  if (!/^\d{10}$/.test(payload.customer.phone || "")) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Sending…";

  try {
    // Try JSON POST
    const res = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "no-cors" // Apps Script often needs this on GitHub Pages
    });

    // With no-cors, we can’t read response reliably. Assume success if no error thrown.
    successMsg.style.display = "block";
    errorMsg.style.display = "none";

    // reset
    cart = [];
    updateCartUI();
    checkoutForm.reset();

  } catch (err) {
    console.error(err);
    errorMsg.style.display = "block";
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place order";
  }
});

/* ---------- Init ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
renderProducts();
updateCartUI();
