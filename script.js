// =========================
// FILE: script.js
// =========================

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

// BLOCK file://
if (window.location.protocol === "file:") {

    document.body.innerHTML = `
        <div style="padding:20px;font-family:Arial;">
            <h2>Firebase cannot run on file://</h2>
            <p>Use GitHub Pages or Live Server.</p>
        </div>
    `;

    throw new Error("file:// blocked");
}

let cart = {};

// =========================
// AUTH
// =========================
onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const userInfo =
        document.getElementById("userInfo");

    const userName =
        document.getElementById("userName");

    userInfo.style.display = "block";

    userName.textContent =
        user.email;
});

// =========================
// ADD TO CART
// =========================
function addToCart(productId, price) {

    const input =
        document.getElementById(
            "input-" + productId
        );

    if (!input) return;

    let qty = parseInt(input.value);

    if (isNaN(qty) || qty < 1) {
        qty = 1;
    }

    if (!cart[productId]) {

        cart[productId] = {
            price,
            qty:0
        };
    }

    cart[productId].qty += qty;

    updateCartUI();
}

// =========================
// UPDATE CART
// =========================
function updateCartUI() {

    const cartItems =
        document.getElementById("cart-items");

    const totalEl =
        document.getElementById("total");

    cartItems.innerHTML = "";

    let total = 0;

    for (const id in cart) {

        const item = cart[id];

        const subtotal =
            item.price * item.qty;

        total += subtotal;

        // UPDATE COUNTER
        const qtyEl =
            document.getElementById(
                "qty-" + id
            );

        if (qtyEl) {
            qtyEl.textContent =
                item.qty;
        }

        // CART ITEM
        const div =
            document.createElement("div");

        div.className = "cart-item";

        div.innerHTML = `
            <strong>${id}</strong><br>
            Qty: ${item.qty}<br>
            Subtotal: NT$${subtotal}
        `;

        cartItems.appendChild(div);
    }

    totalEl.textContent = total;
}

// =========================
// CHECKOUT
// =========================
async function checkout() {

    if (!auth.currentUser) {
        alert("Please wait for login.");
        return;
    }

    if (Object.keys(cart).length === 0) {
        alert("Cart is empty.");
        return;
    }

    try {

        let total = 0;

        for (const id in cart) {

            total +=
                cart[id].price *
                cart[id].qty;
        }

        await addDoc(
            collection(db, "orders"),
            {
                user:
                    auth.currentUser.email,

                items:
                    structuredClone(cart),

                total,

                createdAt:
                    serverTimestamp()
            }
        );

        alert("Order placed!");

        cart = {};

        updateCartUI();

    } catch (error) {

        console.error(error);

        alert(
            "Checkout failed."
        );
    }
}

// =========================
// LOGOUT
// =========================
async function logout() {

    try {

        await signOut(auth);

        window.location.href =
            "login.html";

    } catch (error) {

        console.error(error);

        alert("Logout failed.");
    }
}

// =========================
// EVENTS
// =========================

// ADD BUTTONS
document
.querySelectorAll(".add-btn")
.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            const id =
                button.dataset.id;

            const price =
                Number(button.dataset.price);

            addToCart(id, price);
        }
    );
});

// CHECKOUT BUTTON
document
.getElementById("checkoutBtn")
.addEventListener(
    "click",
    checkout
);

// LOGOUT BUTTON
document
.getElementById("logoutBtn")
.addEventListener(
    "click",
    logout
);
