// 🚨 BLOCK file:// (THIS IS REQUIRED)
if (window.location.protocol === "file:") {
    document.body.innerHTML = `
        <div style="font-family:Arial;padding:20px;">
            <h1>❌ Firebase cannot run on file://</h1>
            <p>Please use Live Server or localhost.</p>
        </div>
    `;
    throw new Error("file:// blocked");
}

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
let authReady = false;

// =========================
// AUTH
// =========================
onAuthStateChanged(auth, (user) => {
    authReady = true;

    const userInfo = document.getElementById("userInfo");
    const userName = document.getElementById("userName");

    if (user) {
        if (userInfo) userInfo.style.display = "block";
        if (userName) userName.textContent = user.email;
    } else {
        window.location.href = "login.html";
    }
});

// =========================
// ADD TO CART
// =========================
window.addToCartWithInput = function (id, price) {

    const input = document.getElementById("input-" + id);
    if (!input) return;

    let qty = parseInt(input.value);
    if (!qty || qty < 1) qty = 1;

    if (!cart[id]) cart[id] = { price, qty: 0 };

    cart[id].qty += qty;

    const qtyEl = document.getElementById("qty-" + id);
    if (qtyEl) qtyEl.textContent = cart[id].qty;

    updateCart();
};

// =========================
// CART UPDATE
// =========================
function updateCart() {

    const cartDiv = document.getElementById("cart-items");
    const totalEl = document.getElementById("total");

    if (!cartDiv || !totalEl) return;

    let total = 0;
    cartDiv.innerHTML = "";

    for (let id in cart) {
        const item = cart[id];
        const itemTotal = item.price * item.qty;

        total += itemTotal;

        cartDiv.innerHTML += `
            <div>${id} x ${item.qty} = NT$${itemTotal}</div>
        `;
    }

    totalEl.textContent = total;
}

// =========================
// CHECKOUT
// =========================
window.checkout = async function () {

    if (!authReady || !auth.currentUser) {
        alert("Auth not ready. Please wait.");
        return;
    }

    if (Object.keys(cart).length === 0) {
        alert("Cart is empty!");
        return;
    }

    try {
        let total = 0;
        let orderText = "";

        for (let id in cart) {
            const item = cart[id];
            total += item.price * item.qty;
            orderText += `${id} x ${item.qty}\n`;
        }

        const safeCart = JSON.parse(JSON.stringify(cart));

        const docRef = await addDoc(collection(db, "orders"), {
            user: auth.currentUser.email,
            items: safeCart,
            total,
            createdAt: serverTimestamp()
        });

        if (!docRef.id) throw new Error("Firestore write failed");

        const form = document.getElementById("orderForm");

        if (form) {
            const subject = document.getElementById("emailSubject");
            const name = document.getElementById("customerNameField");
            const details = document.getElementById("orderDetails");
            const totalField = document.getElementById("orderTotal");

            if (subject) subject.value = "New Order";
            if (name) name.value = auth.currentUser.email;
            if (details) details.value = orderText;
            if (totalField) totalField.value = total;

            form.submit();
        }

        alert("Order placed!");

        cart = {};
        updateCart();

    } catch (err) {
        console.error(err);
        alert("Checkout failed.");
    }
};

// =========================
// LOGOUT
// =========================
window.logout = async function () {
    await signOut(auth);
    window.location.href = "login.html";
};
