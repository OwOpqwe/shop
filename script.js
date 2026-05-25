import { auth, db } from "./firebase.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

let cart = {};
let currentUser = null;

// =========================
// AUTH CHECK
// =========================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;

        const userInfo = document.getElementById("userInfo");
        const userName = document.getElementById("userName");

        if (userInfo) userInfo.style.display = "block";
        if (userName) userName.textContent = user.email;

        const nameField = document.getElementById("customerNameField");
        if (nameField) nameField.value = user.email;

    } else {
        window.location.href = "login.html";
    }
});

// =========================
// ADD TO CART
// =========================
window.addToCartWithInput = function (name, price) {

    const input = document.getElementById("input-" + name);
    if (!input) return;

    let qty = parseInt(input.value);
    if (!qty || qty < 1) qty = 1;

    if (!cart[name]) {
        cart[name] = { price, qty: 0 };
    }

    cart[name].qty += qty;

    const qtyEl = document.getElementById("qty-" + name);
    if (qtyEl) qtyEl.textContent = cart[name].qty;

    updateCart();
};

// =========================
// CART UI
// =========================
function updateCart() {

    const cartDiv = document.getElementById("cart-items");
    const totalEl = document.getElementById("total");

    if (!cartDiv || !totalEl) return;

    cartDiv.innerHTML = "";

    let total = 0;

    for (let item in cart) {
        const { price, qty } = cart[item];

        total += price * qty;

        cartDiv.innerHTML += `
            <div>
                ${item} x ${qty} = NT$${price * qty}
            </div>
        `;
    }

    totalEl.textContent = total;
}

// =========================
// CHECKOUT
// =========================
window.checkout = async function () {

    if (!currentUser) return alert("Not logged in");

    if (Object.keys(cart).length === 0) {
        return alert("Cart is empty!");
    }

    let orderText = "";
    let total = 0;

    for (let item in cart) {
        const { price, qty } = cart[item];

        orderText += `${item} x ${qty}\n`;
        total += price * qty;
    }

    // Save to Firestore
    await addDoc(collection(db, "orders"), {
        user: currentUser.email,
        items: cart,
        total: total,
        date: serverTimestamp()
    });

    // Email form fields (MAKE SURE THESE IDS MATCH YOUR HTML)
    document.getElementById("emailSubject").value = "New Order";
    document.getElementById("customerNameField").value = currentUser.email;
    document.getElementById("orderDetails").value = orderText;
    document.getElementById("orderTotal").value = total;

    document.getElementById("orderForm").submit();

    alert("Order placed!");

    cart = {};
    updateCart();
};

// =========================
// LOGOUT
// =========================
window.logout = async function () {
    await signOut(auth);
    window.location.href = "login.html";
};

// =========================
// ORDER HISTORY TOGGLE
// =========================
window.toggleOrderHistory = function () {
    const el = document.getElementById("order-history");
    if (!el) return;

    el.style.display = (el.style.display === "none") ? "block" : "none";
};
