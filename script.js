/* =========================
   CONFIG (edit these)
========================= */

// Your business UPI ID (payee). Replace this:
const PAYEE_UPI = "saipices@upi";  // <-- CHANGE THIS to real UPI ID

// Optional: Google Apps Script URL (your sheet web app)
// If you want to save orders in Google Sheet, keep it.
// If you don't want it, leave as empty string "".
const SHEETS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbzjCjfHAvncaUBKhnn97Mww34dKCdQc1Gqx6dyxklMhwfYrWROhlM_St3u5uHlQoXv20A/exec";

/* =========================
   PRODUCTS
========================= */

const PRODUCTS = [
  {
    id: "chilli",
    name: "Red Chilli Powder",
    note: "Bright colour • strong flavour",
    variants: [
      { label: "100 g", price: 65 },
      { label: "200 g", price: 119 },
      { label: "500 g", price: 189 },
      { label: "1 kg", price: 289 }
    ]
  },
  {
    id: "turmeric",
    name: "Turmeric Powder",
    note: "Pure & aromatic",
    variants: [
      { label: "50 g", price: 29 },
      { label: "100 g", price: 59 }
    ]
  },
  {
    id: "jeera",
    name: "Homemade Jeera Powder",
    note: "Fresh roasted • homemade",
    variants: [
      { label: "50 g", price: 25 },
      { label: "100 g", price: 49 },
      { label: "250 g", price: 79 }
    ]
  },
  {
    id: "garam",
    name: "Homemade Garam Masala",
    note: "Balanced blend • homemade",
    variants: [
      { label: "50 g", price: 29 },
      { label: "100 g", price: 59 },
      { label: "150 g", price: 89 }
    ]
  }
];

const formatINR = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

/* =========================
   STATE
========================= */

let cart = []; // [{key, productId, productName, variantLabel, unitPrice, qty}]
const $ = (id) => document.getElementById(id);

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {
  const grid = $("productsGrid");
  grid.innerHTML = "";

  PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    const selectId = `sel_${p.id}`;
    const qtyId = `qty_${p.id}`;

    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.note}</p>

      <div class="selectRow">
        <select id="${selectId}">
          ${p.variants
            .map(
              (v, idx) =>
                `<option value="${idx}">${v.label} — ${formatINR(v.price)}</option>`
            )
            .join("")}
        </select>

        <input id="${qtyId}" type="number" min="1" value="1" />
      </div>

      <button class="btn btn--primary btn--full" data-add="${p.id}">
        Add to cart
      </button>
    `;

    grid.appendChild(card);
  });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const productId = btn.getAttribute("data-add");
    addToCart(productId);
  });
}

/* =========================
   CART
========================= */

function addToCart(productId) {
  const product = PRODUCTS.find((x) => x.id === productId);
  if (!product) return;

  const sel = $(`sel_${productId}`);
  const qtyInput = $(`qty_${productId}`);

  const vIndex = Number(sel.value);
  const variant = product.variants[vIndex];

  const qty = Math.max(1, Number(qtyInput.value || 1));
  const key = `${productId}_${variant.label}`;

  const existing = cart.find((x) => x.key === key);
  if (existing) existing.qty += qty;
  else {
    cart.push({
      key,
      productId,
      productName: product.name,
      variantLabel: variant.label,
      unitPrice: variant.price,
      qty
    });
  }

  updateCartUI();
  openCart();
}

function changeQty(key, delta) {
  const item = cart.find((x) => x.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((x) => x.key !== key);
  updateCartUI();
}

function removeItem(key) {
  cart = cart.filter((x) => x.key !== key);
  updateCartUI();
}

function getTotals() {
  const subtotal = cart.reduce((sum, x) => sum + x.unitPrice * x.qty, 0);
  const total = subtotal; // keep simple: no delivery calc now
  const itemsCount = cart.reduce((sum, x) => sum + x.qty, 0);
  return { subtotal, total, itemsCount };
}

function updateCartUI() {
  const { subtotal, total, itemsCount } = getTotals();

  $("cartCount").textContent = String(itemsCount);
  $("cartSub").textContent = `${itemsCount} item${itemsCount === 1 ? "" : "s"}`;
  $("subtotal").textContent = formatINR(subtotal);
  $("total").textContent = formatINR(total);

  const wrap = $("cartItems");
  wrap.innerHTML = "";

  if (cart.length === 0) {
    wrap.innerHTML = `<div class="muted">Your cart is empty.</div>`;
    return;
  }

  cart.forEach((x) => {
    const div = document.createElement("div");
    div.className = "cartItem";
    div.innerHTML = `
      <div class="cartItem__top">
        <div>
          <div class="cartItem__name">${x.productName}</div>
          <div class="cartItem__meta">${x.variantLabel} • ${formatINR(x.unitPrice)} each</div>
        </div>
        <div><strong>${formatINR(x.unitPrice * x.qty)}</strong></div>
      </div>

      <div class="cartItem__actions">
        <button class="qtyBtn" data-dec="${x.key}">−</button>
        <button class="qtyBtn" data-inc="${x.key}">+</button>
        <button class="qtyBtn removeBtn" data-rm="${x.key}">Remove</button>
      </div>
    `;
    wrap.appendChild(div);
  });
}

/* =========================
   DRAWER OPEN/CLOSE
========================= */

function openCart() {
  $("drawer").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
}

function closeCart() {
  $("drawer").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
}

/* =========================
   PAYMENT UI
========================= */

function syncPaymentUI() {
  const method = $("payMethod").value;
  $("upiBox").classList.toggle("hidden", method !== "UPI");
  $("cardBox").classList.toggle("hidden", method !== "CARD");
}

/* =========================
   VALIDATION + ORDER
========================= */

function makeOrderId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SS-${y}${m}${day}-${rand}`;
}

function showError(msg) {
  $("errorBox").textContent = msg || "";
}

function getCheckoutData() {
  return {
    name: $("custName").value.trim(),
    phone: $("custPhone").value.trim(),
    state: $("custState").value,
    address: $("custAddress").value.trim(),
    payMethod: $("payMethod").value,
    payerUpi: $("payerUpi").value.trim(),
    cardName: $("cardName").value.trim(),
    cardLast4: $("cardLast4").value.trim()
  };
}

function validateCheckout() {
  if (cart.length === 0) return "Cart is empty. Add at least one product.";
  const d = getCheckoutData();

  if (!d.name) return "Please enter your full name.";
  if (!d.phone || d.phone.length < 8) return "Please enter a valid phone number.";
  if (!d.state) return "Please select delivery state (AP or TG).";
  if (!d.address || d.address.length < 10) return "Please enter your full address.";

  if (d.payMethod === "CARD") {
    if (!d.cardName) return "Enter cardholder name (demo).";
    if (!/^\d{4}$/.test(d.cardLast4)) return "Enter last 4 digits (demo).";
  }

  return "";
}

function buildUpiLink(orderId, totalAmount) {
  // UPI deep link (works best on mobile)
  const params = new URLSearchParams({
    pa: PAYEE_UPI,
    pn: "Sai Spices",
    am: totalAmount.toFixed(2),
    cu: "INR",
    tn: `Sai Spices Order ${orderId}`
  });
  return `upi://pay?${params.toString()}`;
}

async function sendToSheet(order) {
  if (!SHEETS_WEBAPP_URL) return;

  // Simple POST as JSON
  try {
    await fetch(SHEETS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
  } catch (e) {
    // Don’t block success if sheet fails
    console.warn("Sheet save failed:", e);
  }
}

function showSuccess(orderId) {
  const { total } = getTotals();
  $("orderIdText").textContent = orderId;

  const lines = cart
    .map((x) => `${x.productName} (${x.variantLabel}) x${x.qty}`)
    .join(" • ");

  $("orderSummaryText").textContent = `Total: ${formatINR(total)} • ${lines}`;

  $("successModal").classList.remove("hidden");
}

function resetAll() {
  cart = [];
  updateCartUI();
  closeCart();
  showError("");
  $("custName").value = "";
  $("custPhone").value = "";
  $("custState").value = "";
  $("custAddress").value = "";
  $("payerUpi").value = "";
  $("cardName").value = "";
  $("cardLast4").value = "";
  $("payMethod").value = "UPI";
  syncPaymentUI();
}

/* =========================
   EVENTS
========================= */

function bindEvents() {
  $("openCartBtn").addEventListener("click", openCart);
  $("closeCartBtn").addEventListener("click", closeCart);
  $("drawerBackdrop").addEventListener("click", closeCart);

  $("cartItems").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const rm = e.target.closest("[data-rm]");

    if (inc) return changeQty(inc.getAttribute("data-inc"), +1);
    if (dec) return changeQty(dec.getAttribute("data-dec"), -1);
    if (rm) return removeItem(rm.getAttribute("data-rm"));
  });

  $("payMethod").addEventListener("change", syncPaymentUI);

  $("placeOrderBtn").addEventListener("click", async () => {
    showError("");
    const err = validateCheckout();
    if (err) {
      showError(err);
      return;
    }

    const orderId = makeOrderId();
    const { subtotal, total } = getTotals();
    const d = getCheckoutData();

    const order = {
      orderId,
      createdAt: new Date().toISOString(),
      customer: {
        name: d.name,
        phone: d.phone,
        state: d.state,
        address: d.address
      },
      payment: {
        method: d.payMethod,
        payerUpi: d.payerUpi || "",
        cardDemo: d.payMethod === "CARD" ? { cardName: d.cardName, last4: d.cardLast4 } : null
      },
      items: cart.map((x) => ({
        name: x.productName,
        variant: x.variantLabel,
        unitPrice: x.unitPrice,
        qty: x.qty,
        lineTotal: x.unitPrice * x.qty
      })),
      subtotal,
      total
    };

    // If UPI selected, open UPI link (mobile best). Then still place order.
    if (d.payMethod === "UPI") {
      const link = buildUpiLink(orderId, total);
      window.open(link, "_blank");
    }

    await sendToSheet(order);
    showSuccess(orderId);
  });

  // Success modal events
  $("successBackdrop").addEventListener("click", () => {
    $("successModal").classList.add("hidden");
  });
  $("closeSuccessBtn").addEventListener("click", () => {
    $("successModal").classList.add("hidden");
  });
  $("newOrderBtn").addEventListener("click", () => {
    $("successModal").classList.add("hidden");
    resetAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* =========================
   INIT
========================= */
renderProducts();
updateCartUI();
bindEvents();
syncPaymentUI();
