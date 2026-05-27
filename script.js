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

// ---------------- GLOBALS ----------------
let cart = {};
let currentUser = null;

// ---------------- AUTH ----------------
onAuthStateChanged(auth, async (user) => {

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

    await renderHistory();
});

// ---------------- LOGOUT ----------------
window.logout = async function () {

    await signOut(auth);

    window.location.href = "login.html";
};

// ---------------- ADD ITEM ----------------
window.addItem = function (id, label, price) {

    const input = document.getElementById("input-" + id);

    if (!input) return;

    const qty = parseInt(input.value);

    if (!qty || qty < 1) {
        alert("Invalid quantity");
        return;
    }

    if (!cart[id]) {

        cart[id] = {
            label,
            price,
            qty: 0
        };
    }

    cart[id].qty += qty;

    input.value = 1;

    updateCart();
};

// ---------------- REMOVE ITEM ----------------
window.removeItem = function (id) {

    if (!cart[id]) return;

    cart[id].qty--;

    if (cart[id].qty <= 0) {
        delete cart[id];
    }

    updateCart();
};

// ---------------- UPDATE CART ----------------
function updateCart() {

    const cartDiv = document.getElementById("cart-items");

    cartDiv.innerHTML = "";

    let total = 0;

    for (let id in cart) {

        const item = cart[id];

        total += item.price * item.qty;

        const div = document.createElement("div");

        div.className = "cart-item";

        div.innerHTML = `
            <div>
                <strong>${item.label} x${item.qty}</strong>
            </div>

            <div style="
                margin-top:8px;
                color:#666;
            ">
                NT$${item.price} × ${item.qty}
            </div>

            <div style="
                margin-top:8px;
                font-weight:bold;
                color:green;
            ">
                NT$${item.price * item.qty}
            </div>

            <button
            class="remove-btn"
            onclick="removeItem('${id}')">
                Remove 1
            </button>
        `;

        cartDiv.appendChild(div);
    }

    // EMPTY CART
    if (Object.keys(cart).length === 0) {

        cartDiv.innerHTML = `
            <div class="empty-cart">
                Cart empty
            </div>
        `;
    }

    // TOTAL
    document.getElementById("total").textContent = total;

    // SAFE QUANTITY UPDATE
    const setQty = (id) => {

        const el = document.getElementById("qty-" + id);

        if (el) {
            el.textContent = cart[id]?.qty || 0;
        }
    };

    setQty("dr-pepper");
    setQty("chicken");
    setQty("bundle");
    setQty("chocolate");
}

// ---------------- CHECKOUT ----------------
window.checkout = async function () {

    const name =
        document.getElementById("customerName").value.trim();

    const total =
        document.getElementById("total").textContent;

    if (!name || total <= 0) {

        alert("Invalid order");

        return;
    }

    try {

        // SAVE TO FIREBASE
        await addDoc(collection(db, "orders"), {

            customer: name,

            userEmail: currentUser.email,

            items: cart,

            total,

            createdAt: new Date().toISOString()
        });

        // SEND EMAIL USING FORMSUBMIT
        const form = document.getElementById("orderForm");

        document.getElementById("customerField").value = name;

        document.getElementById("orderField").value =
            JSON.stringify(cart, null, 2);

        document.getElementById("totalField").value =
            "NT$" + total;

        document.getElementById("emailSubject").value =
            "New Snack Store Order";

        await fetch(form.action, {

            method: "POST",

            body: new FormData(form)
        });

        // RESET CART
        cart = {};

        updateCart();

        await renderHistory();

        alert("Order placed!");

    } catch (err) {

        console.error(err);

        alert("Checkout failed");
    }
};

// ---------------- TOGGLE HISTORY ----------------
window.toggleOrderHistory = function () {

    const box = document.getElementById("order-history");

    box.style.display =
        box.style.display === "block"
            ? "none"
            : "block";
};

// ---------------- ORDER HISTORY ----------------
async function renderHistory() {

    if (!currentUser) return;

    const box =
        document.getElementById("history-list");

    box.innerHTML = "Loading...";

    try {

        const q = query(

            collection(db, "orders"),

            where("userEmail", "==", currentUser.email)
        );

        const snap = await getDocs(q);

        // NO ORDERS
        if (snap.empty) {

            box.innerHTML = `
                <div class="empty-cart">
                    No orders yet
                </div>
            `;

            return;
        }

        box.innerHTML = "";

        snap.forEach((docSnap) => {

            const order = docSnap.data();

            const div =
                document.createElement("div");

            div.className = "cart-item";

            let html = `
                <div style="
                    font-weight:bold;
                    color:#007bff;
                    margin-bottom:6px;
                ">
                    📦 Order
                </div>

                <div style="
                    color:#666;
                    margin-bottom:10px;
                ">
                    ${new Date(order.createdAt)
                        .toLocaleString()}
                </div>
            `;

            // ITEMS
            for (let itemId in order.items) {

                const item = order.items[itemId];

                html += `
                    <div>
                        ${item.label} x${item.qty}
                    </div>
                `;
            }

            html += `
                <div style="
                    margin-top:10px;
                    font-weight:bold;
                    color:green;
                ">
                    Total: NT$${order.total}
                </div>
            `;

            div.innerHTML = html;

            box.appendChild(div);
        });

    } catch (err) {

        console.error(err);

        box.innerHTML = `
            <div class="empty-cart">
                Failed to load history
            </div>
        `;
    }
}

// ---------------- INIT ----------------
updateCart();
