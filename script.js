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
// AUTH
// =========================
onAuthStateChanged(auth, (user) => {
    const userInfo = document.getElementById("userInfo");
    const userName = document.getElementById("userName");

    if (user) {
        currentUser = user;

        if (userInfo) userInfo.style.display = "block";
        if (userName) userName.textContent = user.email;

        const nameField = document.getElementById("customerNameField");
        if (nameField) nameField.value = user.email;

    } else {
        window.location.href = "login.html";
    }
});

// =========================
// ADD TO CART (SAFE VERSION)
// =========================
window.addToCartWithInput = function (productId, price) {

    const input = document.getElementById("input-" + productId);
    if (!input) return;

    let qty = parseInt(input.value);
    if (isNaN(qty) || qty < 1) qty = 1;

    if (!cart[productId]) {
        cart[productId] = {
            price: price,
            qty: 0
        };
    }

    cart[productId].qty += qty;

    const qtyEl = document.getElementById("qty-" + productId);
    if (qtyEl) qtyEl.textContent = cart[productId].qty;

    updateCart();
};

// =========================
// CART UPDATE
// =========================
function updateCart() {

    const cartDiv = document.getElementById("cart-items");
    const totalEl = document.getElementById("total");

    if (!cartDiv || !totalEl) return;

    cartDiv.innerHTML = "";

    let total = 0;

    for (let id in cart) {
        const item = cart[id];
        const itemTotal = item.price * item.qty;

        total += itemTotal;

        cartDiv.innerHTML += `
            <div>
                ${id} x ${item.qty} = NT$${itemTotal}
            </div>
        `;
    }

    totalEl.textContent = total;
}

// =========================
// CHECKOUT (SAFE + ERROR HANDLED)
// =========================
window.checkout = async function () {

    if (!currentUser) {
        alert("You are not logged in.");
        return;
    }

    if (Object.keys(cart).length === 0) {
        alert("Cart is empty!");
        return;
    }

    try {
        let orderText = "";
        let total = 0;

        for (let id in cart) {
            const item = cart[id];

            orderText += `${id} x ${item.qty}\n`;
            total += item.price * item.qty;
        }

        await addDoc(collection(db, "orders"), {
            user: currentUser.email,
            items: cart,
            total: total,
            createdAt: serverTimestamp()
        });

        // SAFE FORM FILL
        const subject = document.getElementById("emailSubject");
        const name = document.getElementById("customerNameField");
        const details = document.getElementById("orderDetails");
        const totalField = document.getElementById("orderTotal");
        const form = document.getElementById("orderForm");

        if (subject) subject.value = "New Order";
        if (name) name.value = currentUser.email;
        if (details) details.value = orderText;
        if (totalField) totalField.value = total;

        if (form) form.submit();

        alert("Order placed successfully!");

        cart = {};
        updateCart();

    } catch (err) {
        console.error(err);
        alert("Checkout failed. Check console.");
    }
};

// =========================
// LOGOUT
// =========================
window.logout = async function () {
    await signOut(auth);
    window.location.href = "login.html";
};

// =========================
// TOGGLE HISTORY
// =========================
window.toggleOrderHistory = function () {
    const el = document.getElementById("order-history");
    if (!el) return;

    el.style.display = (el.style.display === "none") ? "block" : "none";
};
