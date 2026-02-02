/**
 * Google Apps Script Web App URL (your link)
 */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzjCjfHAvncaUBKhnn97Mww34dKCdQc1Gqx6dyxklMhwfYrWROhlM_St3u5uHlQoXv20A/exec";

// UPI ID placeholder (you will update later)
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

const cart = []; // {productId, name, variantLabel, price, qty}
const $ = (id) => document.getElementById(id);

function formatINR(n){
  return "₹" + Number(n).toLocaleString("en-IN");
}

function cartTotals(){
  const items = cart.reduce((a,c)=>a + c.qty, 0);
  const total = cart.reduce((a,c)=>a + (c.price * c.qty), 0);
  return { items, total };
}

/* ====== UI: Products ====== */
function renderProducts(){
  const grid = $("productsGrid");
  grid.innerHTML = "";

  PRODUCTS.forEach(p => {
    const el = document.createElement("div");
    el.className = "product";

    const variantOptions = p.variants
      .map((v,i)=>`<option value="${i}">${v.label} — ${formatINR(v.price)}</option>`)
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
    });

    grid.appendChild(el);
  });
}

/* ====== Cart Logic ====== */
function addToCart(product, variant, qty){
  const key = `${product.id}__${variant.label}`;
  const existing = cart.find(x => `${x.productId}__${x.variantLabel}` === key);

  if(existing){
    existing.qty += qty;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      variantLabel: variant.label,
      price: variant.price,
      qty
    });
  }

  // ✅ update number ONLY (do not open cart automatically)
  updateCartUI();
}

function removeItem(index){
  cart.splice(index,1);
  updateCartUI();
}

function clearCart(){
  cart.length = 0;
  updateCartUI();
}

function updateCartUI(){
  const {items,total} = cartTotals();
  $("cartCount").textContent = items;
  $("cartSub").textContent = `${items} item${items===1?"":"s"}`;
  $("cartTotal").textContent = formatINR(total);
  $("summaryItems").textContent = items;
  $("summaryTotal").textContent = formatINR(total);

  $("checkoutBtn").disabled = items === 0;
  $("clearCartBtn").disabled = items === 0;

  const list = $("cartItems");
  list.innerHTML = "";

  if(items === 0){
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

/* ====== Drawer / Modal Open Close ====== */
function openCart(){
  $("cartDrawer").classList.add("show");
  $("cartDrawer").setAttribute("aria-hidden","false");
}
function closeCart(){
  $("cartDrawer").classList.remove("show");
  $("cartDrawer").setAttribute("aria-hidden","true");
}

function openCheckout(){
  $("checkoutModal").classList.add("show");
  $("checkoutModal").setAttribute("aria-hidden","false");
  $("placeOrderMsg").textContent = "";
  showCheckoutStep(1);
}
function closeCheckout(){
  $("checkoutModal").classList.remove("show");
  $("checkoutModal").setAttribute("aria-hidden","true");
}

function openSuccess(orderId){
  $("orderIdText").textContent = orderId;
  $("successModal").classList.add("show");
  $("successModal").setAttribute("aria-hidden","false");
}
function closeSuccess(){
  $("successModal").classList.remove("show");
  $("successModal").setAttribute("aria-hidden","true");
}

/* ====== Checkout 2 Steps ====== */
function showCheckoutStep(step){
  const s1 = $("step1");
  const s2 = $("step2");
  if(step === 1){
    s1.style.display = "block";
    s2.style.display = "none";
  } else {
    s1.style.display = "none";
    s2.style.display = "block";
  }
}

function makeOrderId(){
  const n = Math.floor(1000 + Math.random()*9000);
  return `SS-${n}`;
}

function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* ====== Place Order ====== */
async function placeOrder(){
  const {items,total} = cartTotals();
  if(items === 0) return;

  const form = $("checkoutForm");
  if(!form.reportValidity()){
    showCheckoutStep(1);
    return;
  }

  // must be in payment step for finish order
  const proofFile = $("paymentProof").files?.[0];
  if(!proofFile){
    $("placeOrderMsg").textContent = "Please upload your UPI payment screenshot (required).";
    return;
  }

  $("finishOrderBtn").disabled = true;
  $("placeOrderMsg").textContent = "Placing order...";

  const fd = new FormData(form);

  const name = (fd.get("name")||"").toString().trim();
  const phone = (fd.get("phone")||"").toString().trim();
  const address = (fd.get("address")||"").toString().trim();
  const city = (fd.get("city")||"").toString().trim();
  const state = (fd.get("state")||"").toString().trim();
  const pincode = (fd.get("pincode")||"").toString().trim();

  const orderId = makeOrderId();
  const proofDataUrl = await fileToDataUrl(proofFile);

  const payload = {
    orderId,
    createdAt: new Date().toISOString(),
    customer: { name, phone, address, city, state, pincode },
    delivery: "AP & Telangana only",
    payment: { method: "UPI (Manual)", upiId: UPI_ID },
    cart,
    total,
    screenshot: {
      filename: proofFile.name,
      mimeType: proofFile.type || "image/png",
      dataUrl: proofDataUrl
    }
  };

  try{
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    if(!res.ok){
      throw new Error(text || "Server error");
    }

    closeCheckout();
    openSuccess(orderId);

    clearCart();
    form.reset();
    $("paymentProof").value = "";
    $("proofHint").textContent = "No file selected";

  }catch(err){
    $("placeOrderMsg").textContent = "Failed to place order. Please try again. (" + err.message + ")";
  }finally{
    $("finishOrderBtn").disabled = false;
  }
}

/* ====== Init ====== */
function init(){
  $("year").textContent = new Date().getFullYear();
  $("upiIdText").textContent = UPI_ID;

  renderProducts();
  updateCartUI();

  // Cart open/close
  $("openCartBtn").addEventListener("click", openCart);
  $("footerCartOpen").addEventListener("click", (e)=>{ e.preventDefault(); openCart(); });

  $("closeCartBtn").addEventListener("click", closeCart);
  $("drawerBackdrop").addEventListener("click", closeCart);

  // Checkout from cart
  $("checkoutBtn").addEventListener("click", () => {
    closeCart();
    openCheckout();
  });

  $("closeCheckoutBtn").addEventListener("click", closeCheckout);
  $("checkoutBackdrop").addEventListener("click", closeCheckout);

  $("clearCartBtn").addEventListener("click", clearCart);

  // Step buttons
  $("makePaymentBtn").addEventListener("click", () => {
    const form = $("checkoutForm");
    if(!form.reportValidity()) return;
    showCheckoutStep(2);
  });

  $("backToDetailsBtn").addEventListener("click", () => showCheckoutStep(1));

  // Finish order
  $("finishOrderBtn").addEventListener("click", placeOrder);

  // Screenshot hint
  $("paymentProof").addEventListener("change", (e)=>{
    const f = e.target.files?.[0];
    $("proofHint").textContent = f ? `Selected: ${f.name}` : "No file selected";
  });

  // Success modal
  $("closeSuccessBtn").addEventListener("click", closeSuccess);
  $("successBackdrop").addEventListener("click", closeSuccess);
  $("newOrderBtn").addEventListener("click", () => { closeSuccess(); });
}

document.addEventListener("DOMContentLoaded", init);
