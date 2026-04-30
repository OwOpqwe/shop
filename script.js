// ===========================
//  SNACK STORE — script.js
// ===========================

var cart = {};

var bundles = {
  "Bundle Pack": {
    "Dr Pepper": 1,
    "Chicken Noodle Snack": 1
  }
};

var products = ["Dr Pepper", "Chicken Noodle Snack", "Bundle Pack", "Chocolate"];

// Add item to cart
function addToCart(name, price) {
  var input = document.getElementById("input-" + name);
  var qty = parseInt(input.value);

  if (!qty || qty < 1) {
    alert("Please enter a valid quantity!");
    return;
  }

  if (!cart[name]) {
    cart[name] = { price: price, quantity: qty };
  } else {
    cart[name].quantity += qty;
  }

  input.value = 1;
  updateCart();
}

// Remove one unit of an item
function removeItem(name) {
  if (!cart[name]) return;

  cart[name].quantity--;
  if (cart[name].quantity === 0) {
    delete cart[name];
  }

  updateCart();
}

// Rebuild cart UI
function updateCart() {
  var container = document.getElementById("cart-items");
  container.innerHTML = "";

  var total = 0;
  var totalItems = 0;

  for (var name in cart) {
    var entry = cart[name];
    total += entry.price * entry.quantity;
    totalItems += entry.quantity;

    var div = document.createElement("div");
    div.className = "cart-item";

    // Bundle sub-items text
    var bundleHtml = "";
    if (bundles[name]) {
      var parts = [];
      for (var sub in bundles[name]) {
        parts.push(sub + " ×" + (bundles[name][sub] * entry.quantity));
      }
      bundleHtml = '<div class="ci-bundle">Includes: ' + parts.join(", ") + "</div>";
    }

    div.innerHTML =
      '<div class="ci-left">' +
        '<div class="ci-name">' + name + "</div>" +
        '<div class="ci-meta">NT$' + entry.price + " × " + entry.quantity + "</div>" +
        bundleHtml +
      "</div>" +
      '<div class="ci-right">' +
        '<span class="ci-price">NT$' + (entry.price * entry.quantity) + "</span>" +
        '<button class="rm-btn" onclick="removeItem(\'' + name + '\')" title="Remove one">−</button>' +
      "</div>";

    container.appendChild(div);
  }

  // Show empty state
  if (totalItems === 0) {
    container.innerHTML =
      '<div class="cart-empty">Nothing here yet.<br>Add something delicious!</div>';
  }

  // Update totals and badge counts
  document.getElementById("total").textContent = total;
  document.getElementById("cart-count").textContent =
    totalItems === 0 ? "0 items" : totalItems + (totalItems === 1 ? " item" : " items");

  products.forEach(function (p) {
    var el = document.getElementById("qty-" + p);
    if (el) el.textContent = cart[p] ? cart[p].quantity : 0;
  });
}

// Place order
function checkout() {
  var nameInput = document.getElementById("customerName");
  var name = nameInput.value.trim();
  var total = parseInt(document.getElementById("total").textContent);
  var successMsg = document.getElementById("success-msg");

  if (!name) {
    alert("Please enter your name before checking out!");
    nameInput.focus();
    return;
  }

  if (total === 0) {
    alert("Your cart is empty!");
    return;
  }

  // Build order summary for email
  var orderLines = "ORDER DETAILS:\n\n";
  for (var item in cart) {
    var e = cart[item];
    orderLines += item + " ×" + e.quantity + " = NT$" + e.price * e.quantity + "\n";
    if (bundles[item]) {
      for (var sub in bundles[item]) {
        orderLines += "  - " + sub + " ×" + bundles[item][sub] * e.quantity + "\n";
      }
    }
  }
  orderLines += "\nTotal: NT$" + total;
  orderLines += "\n\n⚠️ CASH ONLY — Please have exact change ready!";

  var subject = "New Order from " + name + " — NT$" + total;
  var mailto =
    "mailto:charlie2011.ting@gmail.com" +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(orderLines);

  // Show success message
  successMsg.textContent = "Order ready for " + name + " · NT$" + total + " — opening email...";
  successMsg.style.display = "block";

  // Open email client
  setTimeout(function () {
    window.location.href = mailto;

    // Clear everything
    cart = {};
    nameInput.value = "";
    updateCart();

    setTimeout(function () {
      successMsg.style.display = "none";
    }, 5000);
  }, 600);
}

// Init
updateCart();
