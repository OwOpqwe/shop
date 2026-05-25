if (window.location.protocol === "file:") {
    document.body.innerHTML = `
        <h2>❌ Use Live Server or GitHub Pages</h2>
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

// ================= AUTH =================
onAuthStateChanged(auth, (user) => {

    const userInfo = document.getElementById("userInfo");
    const userName = document.getElementById("userName");

    if (user) {
        if (userInfo) userInfo.style.display = "block";
        if (userName) userName.textContent = user.email;
    } else {
        window.location.href = "login.html";
    }
});

// ================= ADD TO CART =================
window.addToCartWithInput = function (id, price) {

    const input = document.getElementById("input-" + id);
    if (!input) return;

    let qty = parseInt(input.value);
    if (!qty || qty < 1) qty = 1;

    if (!cart[id]) {
        cart[id] = { price, qty: 0 };
    }

    cart[id].qty += qty;

    const qtyEl = document.getElementById("qty-" + id);
    if (qtyEl) qtyEl.textContent = cart[id].qty;

    updateCart();
};

// ================= CART =================
function updateCart() {

    const cartDiv = document.getElementById("cart-items");
    const totalEl = document.getElementById("total");

    if (!cartDiv || !totalEl) return;

    let total = 0;
    cartDiv.innerHTML = "";

    for (let id in cart) {
        const item = cart[id];
        total += item.price * item.qty;

        cartDiv.innerHTML += `
            <div>${id} x ${item.qty} = NT$${item.price * item.qty}</div>
        `;
    }

    totalEl.textContent = total;
}

// ================= CHECKOUT =================
window.checkout = async function () {

    if (!auth.currentUser) {
        alert("Auth not ready.");
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

        await addDoc(collection(db, "orders"), {
            user: auth.currentUser.email,
            items: structuredClone(cart),
            total,
            createdAt: serverTimestamp()
        });

        alert("Order placed!");

        cart = {};
        updateCart();

    } catch (err) {
        console.error(err);
        alert("Checkout failed.");
    }
};

// ================= LOGOUT =================
window.logout = async function () {
    await signOut(auth);
    window.location.href = "login.html";
};
