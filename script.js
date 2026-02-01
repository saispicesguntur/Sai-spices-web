/**
 * Sai Spices — Simple Cart + Step Checkout (Details → Payment → Finish)
 * Replace entire script.js with this file.
 */

/** ✅ Your Google Apps Script Web App URL (you already gave it) */
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzjCjfHAvncaUBKhnn97Mww34dKCdQc1Gqx6dyxklMhwfYrWROhlM_St3u5uHlQoXv20A/exec";

/** UPI ID placeholder (you will update later) */
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

/** Cart items: { productId, name, variantLabel, price, qty } */
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

/** Small toast message */
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.style.cssText =
      "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#111827;color:#fff;padding:12px 14px;border-radius:14px;font-weight:700;z-index:99999;box-shadow:0 16px 50px rgba(0,0,0,.25);opacity:0;transition:.2s opacity,.2s transform;";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  el.style.transform = "translateX(-50%) translateY(-2px)";
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(4px)";
  }, 1200);
}

function renderProducts() {
  const grid = $("productsGrid");
  if (!grid) return;
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
      toast("Added to cart ✅");
    });

    grid.appendChild(el);
  });
}

/** ✅ IMPORTANT FIX: no openCart() here */
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

/** Cart UI */
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

  if ($("cartCount")) $("cartCount").textContent = items;
  if ($("cartSub")) $("cartSub").textContent = `${items} item${items === 1 ? "" : "s"}`;
  if ($("cartTotal")) $("cartTotal").textContent = formatINR(total);

  if ($("summaryItems")) $("summaryItems").textContent = items;
  if ($("summaryTotal")) $("summaryTotal").textContent = formatINR(total);

  if ($("checkoutBtn")) $("checkoutBtn").disabled = items === 0;
  if ($("clearCartBtn")) $("clearCartBtn").disabled = items === 0;

  const list = $("cartItems");
  if (!list) return;

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
          <div class="cartItemMeta">${c.variantLabel} • ${formatINR(c.price)} each</div>
        </div>
        <div class="cartItemName">${formatINR(c.price * c.qty)}</div>
      </div>

      <div class="cartItemActions">
        <div class="muted small">Qty: ${c.qty}</div>
        <button class="linkBtn" type="button">Remove</button>
      </div>
    `;
    item.querySelector(".linkBtn").addEventListener("click", () => removeItem(idx));
    list.appendChild(item);
  });
}

/** Drawer open/close */
function openCart() {
  $("cartDrawer")?.classList.add("show");
  $("cartDrawer")?.setAttribute("aria-hidden", "false");
}
function closeCart() {
  $("cartDrawer")?.classList.remove("show");
  $("cartDrawer")?.setAttribute("aria-hidden", "true");
}

/** ✅ Checkout steps */
let checkoutStep = 1; // 1 = details, 2 = payment

function setCheckoutStep(step) {
  checkoutStep = step;

  const upiBox = document.querySelector(".upiBox");
  const summary = document.querySelector(".summary");
  const proofWrap = document.querySelector(".upload");
  const placeBtn = $("placeOrderBtn");
  const msg = $("placeOrderMsg");

  if (msg) msg.textContent = "";

  // Step 1: hide payment parts
  if (step === 1) {
    if (upiBox) upiBox.style.display = "none";
    if (summary) summary.style.display = "none";
    if (proofWrap) proofWrap.style.display = "none";
    if (placeBtn) placeBtn.textContent = "Make payment";
  }

  // Step 2: show payment parts
  if (step === 2) {
    if (upiBox) upiBox.style.display = "block";
    if (summary) summary.style.display = "block";
    if (proofWrap) proofWrap.style.display = "block";
    if (placeBtn) placeBtn.textContent = "Finish order";
  }
}

function openCheckout() {
  const { items } = cartTotals();
  if (items === 0) return;

  // close cart first so it looks clean
  closeCart();

  $("checkoutModal")?.classList.add("show");
  $("checkoutModal")?.setAttribute("aria-hidden", "false");

  // start at step 1 every time
  setCheckoutStep(1);
}

function closeCheckout() {
  $("checkoutModal")?.classList.remove("show");
  $("checkoutModal")?.setAttribute("aria-hidden", "true");
}

/** Success */
function openSuccess(orderId) {
  if ($("orderIdText")) $("orderIdText").textContent = orderId;
  $("successModal")?.classList.add("show");
  $("successModal")?.setAttribute("aria-hidden", "false");
}
function closeSuccess() {
  $("successModal")?.classList.remove("show");
  $("successModal")?.setAttribute("aria-hidden", "true");
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

/** Validate delivery details */
function getDeliveryDetails() {
  const form = $("checkoutForm");
  const formData = new FormData(form);

  const fullName = (formData.get("name") || "").toString().trim();
  const phone = (formData.get("phone") || "").toString().trim();
  const address = (formData.get("address") || "").toString().trim();
  const city = (formData.get("city") || "").toString().trim();
  const state = (formData.get("state") || "").toString().trim();
  const pincode = (formData.get("pincode") || "").toString().trim();

  if (!fullName || !phone || !address || !city || !state || !pincode) {
    return { ok: false, msg: "Please fill all delivery details." };
  }

  // split name into first/last for Google Sheet
  const parts = fullName.split(" ").filter(Boolean);
  const firstName = parts[0] || fullName;
  const lastName = parts.slice(1).join(" ");

  return {
    ok: true,
    data: { fullName, firstName, lastName, phone, address, city, state, pincode },
  };
}

/** Place order click: step 1 -> step 2 -> submit */
async function onPlaceOrderClick() {
  const msg = $("placeOrderMsg");
  const btn = $("placeOrderBtn");

  // Step 1: validate details, then show payment
  if (checkoutStep === 1) {
    const details = getDeliveryDetails();
    if (!details.ok) {
      if (msg) msg.textContent = details.msg;
      return;
    }

    setCheckoutStep(2);
    toast("Now complete payment ✅");
    return;
  }

  // Step 2: require screenshot + submit order
  const { items, total } = cartTotals();
  if (items === 0) return;

  const details = getDeliveryDetails();
  if (!details.ok) {
    if (msg) msg.textContent = details.msg;
    setCheckoutStep(1);
    return;
  }

  const proofFile = $("paymentProof")?.files?.[0];
  if (!proofFile) {
    if (msg) msg.textContent = "Please upload your UPI payment screenshot (required).";
    return;
  }

  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_")) {
    if (msg) msg.textContent = "Admin setup required: add your Google Apps Script Web App URL in script.js";
    return;
  }

  btn.disabled = true;
  if (msg) msg.textContent = "Submitting order...";

  const orderId = makeOrderId();
  const proofDataUrl = await fileToDataUrl(proofFile);

  // Build a flat payload (easy for Google Apps Script)
  const productList = cart.map((c) => `${c.name} (${c.variantLabel}) x${c.qty}`).join(" | ");
  const sizesList = cart.map((c) => c.variantLabel).join(", ");
  const qtyList = cart.map((c) => String(c.qty)).join(", ");

  const payload = {
    orderId,
    firstName: details.data.firstName,
    lastName: details.data.lastName,
    phone: details.data.phone,

    product: productList,
    size: sizesList,
    quantity: qtyList,

    subtotal: total,
    shipping: 0,
    finalAmount: total,

    upiRef: proofFile.name, // filename as reference
    address1: details.data.address,
    area: "",
    city: details.data.city,
    district: "",
    state: details.data.state,
    pincode: details.data.pincode,

    screenshotDataUrl: proofDataUrl, // store in sheet as text (optional)
    screenshotName: proofFile.name,
    screenshotType: proofFile.type || "image/png",
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const txt = await res.text();
    if (!res.ok) throw new Error(txt || "Server error");

    // Success UI
    closeCheckout();
    openSuccess(orderId);

    clearCart();
    $("checkoutForm")?.reset();
    $("paymentProof").value = "";
    if ($("proofHint")) $("proofHint").textContent = "No file selected";
  } catch (err) {
    if (msg) msg.textContent = "Failed to place order. Please try again. (" + err.message + ")";
  } finally {
    btn.disabled = false;
  }
}

function init() {
  if ($("year")) $("year").textContent = new Date().getFullYear();
  if ($("upiIdText")) $("upiIdText").textContent = UPI_ID;

  renderProducts();
  updateCartUI();

  // Cart open buttons
  $("openCartBtn")?.addEventListener("click", openCart);
  $("footerCartOpen")?.addEventListener("click", (e) => {
    e.preventDefault();
    openCart();
  });

  // Cart close
  $("closeCartBtn")?.addEventListener("click", closeCart);
  $("drawerBackdrop")?.addEventListener("click", closeCart);

  // Checkout
  $("checkoutBtn")?.addEventListener("click", openCheckout);
  $("closeCheckoutBtn")?.addEventListener("click", closeCheckout);
  $("checkoutBackdrop")?.addEventListener("click", closeCheckout);

  // Clear cart
  $("clearCartBtn")?.addEventListener("click", clearCart);

  // Place order (step button)
  $("placeOrderBtn")?.addEventListener("click", onPlaceOrderClick);

  // File hint
  $("paymentProof")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if ($("proofHint")) $("proofHint").textContent = f ? `Selected: ${f.name}` : "No file selected";
  });

  // Success modal
  $("closeSuccessBtn")?.addEventListener("click", closeSuccess);
  $("successBackdrop")?.addEventListener("click", closeSuccess);
  $("newOrderBtn")?.addEventListener("click", () => {
    closeSuccess();
  });
}

document.addEventListener("DOMContentLoaded", init);
