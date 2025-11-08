
const CART_KEY = "shv_cart_v10";
function qs(s,r=document){return r.querySelector(s)}
function qsa(s,r=document){return Array.from((r||document).querySelectorAll(s))}
async function loadJSON(path){try{const r=await fetch(path);return await r.json()}catch(e){console.error(e);return null}}

async function init(){
  const view = qs("#view-catalog");
  if(view) view.addEventListener("click",(e)=>{ view.animate([{transform:'scale(1)'},{transform:'scale(0.96)'},{transform:'scale(1)'}],{duration:220}); setTimeout(()=>location.href='categories/categories.html',220); });

  const cfg = await loadJSON("js/config.json");
  if(cfg){
    qsa(".social").forEach(a=>{ const key=a.dataset.key; if(cfg.socials && cfg.socials[key]){ a.href=cfg.socials[key]; a.target='_blank' }});
    qsa(".address").forEach(e=>e.textContent="📍 "+(cfg.address||""));
    qsa(".hours").forEach(e=>e.textContent="🕒 "+(cfg.hours||""));
  }

  // floating cart icon
  const floatBtn = qs("#floating-cart-btn");
  if(floatBtn) floatBtn.addEventListener("click", ()=> toggleMiniCart());

  updateFloatingCount();

  // to-top behavior: show on scroll, above cart
  const toTop = qs("#to-top");
  window.addEventListener("scroll", ()=>{
    if(window.scrollY > 200) { toTop.style.display = "flex"; } else { toTop.style.display = "none"; }
  });
  if(toTop) toTop.addEventListener("click", ()=> window.scrollTo({top:0,behavior:"smooth"}));

  // ensure framed back buttons remain visible (no JS needed; CSS sticky header)
}

// CART functions
function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(e){return []}}
function saveCart(c){localStorage.setItem(CART_KEY,JSON.stringify(c)); updateFloatingCount();}
function updateFloatingCount(){ const cnt = getCart().reduce((s,i)=>s+Number(i.qty||0),0); const el = qs("#floating-count"); if(el) el.textContent = cnt; const el2 = qs("#floating-count-top"); if(el2) el2.textContent = cnt; }

// add to cart: item {id,title,price,unit,color,qty}
function addToCart(item){
  const cart = getCart();
  const idx = cart.findIndex(i=>i.id===item.id && i.color===item.color);
  if(idx>-1) cart[idx].qty = Number(cart[idx].qty) + Number(item.qty); else cart.push(item);
  saveCart(cart);
  flash(`Добавлено: ${item.title} — ${item.qty} ${item.unit||''}`);
}

function flash(msg){
  let el = qs("#shv-flash");
  if(!el){ el = document.createElement("div"); el.id="shv-flash"; el.style.position="fixed"; el.style.left="50%"; el.style.transform="translateX(-50%)"; el.style.bottom="120px"; el.style.background="#fff"; el.style.padding="10px 14px"; el.style.borderRadius="10px"; el.style.boxShadow="0 8px 20px rgba(0,0,0,0.12)"; el.style.zIndex=2000; document.body.appendChild(el); }
  el.textContent = msg; el.style.opacity = "1"; setTimeout(()=>{ if(el) el.style.opacity = "0"; },1600);
}

// MINI-CART
function toggleMiniCart(){
  const existing = qs("#mini-cart");
  if(existing){ existing.remove(); return; }
  const cart = getCart();
  const panel = document.createElement("div"); panel.id = "mini-cart";

  if(cart.length === 0){
    panel.innerHTML = "<strong>Корзина пустая</strong>";
  } else {
    const list = document.createElement("div"); list.className = "mini-list";
    cart.forEach((it, idx)=>{
      const row = document.createElement("div"); row.className = "mini-item";
      const meta = document.createElement("div"); meta.className = "meta";
      meta.innerHTML = `<div style="font-weight:700">${it.title}</div><div style="font-size:13px;color:#555">${it.color?('Цвет: '+it.color):''}</div><div style="font-size:13px;color:#333">Цена: <span class="unit-price">${Number(it.price).toLocaleString()} ₸</span></div>`;
      const controls = document.createElement("div"); controls.className = "controls-mini";
      const qty = document.createElement("input"); qty.type = "number"; qty.min = 1; qty.value = it.qty; qty.addEventListener("change", ()=>{ let v = Number(qty.value); if(isNaN(v)||v<1) v = 1; updateItemQty(idx, v); renderAndOpenMiniCart(); });
      const priceTotal = document.createElement("div"); priceTotal.className = "price"; priceTotal.textContent = `${(Number(it.price)*Number(it.qty)).toLocaleString()} ₸`;
      const del = document.createElement("button"); del.className = "btn small"; del.textContent = "❌"; del.title = "Удалить"; del.addEventListener("click", ()=>{ removeItem(idx); renderAndOpenMiniCart(); });
      controls.appendChild(qty); controls.appendChild(del); controls.appendChild(priceTotal);
      row.appendChild(meta); row.appendChild(controls);
      list.appendChild(row);
    });
    panel.appendChild(list);

    // total
    const total = document.createElement("div"); total.className = "mini-total";
    total.innerHTML = `<div>Итого</div><div id="mini-total-sum">0 ₸</div>`;
    panel.appendChild(total);

    // actions
    const actions = document.createElement("div"); actions.style.display="flex"; actions.style.gap="8px"; actions.style.marginTop="10px";
    const clearBtn = document.createElement("button"); clearBtn.className = "btn"; clearBtn.textContent = "🗑 Очистить корзину"; clearBtn.addEventListener("click", ()=>{ if(confirm('Очистить корзину?')){ saveCart([]); panel.remove(); } });
    const orderBtn = document.createElement("button"); orderBtn.className = "btn primary"; orderBtn.textContent = "📦 Оформить заказ"; orderBtn.addEventListener("click", ()=> openWhatsAppOrder());
    actions.appendChild(clearBtn); actions.appendChild(orderBtn);
    panel.appendChild(actions);
  }

  document.body.appendChild(panel);
  updateMiniTotal();
}

// helper to render and re-open mini-cart (used after qty change or delete)
function renderAndOpenMiniCart(){
  const panel = qs("#mini-cart");
  if(panel) panel.remove();
  toggleMiniCart();
}

function updateItemQty(idx, qty){
  const cart = getCart();
  if(idx<0||idx>=cart.length) return;
  cart[idx].qty = Number(qty);
  saveCart(cart);
}

function removeItem(idx){
  const cart = getCart();
  if(idx<0||idx>=cart.length) return;
  cart.splice(idx,1);
  saveCart(cart);
}

// update total displayed in mini-cart
function updateMiniTotal(){
  const cart = getCart();
  const total = cart.reduce((s,i)=> s + Number(i.price)*Number(i.qty), 0);
  const el = qs("#mini-total-sum");
  if(el) el.textContent = total.toLocaleString() + " ₸";
  const priceEls = qsa("#mini-cart .price");
  priceEls.forEach((pe, idx)=> {
    const it = cart[idx];
    if(it) pe.textContent = (Number(it.price)*Number(it.qty)).toLocaleString() + " ₸";
  });
  updateFloatingCount();
}

// WhatsApp order
async function openWhatsAppOrder(){
  const cart = getCart();
  if(cart.length === 0){ alert("Корзина пустая"); return; }
  const cfg = await loadJSON("js/config.json");
  const lines = ["🧵 Новый заказ из Shveiny Market KZ:"];
  cart.forEach((it, i)=> lines.push(`${i+1}. ${it.title} — ${it.qty} ${it.unit || ''}${it.color?(' — '+it.color):''} — ${ (Number(it.price)*Number(it.qty)).toLocaleString() } ₸`));
  lines.push("");
  lines.push("📍 " + (cfg.address||""));
  lines.push("🕒 " + (cfg.hours||""));
  const text = encodeURIComponent(lines.join("\n"));
  const wa = (cfg && cfg.socials && cfg.socials.whatsapp) ? cfg.socials.whatsapp : "https://wa.me/";
  const openLink = wa.includes("wa.me") ? wa + "?text=" + text : wa;
  window.open(openLink, "_blank");
}

// update mini-cart price values when panel opened
document.addEventListener("click", (e)=>{
  if(e.target && e.target.id === "floating-cart-btn"){ setTimeout(()=>updateMiniTotal(), 50); }
});

// when cart changes, if mini-cart is open, update totals live
window.addEventListener("storage", (e)=>{ if(e.key === CART_KEY){ const panel = qs("#mini-cart"); if(panel) updateMiniTotal(); updateFloatingCount(); } });

// render products on category pages
async function loadCategory(cat){
  const data = await loadJSON("../js/data.json");
  const container = qs("#products");
  if(!container) return;
  container.innerHTML = "";
  const list = data[cat] || [];
  if(list.length===0){ container.innerHTML = "<p>Пока нет товаров в этой категории.</p>"; return; }
  list.forEach(prod=>{
    const el = document.createElement("div"); el.className = "product";
    const stepAttr = prod.step ? `step="${prod.step}"` : "";
    const minAttr = prod.min ? `min="${prod.min}"` : "min='1'";
    const unit = prod.unit ? prod.unit : "";
    el.innerHTML = `<img src="${prod.image || '../images/placeholder.jpg'}" alt="">
      <h3>${prod.title}</h3>
      <div class="price"><strong>${prod.price.toLocaleString()} ₸</strong></div>
      <div class="controls">
        <label>Цвет:
          <select class="color-select">
            <option value="">Выберите</option>
            <option>Белый</option><option>Чёрный</option><option>Красный</option><option>Свой цвет</option>
          </select>
        </label>
        <input class="custom-color" placeholder="Введите цвет" style="display:none;padding:6px;border-radius:8px;border:1px solid #ddd;margin-left:8px">
      </div>
      <div class="controls" style="margin-top:8px">
        <div class="counter">
          <button class="dec btn">−</button>
          <input type="number" class="qty" value="${prod.min || 1}" ${stepAttr} ${minAttr} />
          <button class="inc btn">+</button>
          <div class="unit-label" style="margin-left:8px;font-weight:600">${unit}</div>
        </div>
        <button class="btn primary add-to-cart">Добавить в корзину</button>
      </div>
      <div class="added-count" style="font-size:13px;color:#666;margin-top:6px"></div>`;
    el.querySelector(".color-select").addEventListener("change", e=>{ const val=e.target.value; const custom=el.querySelector(".custom-color"); if(val==="Свой цвет") custom.style.display="inline-block"; else custom.style.display="none"; });
    const dec = el.querySelector(".dec"), inc = el.querySelector(".inc"), qty = el.querySelector(".qty");
    const stepVal = Number(qty.getAttribute('step') || 1);
    dec.addEventListener("click", ()=>{ let v = Number(qty.value) - stepVal; if(v < (Number(qty.getAttribute('min')||1))) v = Number(qty.getAttribute('min')||1); qty.value = formatQty(v, stepVal); });
    inc.addEventListener("click", ()=>{ let v = Number(qty.value) + stepVal; qty.value = formatQty(v, stepVal); });
    qty.addEventListener("input", ()=>{ let v = Number(qty.value); if(isNaN(v)||v<=0) v = Number(qty.getAttribute('min')||1); qty.value = formatQty(v, stepVal); });

    el.querySelector(".add-to-cart").addEventListener("click", ()=>{ let color = el.querySelector(".color-select").value; if(color==="Свой цвет") color = el.querySelector(".custom-color").value || "Свой"; let quantity = Number(el.querySelector(".qty").value) || 0; if(quantity<=0){ alert("Укажите количество"); return; } if(stepVal >= 1) quantity = Math.round(quantity); const item = {id: prod.id, title: prod.title, price: prod.price, color: color, qty: quantity, unit: prod.unit || ""}; addToCart(item); el.querySelector(".added-count").textContent = "В корзине добавлено: " + quantity + (prod.unit?(" "+prod.unit):""); el.querySelector(".color-select").value=""; el.querySelector(".custom-color").style.display="none"; el.querySelector(".qty").value = prod.min || 1; updateMiniTotal(); });

    container.appendChild(el);
  });
}

function formatQty(val, step){ if(!step) return String(Math.round(val)); if(step >= 1) return String(Math.max(1,Math.round(val))); const precision = (step.toString().split('.')[1] || '').length; return Number(Number(Math.round(val/step)*step).toFixed(precision)).toString(); }

window.addEventListener("load", init);
// =======================
// 🧺 Плавающая корзина
// =======================
(function() {
  const CART_KEY = 'floating_cart';
  const cartButton = document.createElement('div');
  cartButton.id = 'floating-cart-btn';
  cartButton.innerHTML = '🧺<span id="cart-count">0</span>';
  document.body.appendChild(cartButton);

  const cartPanel = document.createElement('div');
  cartPanel.id = 'cart-panel';
  cartPanel.innerHTML = `
    <div class="cart-header">
      <h3>Корзина</h3>
      <button id="close-cart">✖</button>
    </div>
    <div id="cart-items"></div>
    <div class="cart-footer">
      <button id="clear-cart">Очистить</button>
      <button id="checkout">Оформить</button>
    </div>
  `;
  document.body.appendChild(cartPanel);

  // =======================
  // 🛒 Функции корзины
  // =======================
  let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    document.getElementById('cart-count').textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
  }

  function renderCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    if (cart.length === 0) {
      container.innerHTML = '<p>Корзина пуста</p>';
      return;
    }
    cart.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div>${item.name}</div>
        <div>
          <button class="decrease" data-id="${item.id}">−</button>
          <span>${item.quantity}</span>
          <button class="increase" data-id="${item.id}">+</button>
        </div>
        <div>${item.price * item.quantity} ₸</div>
        <button class="remove" data-id="${item.id}">🗑</button>
      `;
      container.appendChild(el);
    });
  }

  function addToCart(id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ id, name, price: parseFloat(price), quantity: 1 });
    }
    saveCart();
  }

  // =======================
  // 🧩 Обработчики
  // =======================
  document.body.addEventListener('click', e => {
    if (e.target.classList.contains('add-to-cart')) {
      const btn = e.target;
      addToCart(btn.dataset.id, btn.dataset.name, btn.dataset.price);
    }
    if (e.target.id === 'floating-cart-btn') {
      cartPanel.classList.toggle('open');
      renderCart();
    }
    if (e.target.id === 'close-cart') cartPanel.classList.remove('open');
    if (e.target.id === 'clear-cart') { cart = []; saveCart(); renderCart(); }
    if (e.target.id === 'checkout') {
      const phone = ''; // 📱 укажи номер WhatsApp здесь
      const orderText = cart.map(i => `${i.name} — ${i.quantity} x ${i.price}₸ = ${i.quantity * i.price}₸`).join('\n');
      if (phone) {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent('Заказ:\n' + orderText)}`;
        window.open(url, '_blank');
      } else {
        alert('Ваш заказ:\n' + orderText);
      }
    }
    if (e.target.classList.contains('increase')) {
      const id = e.target.dataset.id;
      const item = cart.find(i => i.id === id);
      item.quantity++;
      saveCart();
      renderCart();
    }
    if (e.target.classList.contains('decrease')) {
      const id = e.target.dataset.id;
      const item = cart.find(i => i.id === id);
      if (item.quantity > 1) item.quantity--;
      saveCart();
      renderCart();
    }
    if (e.target.classList.contains('remove')) {
      cart = cart.filter(i => i.id !== e.target.dataset.id);
      saveCart();
      renderCart();
    }
  });

  updateCartCount();
})();

// =======================
// ⬆️ Кнопка "Вверх"
// =======================
(function() {
  const btn = document.createElement('div');
  btn.id = 'to-top';
  btn.innerHTML = '⬆';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 200 ? 'flex' : 'none';
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// =======================
// 🏷️ Логотип / Название = ссылка на главную
// =======================
(function() {
  const selectors = ['.site-title', '.logo', '.brand', '.navbar-brand', 'header h1', 'h1.site-title'];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (!el.querySelector('a')) {
        const link = document.createElement('a');
        link.href = 'index.html';
        link.innerHTML = el.innerHTML;
        el.innerHTML = '';
        el.appendChild(link);
      }
    });
  });
})();
