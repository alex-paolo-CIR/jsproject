const cart = new Map();
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

function formatPrice(value) {
  return currencyFormatter.format(value).replace(/\s/g, " ");
}

function getCartElements() {
  return {
    items: document.querySelector("[data-cart-items]"),
    count: document.querySelector("[data-cart-count]"),
    subtotal: document.querySelector("[data-cart-subtotal]"),
    shipping: document.querySelector("[data-cart-shipping]"),
    total: document.querySelector("[data-cart-total]"),
    clear: document.querySelector("[data-cart-clear]"),
    checkout: document.querySelector("[data-cart-checkout]"),
    status: document.querySelector("[data-cart-status]")
  };
}

function getProductData(card) {
  const size = card.querySelector("[data-product-size]")?.value || "OS";

  return {
    id: card.dataset.productId,
    name: card.dataset.productName,
    price: Number(card.dataset.productPrice || 0),
    type: card.dataset.productType || "merch",
    size
  };
}

function getCartKey(product) {
  return `${product.id}:${product.size}`;
}

function getCartTotals() {
  const lines = Array.from(cart.values());
  const count = lines.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 90 ? 0 : 6;

  return {
    count,
    subtotal,
    shipping,
    total: subtotal + shipping
  };
}

function setCartStatus(message) {
  const { status } = getCartElements();

  if (!status) {
    return;
  }

  status.textContent = message;
}

function renderCart() {
  const elements = getCartElements();

  if (!elements.items || !elements.count || !elements.subtotal || !elements.shipping || !elements.total || !elements.checkout) {
    return;
  }

  const lines = Array.from(cart.values());
  const totals = getCartTotals();

  elements.count.textContent = String(totals.count);
  elements.subtotal.textContent = formatPrice(totals.subtotal);
  elements.shipping.textContent = totals.subtotal === 0 ? formatPrice(0) : totals.shipping === 0 ? "offerte" : formatPrice(totals.shipping);
  elements.total.textContent = formatPrice(totals.total);
  elements.checkout.disabled = totals.count === 0;

  if (lines.length === 0) {
    elements.items.innerHTML = '<p class="cart-empty">panier vide</p>';
    return;
  }

  elements.items.innerHTML = lines.map((item) => `
    <article class="cart-item" data-cart-key="${item.key}">
      <div>
        <h3>${item.name}</h3>
        <p>${item.size} / ${formatPrice(item.price)}</p>
      </div>
      <div class="cart-quantity" aria-label="Quantite ${item.name}">
        <button type="button" data-cart-decrease aria-label="Retirer un ${item.name}">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-cart-increase aria-label="Ajouter un ${item.name}">+</button>
      </div>
    </article>
  `).join("");
}

function addToCart(product) {
  const key = getCartKey(product);
  const existing = cart.get(key);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.set(key, {
      ...product,
      key,
      quantity: 1
    });
  }

  renderCart();
  setCartStatus(`${product.name} ajoute au panier.`);
}

function changeQuantity(key, delta) {
  const item = cart.get(key);

  if (!item) {
    return;
  }

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart.delete(key);
  }

  renderCart();
  setCartStatus("");
}

function initProductCards() {
  document.querySelectorAll("[data-product-card]").forEach((card) => {
    const button = card.querySelector("[data-add-to-cart]");

    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const product = getProductData(card);

      addToCart(product);
      button.textContent = "ajoute";

      window.setTimeout(() => {
        button.textContent = "ajouter";
      }, 900);
    });
  });
}

function initCartControls() {
  const elements = getCartElements();

  elements.items?.addEventListener("click", (event) => {
    const item = event.target.closest("[data-cart-key]");

    if (!item) {
      return;
    }

    if (event.target.closest("[data-cart-increase]")) {
      changeQuantity(item.dataset.cartKey, 1);
    } else if (event.target.closest("[data-cart-decrease]")) {
      changeQuantity(item.dataset.cartKey, -1);
    }
  });

  elements.clear?.addEventListener("click", () => {
    cart.clear();
    renderCart();
    setCartStatus("");
  });

  elements.checkout?.addEventListener("click", () => {
    if (elements.checkout.disabled) {
      return;
    }

    setCartStatus("Panier pret. Checkout a brancher quand le drop est reel.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initProductCards();
  initCartControls();
  renderCart();
});
