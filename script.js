/**
 * Paste your Apps Script Web App URL here (YOU ALREADY HAVE IT)
 */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzjCjfHAvncaUBKhnn97Mww34dKCdQc1Gqx6dyxklMhwfYrWROhlM_St3u5uHlQoXv20A/exec";

// UPI ID placeholder (update later)
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

// cart items: {productId, name, variantLabel, price, qty}
const cart = [];

const $ = (id) => document.getElementById(id);

function formatINR(n){
  return "₹" + Number(n).toLocaleString("en-IN");
}

function cartTotals(){
  const items = cart.reduce((a,c)=>a + c.qty, 0);
  const total = cart.reduce((a,c)=>a + (c.price * c.qty), 0);
  return { items, total };
}

/* ---------- UI: Products ---------- */
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
        <select class="variantSel" aria-label="Select size">${variantOptions}</select>
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

      // Reset qty back to 1 (optional)
      qty.value = "1";
    });

    grid.appendChild(el);
  });
}

function addToCart(product, variant, qty){
  const key = `${product.id}__${variant.label}`;
  const existing = cart.find(x => `${x.productId}__${x.variantLabel}` === key);

  if(existing){
    existing.qty += qty;
  }else{
    cart.push({
      productId: product.id,
      name: product.name,
      variantLabel: variant.label,
      price: variant.price,
      qty
    });
  }

  // IMPORTANT: DO NOT OPEN CART AUTOMATICALLY
  updateCartUI();
}

/* ---------- UI: Cart ---------- */
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

function openCart(){
  $("cartDrawer").classList.add("show");
  $("cartDrawer").setAttribute("aria-hidden","false");
}
function closeCart(){
  $("cartDrawer").classList.remove("show");
  $("cartDrawer").setAttribute("aria-hidden","true");
}

/* ---------- Checkout Steps ---------- */
function openCheckout(){
  if(cartTotals().items === 0) return;

  // reset to step 1
  $("detailsStep").style.display = "block";
  $("paymentStep").style.display = "none";
  $("detailsMsg").textContent = "";
  $("placeOrderMsg").textContent = "";

  $("checkoutModal").classList.add("show");
  $("checkoutModal").setAttribute("aria-hidden","false");
}

function closeCheckout(){
  $("checkoutModal").classList.remove("show");
  $("checkoutModal").setAttribute("aria-hidden","true");
}

function goPaymentStep(){
  const form = $("checkoutForm");
  if(!form.reportValidity()){
    $("detailsMsg").textContent = "Please fill all details to continue.";
    return;
  }

  $("detailsStep").style.display = "none";
  $("paymentStep").style.display = "block";
  $("detailsMsg").textContent = "";
  $("placeOrderMsg").textContent = "";
}

function backToDetails(){
  $("paymentStep").style.display = "none";
  $("detailsStep").style.display = "block";
  $("placeOrderMsg").textContent = "";
}

/* ---------- Success Modal ---------- */
function openSuccess(orderId){
  $("orderIdText").textContent = orderId;
  $("successModal").classList.add("show");
  $("successModal").setAttribute("aria-hidden","false");
}
function closeSuccess(){
  $("successModal").classList.remove("show");
  $("successModal").setAttribute("aria-hidden","true");
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

/* ---------- Place Order ---------- */
async function placeOrder(){
  const {items,total} = cartTotals();
  if(items === 0) return;

  const form = $("checkoutForm");
  const fd = new FormData(form);

  const customer = {
    name: (fd.get("name")||"").toString().trim(),
    phone: (fd.get("phone")||"").toString().trim(),
    address: (fd.get("address")||"").toString().trim(),
    city: (fd.get("city")||"").toString().trim(),
    state: (fd.get("state")||"").toString().trim(),
    pincode: (fd.get("pincode")||"").toString().trim(),
  };

  if(!customer.name || !customer.phone || !customer.address || !customer.city || !customer.state || !customer.pincode){
    $("placeOrderMsg").textContent = "Please complete delivery details.";
    return;
  }

  const proofFile = $("paymentProof").files?.[0];
  if(!proofFile){
    $("placeOrderMsg").textContent = "Please upload your UPI payment screenshot (required).";
    return;
  }

  $("placeOrderBtn").disabled = true;
  $("placeOrderMsg").textContent = "Placing order...";

  const orderId = makeOrderId();
  const proofDataUrl = await fileToDataUrl(proofFile);

  const payload = {
    orderId,
    createdAt: new Date().toISOString(),
    customer,
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
    if(!res.ok) throw new Error(text || "Server error");

    // success
    closeCheckout();
    closeCart();
    openSuccess(orderId);

    clearCart();
    form.reset();
    $("paymentProof").value = "";
    $("proofHint").textContent = "No file selected";
  }catch(err){
    $("placeOrderMsg").textContent = "Failed. Try again. (" + err.message + ")";
  }finally{
    $("placeOrderBtn").disabled = false;
  }
}

/* ---------- Init ---------- */
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

  // Checkout open/close
  $("checkoutBtn").addEventListener("click", openCheckout);
  $("closeCheckoutBtn").addEventListener("click", closeCheckout);
  $("checkoutBackdrop").addEventListener("click", closeCheckout);

  // Checkout steps
  $("goPaymentBtn").addEventListener("click", goPaymentStep);
  $("backToDetailsBtn").addEventListener("click", backToDetails);

  // Cart actions
  $("clearCartBtn").addEventListener("click", clearCart);

  // Place order
  $("placeOrderBtn").addEventListener("click", placeOrder);

  // Proof hint
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
