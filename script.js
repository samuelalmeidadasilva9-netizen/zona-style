let cart = JSON.parse(localStorage.getItem("zonaStyleCart") || "[]");

function saveCart(){
  localStorage.setItem("zonaStyleCart", JSON.stringify(cart));
  renderCart();
}

function addToCart(name, price){
  const existing = cart.find(i => i.name === name);
  if(existing) existing.qty += 1;
  else cart.push({name, price, qty:1});
  saveCart();
  showToast("Peça adicionada à sacola!");
}

function removeItem(name){
  cart = cart.filter(i => i.name !== name);
  saveCart();
}

function renderCart(){
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent = total.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const box = document.getElementById("cart-items");
  if(!cart.length){
    box.innerHTML = '<p class="empty">Sua sacola está vazia.</p>';
    return;
  }
  box.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div>
        <b>${i.name}</b><br>
        <small>Qtd: ${i.qty}</small>
      </div>
      <div>
        <span>${(i.price*i.qty).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</span><br>
        <button onclick="removeItem('${i.name.replace(/'/g,"\\'")}')">remover</button>
      </div>
    </div>
  `).join("");
}

function toggleCart(){
  document.getElementById("cart").classList.toggle("open");
  document.getElementById("cart-overlay").classList.toggle("open");
}

function toggleMenu(){
  document.getElementById("nav").classList.toggle("open");
}

function checkoutWhatsApp(){
  if(!cart.length){ showToast("Sua sacola está vazia."); return; }
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const lines = cart.map(i => `• ${i.name} — ${i.qty}x R$ ${i.price.toFixed(2).replace(".",",")}`);
  const msg = `Oi Zona Style! Quero fazer este pedido:\n\n${lines.join("\n")}\n\nTotal: ${total.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}\n\nQuero confirmar tamanho, estoque e entrega.`;
  window.open("https://wa.me/5524999023408?text="+encodeURIComponent(msg), "_blank");
}

function showToast(text){
  let t = document.querySelector(".toast");
  if(!t){
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1800);
}

document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("nav").classList.remove("open")));
renderCart();

function goToCheckout(){
  if(!cart.length){ showToast("Sua sacola está vazia."); return; }
  localStorage.setItem("zonaStyleCart", JSON.stringify(cart));
  window.location.href = "checkout.html";
}
