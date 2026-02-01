/***********************
 * CONFIG
 ***********************/
const SHEET_API_URL = "PASTE_YOUR_WEB_APP_URL_HERE";

const ALLOWED_STATES = new Set(["Andhra Pradesh", "Telangana"]);
const DELIVERY_FEE = 0;

const PRODUCTS = [
  {
    id: "chilli",
    name: "Red Chilli Powder",
    desc: "Freshly ground, hygienically packed. Strong flavour & rich colour.",
    artClass: "pArt--chilli",
    options: [
      { sizeLabel: "100g", grams: 100, price: 65 },
      { sizeLabel: "200g", grams: 200, price: 119 },
      { sizeLabel: "500g", grams: 500, price: 199 },
      { sizeLabel: "1kg",  grams: 1000, price: 289 },
    ],
  },
];

/***********************
 * UTILITIES
 ***********************/
const ₹ = (n) => `₹${Number(n || 0).toFixed(0)}`;

function makeOrderId(){
  return "SS" + Date.now().toString().slice(-8);
}
function loadCart(){
  try { return JSON.parse(localStorage.getItem("saip_cart") || "[]"); }
  catch { return []; }
}
function saveCart(cart){
  localStorage.setItem("saip_cart", JSON.stringify(cart));
}
function cartCount(cart){ return cart.reduce((sum, i) => sum + i.qty, 0); }
function cartSubtotal(cart){ return cart.reduce((sum, i) => sum + (i.price * i.qty), 0); }
function cartWeight(cart){ return cart.reduce((sum, i) => sum + (i.grams * i.qty), 0); }

/***********************
 * RENDER PRODUCT
 ***********************/
const productGrid = document.getElementById("productGrid");

function renderProducts(){
  productGrid.innerHTML = "";

  PRODUCTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "productCard";

    const optionHtml = p.options.map((o, idx) => {
      const selected = idx === 0 ? "selected" : "";
      return `<option ${selected} value="${o.grams}" data-price="${o.price}" data-label="${o.sizeLabel}">
        ${o.sizeLabel} — ${₹(o.price)}
      </option>`;
    }).join("");

    card.innerHTML = `
      <div class="pArt ${p.artClass}"></div>

      <div>
        <div class="pName">${p.name}</div>
        <p class="pDesc">${p.desc}</p>

        <div class="pControls">
          <select class="select" data-product="${p.id}">
            ${optionHtml}
          </select>

          <input class="qty" type="number" min="1" value="1" />

          <button class="btn btn--primary" type="button" data-add="${p.id}">Add to cart</button>
        </div>

        <div class="price" data-price-label>${₹(p.options[0].price)}</div>
        <div class="muted small">Free delivery only in Andhra Pradesh & Telangana.</div>
      </div>
    `;

    const select = card.querySelector("select");
    const priceLabel = card.querySelector("[data-price-label]");
    select.addEventListener("change", () => {
      const opt = select.selectedOptions[0];
      priceLabel.textContent = ₹(opt.getAttribute("data-price"));
    });

    card.querySelector(`[data-add="${p.id}"]`).addEventListener("click", () => {
      const opt = select.selectedOptions[0];
      const grams = Number(select.value);
      const sizeLabel = opt.getAttribute("data-label");
      const price = Number(opt.getAttribute("data-price"));
      const qty = Math.max(1, Number(card.querySelector(".qty").value || 1));

      addToCart(p.id, p.name, sizeLabel, grams, price, qty);
      openCart();
    });

    productGrid.appendChild(card);
  });
}

/***********************
 * CART
 ***********************/
const drawer = document.getElementById("cartDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const cartItemsEl = document.getElementById("cartItems");
const cartMetaEl = document.getElementById("cartMeta");

const openCartBtn = document.getElementById("openCartBtn");
const openCartBtn2 = document.getElementById("openCartBtn2");
const openCartBtn3 = document.getElementById("openCartBtn3");
const stickyCartBtn = document.getElementById("stickyCartBtn");

const closeCartBtn = document.getElementById("closeCartBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartShipEl = document.getElementById("cartShip");
const cartTotalEl = document.getElementById("cartTotal");

const cartCountEl = document.getElementById("cartCount");
const cartCountEl2 = document.getElementById("cartCount2");

function openCart(){
  drawer.classList.add("isOpen");
  drawer.setAttribute("aria-hidden", "false");
  renderCart();
}
function closeCart(){
  drawer.classList.remove("isOpen");
  drawer.setAttribute("aria-hidden", "true");
}

openCartBtn?.addEventListener("click", openCart);
openCartBtn2?.addEventListener("click", openCart);
openCartBtn3?.addEventListener("click", openCart);
stickyCartBtn?.addEventListener("click", openCart);

closeCartBtn?.addEventListener("click", closeCart);
drawerBackdrop?.addEventListener("click", closeCart);

clearCartBtn?.addEventListener("click", () => {
  saveCart([]);
  updateCartBadges();
  renderCart();
  updateCheckoutSummary();
});

function addToCart(id, name, sizeLabel, grams, price, qty){
  const cart = loadCart();
  const key = `${id}_${grams}`;
  const existing = cart.find(i => i.key === key);

  if (existing) existing.qty += qty;
  else cart.push({ key, id, name, sizeLabel, grams, price, qty });

  saveCart(cart);
  updateCartBadges();
  updateCheckoutSummary();
}

function changeQty(key, delta){
  const cart = loadCart();
  const item = cart.find(i => i.key === key);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0){
    const idx = cart.findIndex(i => i.key === key);
    cart.splice(idx, 1);
  }
  saveCart(cart);
  updateCartBadges();
  renderCart();
  updateCheckoutSummary();
}

function removeItem(key){
  const cart = loadCart().filter(i => i.key !== key);
  saveCart(cart);
  updateCartBadges();
  renderCart();
  updateCheckoutSummary();
}

function renderCart(){
  const cart = loadCart();
  cartMetaEl.textContent = `${cartCount(cart)} items`;

  if (cart.length === 0){
    cartItemsEl.innerHTML = `<p class="muted small">Your cart is empty. Add packs to continue.</p>`;
  } else {
    cartItemsEl.innerHTML = cart.map(i => `
      <div class="cartItem">
        <div>
          <div class="cartItem__name">${i.name}</div>
          <div class="cartItem__meta">${i.sizeLabel} • ${₹(i.price)} each</div>
          <div class="cartItem__meta"><b>${₹(i.price * i.qty)}</b></div>
        </div>
        <div class="cartItem__actions">
          <button class="qtyBtn" data-minus="${i.key}">−</button>
          <b>${i.qty}</b>
          <button class="qtyBtn" data-plus="${i.key}">+</button>
          <button class="removeBtn" data-remove="${i.key}">Remove</button>
        </div>
      </div>
    `).join("");

    cartItemsEl.querySelectorAll("[data-minus]").forEach(btn => {
      btn.addEventListener("click", () => changeQty(btn.getAttribute("data-minus"), -1));
    });
    cartItemsEl.querySelectorAll("[data-plus]").forEach(btn => {
      btn.addEventListener("click", () => changeQty(btn.getAttribute("data-plus"), 1));
    });
    cartItemsEl.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => removeItem(btn.getAttribute("data-remove")));
    });
  }

  const subtotal = cartSubtotal(cart);
  cartSubtotalEl.textContent = ₹(subtotal);
  cartShipEl.textContent = ₹(cart.length ? DELIVERY_FEE : 0);
  cartTotalEl.textContent = ₹(subtotal + (cart.length ? DELIVERY_FEE : 0));
}

/***********************
 * CHECKOUT
 ***********************/
const sumItems = document.getElementById("sumItems");
const sumSubtotal = document.getElementById("sumSubtotal");
const sumShipping = document.getElementById("sumShipping");
const sumTotal = document.getElementById("sumTotal");

const stateEl = document.getElementById("state");
const stateWarn = document.getElementById("stateWarn");
const placeOrderBtn = document.getElementById("placeOrderBtn");

const orderForm = document.getElementById("orderForm");
const successBox = document.getElementById("successBox");
const errorBox = document.getElementById("errorBox");
const orderIdOut = document.getElementById("orderIdOut");

const upiField = document.getElementById("upiField");
const cardField = document.getElementById("cardField");

function updateCartBadges(){
  const cart = loadCart();
  const c = cartCount(cart);
  cartCountEl.textContent = c;
  cartCountEl2.textContent = c;
}

function deliveryAllowed(){
  const state = stateEl?.value || "";
  return ALLOWED_STATES.has(state);
}

function updateStateUI(){
  const ok = deliveryAllowed();
  const stateValue = stateEl?.value || "";

  if (!stateValue){
    stateWarn.style.display = "none";
    placeOrderBtn.disabled = false;
    return;
  }

  if (ok){
    stateWarn.style.display = "none";
    placeOrderBtn.disabled = false;
  } else {
    stateWarn.style.display = "block";
    placeOrderBtn.disabled = true;
  }
}

function updateCheckoutSummary(){
  const cart = loadCart();
  const items = cartCount(cart);
  const subtotal = cartSubtotal(cart);
  const shipping = cart.length ? DELIVERY_FEE : 0;
  const total = subtotal + shipping;

  sumItems.textContent = items;
  sumSubtotal.textContent = ₹(subtotal);
  sumShipping.textContent = ₹(shipping);
  sumTotal.textContent = ₹(total);

  updateStateUI();
}

stateEl?.addEventListener("change", () => {
  updateCheckoutSummary();
  renderCart();
});

// payment toggle
document.querySelectorAll('input[name="payMethod"]').forEach(r => {
  r.addEventListener("change", () => {
    const method = document.querySelector('input[name="payMethod"]:checked')?.value || "UPI";
    if (method === "UPI"){
      upiField.style.display = "grid";
      cardField.style.display = "none";
    } else {
      upiField.style.display = "none";
      cardField.style.display = "grid";
    }
  });
});

// post to sheet
async function postToSheet(payload){
  if (!SHEET_API_URL || SHEET_API_URL.includes("PASTE_YOUR_WEB_APP_URL_HERE")){
    alert("Paste your Apps Script Web App URL in script.js (SHEET_API_URL).");
    return false;
  }
  try{
    await fetch(SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return true;
  }catch(e){
    console.error(e);
    return false;
  }
}

orderForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  successBox.style.display = "none";
  errorBox.style.display = "none";

  const cart = loadCart();
  if (cart.length === 0){
    errorBox.style.display = "block";
    return;
  }

  if (!deliveryAllowed()){
    alert("Currently delivery available only in Andhra Pradesh & Telangana.");
    return;
  }

  const firstName = document.getElementById("firstName").value.trim();
  const lastName  = document.getElementById("lastName").value.trim();
  const phone     = document.getElementById("phone").value.trim();
  const pincode   = document.getElementById("pincode").value.trim();
  const address1  = document.getElementById("address1").value.trim();
  const area      = document.getElementById("area").value.trim();
  const city      = document.getElementById("city").value.trim();
  const district  = document.getElementById("district").value.trim();
  const state     = document.getElementById("state").value.trim();
  const notes     = document.getElementById("notes").value.trim();

  const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || "UPI";
  const upiRef = document.getElementById("upiRef").value.trim();
  const cardRef = document.getElementById("cardRef").value.trim();

  if (!/^\d{10}$/.test(phone)){
    alert("Please enter a valid 10-digit phone number.");
    return;
  }
  if (!/^\d{6}$/.test(pincode)){
    alert("Please enter a valid 6-digit pincode.");
    return;
  }

  const orderId = makeOrderId();
  const subtotal = cartSubtotal(cart);
  const shipping = DELIVERY_FEE;
  const finalAmount = subtotal + shipping;

  const itemsText = cart.map(i => `${i.name} ${i.sizeLabel} x${i.qty}`).join(" | ");

  const paymentRef = (payMethod === "UPI") ? (upiRef || "") : (cardRef || "");

  const payload = {
    orderId,
    firstName,
    lastName,
    phone,

    product: itemsText,
    quantity: cartCount(cart),
    weight: cartWeight(cart),

    subtotal,
    shipping,
    finalAmount,

    paymentMethod: payMethod,
    paymentRef,

    address1,
    area,
    city,
    district,
    state,
    pincode,
    notes
  };

  const ok = await postToSheet(payload);

  if (ok){
    saveCart([]);
    updateCartBadges();
    updateCheckoutSummary();
    renderCart();

    orderIdOut.textContent = orderId;
    successBox.style.display = "block";
    orderForm.reset();
    updateStateUI();

    successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    alert("Order not saved. Check Apps Script URL and try again.");
  }
});

/***********************
 * INIT
 ***********************/
document.getElementById("year").textContent = new Date().getFullYear();

renderProducts();
updateCartBadges();
updateCheckoutSummary();

document.getElementById("goCheckoutBtn")?.addEventListener("click", () => {
  closeCart();
  setTimeout(() => updateCheckoutSummary(), 300);
});
