import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Prevent file:// usage
if (window.location.protocol === "file:") {
    document.body.innerHTML = "<h2>Use Live Server or GitHub Pages</h2>";
    throw new Error("file protocol blocked");
}

let cart = {};

// ================= AUTH CHECK =================
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
window.addToCartWithInput = function (productId, price) {

    const input = document.getElementById("input-" + productId);
    if (!input) return;

    let qty = parseInt(input.value);
    if (!qty || qty < 1) qty = 1;

    if (!cart[productId]) {
        cart[productId] = { price, qty: 0 };
    }

    cart[productId].qty += qty;

    const qtyDisplay = document.getElementById("qty-" + productId);
    if (qtyDisplay) {
        qtyDisplay.textContent = cart[productId].qty;
    }

    renderCart();
};

// ================= CART RENDER =================
function renderCart() {

    const cartBox = document.getElementById("cart-items");
    const totalBox = document.getElementById("total");

    if (!cartBox || !totalBox) return;

    let total = 0;
    cartBox.innerHTML = "";

    for (let id in cart) {
        const item = cart[id];
        const subtotal = item.price * item.qty;
        total += subtotal;

        cartBox.innerHTML += `
            <div>${id} x ${item.qty} = NT$${subtotal}</div>
        `;
    }

    totalBox.textContent = total;
}

// ================= CHECKOUT =================
window.checkout = async function () {

    if (!auth.currentUser) {
        alert("Please wait for login to load.");
        return;
    }

    if (Object.keys(cart).length === 0) {
        alert("Cart is empty!");
        return;
    }

    try {
        let total = 0;
        let summary = "";

        for (let id in cart) {
            const item = cart[id];
            total += item.price * item.qty;
            summary += `${id} x ${item.qty}\n`;
        }

        await addDoc(collection(db, "orders"), {
            user: auth.currentUser.email,
            items: structuredClone(cart),
            total,
            createdAt: serverTimestamp()
        });

        alert("Order placed successfully!");

        cart = {};
        renderCart();

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
