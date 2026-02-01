/***********************
 * 1) CONFIG (EDIT HERE)
 ***********************/
const BRAND = {
  upiId: "yourupi@upi",           // change later (e.g., saispices@upi)
};

const SHEET_API_URL = "PASTE_YOUR_WEB_APP_URL_HERE"; // <-- paste your Apps Script Web App URL

// Products (edit prices here anytime)
const PRODUCTS = [
  {
    id: "chilli",
    name: "Red Chilli Powder",
    desc: "Fresh red chilli powder, hygienically packed. Rich colour & strong flavour.",
    options: [
      { size: 50,  price: 0 },
      { size: 100, price: 0 },
      { size: 250, price: 0 },
    ],
    tag: "Hot & Fresh",
  },
  {
    id: "turmeric",
    name: "Turmeric Powder",
    desc: "Pure turmeric powder for daily cooking. Fresh aroma and natural colour.",
    options: [
      { size: 50,  price: 0 },
      { size: 100, price: 0 },
    ],
    tag: "Daily Essential",
  },
];

// Zone mapping by state (weight + distance)
const ZONE_A = new Set(["Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Kerala"]);
const ZONE_B = new Set(["Maharashtra","Goa","Gujarat","Madhya Pradesh","Chhattisgarh","Odisha"]);
// Everything else = Zone C

// Shipping table: zone -> weightBracket -> cost
// brackets are: <=250g, <=500g, <=1000g (1kg)
const SHIPPING = {
  A: { w250: 49, w500: 69, w1000: 99 },
  B: { w250: 59, w500: 79, w1000: 119 },
  C: { w250: 69, w500: 99, w1000: 149 }
};


/***********************
 * 2) UTILITIES
 ***********************/
const ₹ = (n) => `₹${Number(n || 0).toFixed(0)}`;

function makeOrderId(){
  return "SS" + Date.now().toString().slice(-8);
}

function getZone(state){
  if (!state) return "C";
  if (ZONE_A.has(state)) return "A";
  if (ZONE_B.has(state)) return "B";
  return "C";
}

function calcShipping(totalWeightGrams, state){
  const zone = getZone(state);
  const table = SHIPPING[zone];

  if (totalWeightGrams <= 250) return table.w250;
  if (totalWeightGrams <= 500) return table.w500;
  return table.w1000; // up to 1kg
}

function loadCart(){
  try { return JSON.parse(localStorage.getItem("saip_cart") || "[]"); }
  catch { return []; }
}

function saveCart(cart){
  localStorage.setItem("saip_cart", JSON.stringify(cart));
}

function cartCount(cart){
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function cartWeight(cart){
  return cart.reduce((sum, i) => sum + (i.size * i.qty), 0);
}

function cartSubtotal(cart){
  return cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
}

function findProduct(productId){
  return PRODUCTS.find(p => p.id === productId);
}


/***********************
 * 3) RENDER PRODUCTS
 ***********************/
const productGrid = document.getElementById("productGrid");
const cartCountEl = document.getElementById("cartCount");
const cartCountEl2 = document.getElementById("cartCount2");

function renderProducts(){
  productGrid.innerHTML = "";

  PRODUCTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "productCard";

    const optionHtml = p.options.map(o => {
      return `<option value="${o.size}" data-price="${o.price}">${o.size}g — ${₹(o.price)}</option>`;
    }).join("");

    card.innerHTML = `
      <div class="pTop">
        <div>
          <div class="pName">${p.name}</div>
          <div class="pTag">${p.tag}</div>
        </div>
      </div>
      <p class="pDesc">${p.desc}</p>

      <div class="pControls">
        <select class="select" data-product="${p.id}">
          ${optionHtml}
        </select>
        <input class="qty" type="number" min="1" value="1" />
      </div>

      <div class="pPrice">
        <div>
          <div class="price" data-price-label> ${₹(p.options[0].price)} </div>
          <div class="priceHint">Price per pack</div>
        </div>
        <button class="btn btn--primary" type="button" data-add="${p.id}">Add to cart</button>
      </div>
    `;

    // Update price label when size changes
    const select = card.querySelector("select");
    const priceLabel = card.querySelector("[data-price-label]");
    select.addEventListener("change", () => {
      const opt = select.selectedOptions[0];
      priceLabel.textContent = ₹(opt.getAttribute("data-price"));
    });

    // Add to cart
    const addBtn = card.querySelector(`[data-add="${p.id}"]`);
    addBtn.addEventListener("click", () => {
      const size = Number(select.value);
      const price = Number(select.selectedOptions[0].getAttribute("data-price"));
      const qty = Math.max(1, Number(card.querySelector(".qty").value || 1));

      addToCart(p.id, p.name, size, price, qty);
      openCart();
    });

    productGrid.appendChild(card);
  });
}


/***********************
 * 4) CART DRAWER
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

function addToCart(id, name, size, price, qty){
  const cart = loadCart();
  const key = `${id}_${size}`;
  const existing = cart.find(i => i.key === key);

  if (existing) existing.qty += qty;
  else cart.push({ key, id, name, size, price, qty });

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
    cartItemsEl.innerHTML = `<p class="muted small">Your cart is empty. Add products to continue.</p>`;
  } else {
    cartItemsEl.innerHTML = cart.map(i => `
      <div class="cartItem">
        <div>
          <div class="cartItem__name">${i.name}</div>
          <div class="cartItem__meta">${i.size}g • ${₹(i.price)} each</div>
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
  const estShip = calcShipping(cartWeight(cart), document.getElementById("state")?.value || "");
  cartSubtotalEl.textContent = ₹(subtotal);
  cartShipEl.textContent = ₹(cart.length ? estShip : 0);
  cartTotalEl.textContent = ₹(subtotal + (cart.length ? estShip : 0));
}


/***********************
 * 5) CHECKOUT SUMMARY + SUBMIT
 ***********************/
const sumItems = document.getElementById("sumItems");
const sumSubtotal = document.getElementById("sumSubtotal");
const sumShipping = document.getElementById("sumShipping");
const sumTotal = document.getElementById("sumTotal");

const upiIdText = document.getElementById("upiIdText");

const stateEl = document.getElementById("state");
const orderForm = document.getElementById("orderForm");
const successBox = document.getElementById("successBox");
const errorBox = document.getElementById("errorBox");
const orderIdOut = document.getElementById("orderIdOut");

function updateCartBadges(){
  const cart = loadCart();
  const c = cartCount(cart);
  cartCountEl.textContent = c;
  cartCountEl2.textContent = c;
}

function updateCheckoutSummary(){
  const cart = loadCart();
  const items = cartCount(cart);
  const subtotal = cartSubtotal(cart);
  const weight = cartWeight(cart);
  const ship = cart.length ? calcShipping(weight, stateEl?.value || "") : 0;
  const total = subtotal + ship;

  sumItems.textContent = items;
  sumSubtotal.textContent = ₹(subtotal);
  sumShipping.textContent = ₹(ship);
  sumTotal.textContent = ₹(total);
}

stateEl?.addEventListener("change", () => {
  updateCheckoutSummary();
  renderCart();
});

async function postToSheet(payload){
  if (!SHEET_API_URL || SHEET_API_URL.includes("PASTE_YOUR_WEB_APP_URL_HERE")){
    alert("Please paste your Apps Script Web App URL in script.js (SHEET_API_URL).");
    return false;
  }

  try{
    // no-cors works for Apps Script web app "Anyone" access
    await fetch(SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return true;
  }catch(err){
    console.error(err);
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

  // collect fields
  const firstName = document.getElementById("firstName").value.trim();
  const lastName  = document.getElementById("lastName").value.trim();
  const phone     = document.getElementById("phone").value.trim();
  const address1  = document.getElementById("address1").value.trim();
  const area      = document.getElementById("area").value.trim();
  const city      = document.getElementById("city").value.trim();
  const district  = document.getElementById("district").value.trim();
  const state     = document.getElementById("state").value.trim();
  const pincode   = document.getElementById("pincode").value.trim();
  const upiRef    = document.getElementById("upiRef").value.trim();

  // basic checks
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
  const weight = cartWeight(cart);
  const shipping = calcShipping(weight, state);
  const finalAmount = subtotal + shipping;

  // create readable item list
  const itemsText = cart.map(i => `${i.name} ${i.size}g x${i.qty}`).join(" | ");

  const payload = {
    orderId,
    firstName,
    lastName,
    phone,
    product: itemsText,
    size: "-",                 // kept for compatibility with your Apps Script columns
    quantity: cartCount(cart), // total items count
    weight,                    // grams
    subtotal,
    shipping,
    finalAmount,
    upiRef,
    address1,
    area,
    city,
    district,
    state,
    pincode
  };

  const ok = await postToSheet(payload);

  if (ok){
    // clear cart + show success
    saveCart([]);
    updateCartBadges();
    updateCheckoutSummary();
    renderCart();

    orderIdOut.textContent = orderId;
    successBox.style.display = "block";
    orderForm.reset();
    // keep UPI text
    upiIdText.textContent = BRAND.upiId;

    // scroll to success message
    successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    alert("Order not saved. Please try again or check internet / Apps Script URL.");
  }
});


/***********************
 * 6) INIT
 ***********************/
upiIdText.textContent = BRAND.upiId;

renderProducts();
updateCartBadges();
updateCheckoutSummary();

// close drawer when navigating
document.getElementById("goCheckoutBtn")?.addEventListener("click", () => {
  closeCart();
  setTimeout(() => updateCheckoutSummary(), 300);
});
