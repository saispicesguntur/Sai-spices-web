/**
 * 1) Deploy Google Apps Script as Web App
 * 2) Paste Web App URL here
 */
const WEB_APP_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

// You will update later
const UPI_ID = "UPI_ID_TO_ADD_LATER";

const PRODUCTS = [
  {
    id: "chilli",
    name: "Red Chilli Powder",
    desc: "Bright colour • strong flavour",
    variants: [
      { label: "100 g", price: 65 },
      { label: "200 g", price: 119 },
      { label: "500 g", price: 189 },
      { label: "1 kg", price: 289 },
    ],
  },
  {
    id: "turmeric",
    name: "Turmeric Powder",
    desc: "Pure & aromatic",
    variants: [
      { label: "50 g", price: 29 },
      { label: "100 g", price: 59 },
    ],
  },
  {
    id: "jeera",
    name: "Homemade Jeera Powder",
    desc: "Fresh roasted • homemade",
    variants: [
      { label: "50 g", price: 25 },
      { label: "100 g", price: 49 },
      { label: "250 g", price: 79 },
    ],
  },
  {
    id: "garam",
    name: "Homemade Garam Masala",
    desc: "Balanced blend • homemade",
    variants: [
      { label: "50 g", price: 29 },
      { label: "100 g", price: 59 },
      { label: "150 g", price: 89 },
    ],
  },
];

// Cart item format: {productId, name, variantLabel, price, qty}
const cart = [];

const $ = (id) => document.getElementById(id);

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function cartTotals() {
  const items = cart.reduce((a, c) => a + c.qty, 0);
  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
  return { items, total };
}

/* ---------------------------
   UI: Products
---------------------------- */
function renderProducts() {
  const grid = $("productsGrid");
  grid.innerHTML = "";

  PRODUCTS.forEach((p) => {
    const el = document.createElement("div");
    el.className = "product";

    const variantOptions = p.variants
      .map(
        (v, i) =>
          `<option value="${i}">${v.label} — ${formatINR(v.price)}</option>`
      )
      .join("");

    el.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="row">
        <select class="variantSel" aria-label="Select size">
          ${variantOptions}
        </select>
        <input class="qty" type="number" min="1" value="1" aria-label="Quantity" />
        <button class="btn btn--primary addBtn" type="button">Add to cart</button>
      </div>
      <div class="muted small" style="margin-top:10px">
        Delivery: AP & Telangana only • COD not available
      </div>
    `;

    const sel = el.querySelector(".variantSel");
    const qty = el.querySelector(".qty");
    const btn = el.querySelector(".addBtn");

    btn.addEventListener("click", () => {
      const idx = Number(sel.value);
      const q = Math.max(1, Number(qty.value || 1));
      const v = p.variants[idx];
      addToCart(p, v, q);

      // ✅ IMPORTANT CHANGE:
      // Do NOT open cart automatically.
      // Only update cart count.
      btn.textContent = "Added ✓";
      setTimeout(() => (btn.textContent = "Add to cart"), 800);
    });

    grid.appendChild(el);
  });
}

function addToCart(product, variant, qty) {
  const key = `${product.id}__${variant.label}`;
  const existing = cart.find(
    (x) => `${x.productId}__${x.variantLabel}` === key
  );

  if (existing) existing.qty += qty;
  else {
    cart.push({
      productId: product.id,
      name: product.name,
      variantLabel: variant.label,
      price: variant.price,
      qty,
    });
  }

  updateCartUI();
}

/* ---------------------------
   UI: Cart drawer
---------------------------- */
function removeItem(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function clearCart() {
  cart.length = 0;
  updateCartUI();
}

function updateCartUI() {
  const { items, total } = cartTotals();

  $("cartCount").textContent = items;
  $("cartSub").textContent = `${items} item${items === 1 ? "" : "s"}`;
  $("cartTotal").textContent = formatINR(total);

  $("summaryItems").textContent = items;
  $("summaryTotal").textContent = formatINR(total);

  $("checkoutBtn").disabled = items === 0;
  $("clearCartBtn").disabled = items === 0;

  const list = $("cartItems");
  list.innerHTML = "";

  if (items === 0) {
    list.innerHTML = `<div class="muted">Your cart is empty.</div>`;
    return;
  }

  cart.forEach((c, idx) => {
    const item = document.createElement("div");
    item.className = "cartItem";
    item.innerHTML = `
      <div class="cartItemTop">
        <div>
          <div class="cartItemName">${c.name}</div>
          <div class="cartItemMeta">${c.variantLabel} • ${formatINR(
      c.price
    )} each</div>
        </div>
        <div class="cartItemName">${formatINR(c.price * c.qty)}</div>
      </div>

      <div class="cartItemActions">
        <div class="muted small">Qty: ${c.qty}</div>
        <button class="linkBtn" type="button">Remove</button>
      </div>
    `;
    item
      .querySelector(".linkBtn")
      .addEventListener("click", () => removeItem(idx));
    list.appendChild(item);
  });
}

function openCart() {
  $("cartDrawer").classList.add("show");
  $("cartDrawer").setAttribute("aria-hidden", "false");
}

function closeCart() {
  $("cartDrawer").classList.remove("show");
  $("cartDrawer").setAttribute("aria-hidden", "true");
}

/* ---------------------------
   UI: Checkout (2-step)
   Step 1: Details
   Step 2: Payment + Upload
---------------------------- */
function showPaymentStep(show) {
  // payment column is the SECOND ".checkoutCard"
  const cards = document.querySelectorAll(".checkoutCard");
  const paymentCard = cards[1];
  const detailsBtn = $("toPaymentBtn");
  const placeBtn = $("placeOrderBtn");

  if (!paymentCard) return;

  paymentCard.style.display = show ? "block" : "none";
  detailsBtn.style.display = show ? "none" : "block";
  placeBtn.style.display = show ? "block" : "none";

  $("placeOrderMsg").textContent = "";
  if ($("detailsMsg")) $("detailsMsg").textContent = "";
}

function openCheckout() {
  $("checkoutModal").classList.add("show");
  $("checkoutModal").setAttribute("aria-hidden", "false");

  // Start at details step
  showPaymentStep(false);
}

function closeCheckout() {
  $("checkoutModal").classList.remove("show");
  $("checkoutModal").setAttribute("aria-hidden", "true");
}

function openSuccess(orderId) {
  $("orderIdText").textContent = orderId;
  $("successModal").classList.add("show");
  $("successModal").setAttribute("aria-hidden", "false");
}

function closeSuccess() {
  $("successModal").classList.remove("show");
  $("successModal").setAttribute("aria-hidden", "true");
}

function makeOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `SS-${n}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getDeliveryDetails() {
  const form = $("checkoutForm");
  const fd = new FormData(form);

  const name = (fd.get("name") || "").toString().trim();
  const phone = (fd.get("phone") || "").toString().trim();
  const address = (fd.get("address") || "").toString().trim();
  const city = (fd.get("city") || "").toString().trim();
  const state = (fd.get("state") || "").toString().trim();
  const pincode = (fd.get("pincode") || "").toString().trim();

  return { name, phone, address, city, state, pincode };
}

function validateDetails(d) {
  if (!d.name || !d.phone || !d.address || !d.city || !d.state || !d.pincode) {
    return "Please fill all delivery details.";
  }
  // basic phone check
  if (d.phone.replace(/\D/g, "").length < 10) {
    return "Please enter a valid phone number.";
  }
  // basic pincode check
  if (d.pincode.replace(/\D/g, "").length !== 6) {
    return "Please enter a valid 6-digit pincode.";
  }
  return "";
}

async function placeOrder() {
  const { items, total } = cartTotals();
  if (items === 0) return;

  const details = getDeliveryDetails();
  const err = validateDetails(details);
  if (err) {
    $("placeOrderMsg").textContent = err;
    return;
  }

  const proofFile = $("paymentProof").files?.[0];
  if (!proofFile) {
    $("placeOrderMsg").textContent =
      "Please upload your UPI payment screenshot (required).";
    return;
  }

  if (WEB_APP_URL.includes("PASTE_")) {
    $("placeOrderMsg").textContent =
      "Admin setup required: add your Google Apps Script Web App URL in script.js";
    return;
  }

  $("placeOrderBtn").disabled = true;
  $("placeOrderMsg").textContent = "Submitting order...";

  const orderId = makeOrderId();
  const proofDataUrl = await fileToDataUrl(proofFile);

  const payload = {
    orderId,
    createdAt: new Date().toISOString(),
    customer: details,
    delivery: "AP & Telangana only",
    payment: { method: "UPI (Manual)", upiId: UPI_ID },
    cart,
    total,
    screenshot: {
      filename: proofFile.name,
      mimeType: proofFile.type || "image/png",
      dataUrl: proofDataUrl,
    },
  };

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const txt = await res.text();
    if (!res.ok) throw new Error(txt || "Server error");

    // Success
    closeCheckout();
    closeCart();
    openSuccess(orderId);

    // clear
    clearCart();
    $("checkoutForm").reset();
    $("paymentProof").value = "";
    $("proofHint").textContent = "No file selected";

    // ✅ “automatic message” (real SMS/WhatsApp needs API)
    // We show a confirmation message + you can later add SMS gateway.
    alert(
      `Sai Spices: Your order is confirmed! Order ID: ${orderId}\nWe will call you soon to confirm delivery.`
    );
  } catch (e) {
    $("placeOrderMsg").textContent =
      "Failed to place order. Please try again. (" + e.message + ")";
  } finally {
    $("placeOrderBtn").disabled = false;
  }
}

function init() {
  $("year").textContent = new Date().getFullYear();
  $("upiIdText").textContent = UPI_ID;

  renderProducts();
  updateCartUI();

  // Cart open only when user clicks Cart button
  $("openCartBtn").addEventListener("click", openCart);
  $("footerCartOpen").addEventListener("click", (e) => {
    e.preventDefault();
    openCart();
  });

  $("closeCartBtn").addEventListener("click", closeCart);
  $("drawerBackdrop").addEventListener("click", closeCart);

  // Checkout opens checkout modal (details step)
  $("checkoutBtn").addEventListener("click", openCheckout);
  $("closeCheckoutBtn").addEventListener("click", closeCheckout);
  $("checkoutBackdrop").addEventListener("click", closeCheckout);

  $("clearCartBtn").addEventListener("click", clearCart);

  // Step 1 -> Step 2
  $("toPaymentBtn").addEventListener("click", () => {
    const details = getDeliveryDetails();
    const err = validateDetails(details);
    if (err) {
      if ($("detailsMsg")) $("detailsMsg").textContent = err;
      return;
    }
    // move to payment step
    showPaymentStep(true);
  });

  // Finish order
  $("placeOrderBtn").addEventListener("click", placeOrder);

  $("paymentProof").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    $("proofHint").textContent = f ? `Selected: ${f.name}` : "No file selected";
  });

  $("closeSuccessBtn").addEventListener("click", closeSuccess);
  $("successBackdrop").addEventListener("click", closeSuccess);
  $("newOrderBtn").addEventListener("click", () => {
    closeSuccess();
  });
}

document.addEventListener("DOMContentLoaded", init);
