import { auth, db } from "./firebase.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let cart = {};
let currentUser = null;

// =========================
// AUTH STATE
// =========================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;

        document.getElementById("userInfo").style.display = "block";
        document.getElementById("userName").textContent = user.email;

        document.getElementById("customerName").value = user.email;
    } else {
        window.location.href = "login.html";
    }
});

// =========================
// ADD TO CART
// =========================
window.addToCartWithInput = function (name, price) {

    const input = document.getElementById("input-" + name);
    let qty = parseInt(input.value);

    if (!qty || qty < 1) qty = 1;

    if (!cart[name]) {
        cart[name] = { price, qty: 0 };
    }

    cart[name].qty += qty;

    document.getElementById("qty-" + name).textContent = cart[name].qty;

    updateCart();
};

// =========================
// UPDATE CART UI
// =========================
function updateCart() {

    const cartDiv = document.getElementById("cart-items");
    const totalEl = document.getElementById("total");

    cartDiv.innerHTML = "";

    let total = 0;

    for (let item in cart) {

        const { price, qty } = cart[item];

        total += price * qty;

        cartDiv.innerHTML += `
            <div style="margin-bottom:10px;">
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

    if (!currentUser) return;

    let orderText = "";
    let total = 0;

    for (let item in cart) {
        const { price, qty } = cart[item];

        orderText += `${item} x ${qty}\n`;
        total += price * qty;
    }

    if (Object.keys(cart).length === 0) {
        alert("Cart is empty!");
        return;
    }

    // Save to Firestore
    await addDoc(collection(db, "orders"), {
        user: currentUser.email,
        items: cart,
        total: total,
        date: new Date()
    });

    // Email form
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
// ORDER HISTORY
// =========================
window.toggleOrderHistory = function () {
    const el = document.getElementById("order-history");

    if (el.style.display === "none") {
        el.style.display = "block";
    } else {
        el.style.display = "none";
    }
};
