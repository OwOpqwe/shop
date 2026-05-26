import { auth, db } from './firebase.js';
import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let cart = {};
let currentUser = null;

// ---------------- AUTH SAFE ----------------
onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    document.getElementById("userInfo").style.display = "block";
    document.getElementById("userName").textContent =
        user.displayName || user.email;

    document.getElementById("customerName").value =
        user.displayName || user.email;

    renderHistory();
});

// ---------------- CART CORE ----------------
window.addToCart = function (id, price, label) {

    const qty = parseInt(document.getElementById("input-" + id).value);

    if (!qty || qty < 1) return;

    if (!cart[id]) {
        cart[id] = { price, qty: 0, label };
    }

    cart[id].qty += qty;

    updateCart();
};

window.addBundle = function () {

    const qty = parseInt(document.getElementById("input-bundle").value);

    if (!qty || qty < 1) return;

    const items = ["dr-pepper", "chicken"];

    items.forEach(id => {
        if (!cart[id]) cart[id] = { price: 0, qty: 0, label: id };
        cart[id].qty += qty;
    });

    updateCart();
};

window.removeItem = function (id) {
    if (!cart[id]) return;

    cart[id].qty--;

    if (cart[id].qty <= 0) delete cart[id];

    updateCart();
};

// ---------------- SAFE UI UPDATE ----------------
function updateCart() {

    const box = document.getElementById("cart-items");
    box.innerHTML = "";

    let total = 0;

    Object.keys(cart).forEach(id => {

        const item = cart[id];

        total += item.price * item.qty;

        const div = document.createElement("div");
        div.innerHTML = `
            <strong>${item.label} x${item.qty}</strong>
            <button onclick="removeItem('${id}')">-</button>
        `;

        box.appendChild(div);
    });

    document.getElementById("total").textContent = total;

    ["dr-pepper", "chicken", "bundle", "chocolate"].forEach(id => {
        const el = document.getElementById("qty-" + id);
        if (el) el.textContent = cart[id]?.qty || 0;
    });
}

// ---------------- CHECKOUT (FIXED CLEAN FLOW) ----------------
window.checkout = async function () {

    const name = document.getElementById("customerName").value;
    const total = document.getElementById("total").textContent;

    if (!name || total <= 0) return;

    await addDoc(collection(db, "orders"), {
        customer: name,
        userEmail: currentUser.email,
        items: cart,
        total,
        createdAt: new Date().toISOString()
    });

    // FormSubmit (NO redirect)
    const form = document.getElementById("orderForm");

    document.getElementById("customerField").value = name;
    document.getElementById("orderField").value = JSON.stringify(cart);
    document.getElementById("totalField").value = total;
    document.getElementById("emailSubject").value = "New Order";

    fetch(form.action, {
        method: "POST",
        body: new FormData(form)
    });

    cart = {};
    updateCart();

    renderHistory();

    alert("Order placed!");
};

// ---------------- HISTORY SAFE ----------------
async function renderHistory() {

    if (!currentUser) return;

    const box = document.getElementById("history-list");

    const q = query(
        collection(db, "orders"),
        where("userEmail", "==", currentUser.email)
    );

    const snap = await getDocs(q);

    box.innerHTML = "";

    snap.forEach(doc => {

        const d = doc.data();

        const div = document.createElement("div");
        div.innerHTML = `
            <div>Order</div>
            <div>${d.total}</div>
        `;

        box.appendChild(div);
    });
}

// ---------------- TOGGLE ----------------
window.toggleOrderHistory = function () {
    const box = document.getElementById("order-history");
    box.style.display = box.style.display === "block" ? "none" : "block";
};

// ---------------- LOGOUT ----------------
window.logout = async function () {
    await signOut(auth);
    window.location.href = "login.html";
};

// INIT
updateCart();
