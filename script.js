
/* =========================
   IMPORTS
========================= */
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
    getDocs,
    deleteDoc,
    doc,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

/* =========================
   STATE
========================= */
let cart = {};
let currentUser = null;

const bundles = {
    "Bundle Pack": {
        "Dr Pepper": 1,
        "Chicken Noodle Snack": 1
    }
};

/* =========================
   AUTH STATE
========================= */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    document.getElementById('userName').textContent =
        user.displayName || user.email;

    document.getElementById('userInfo').style.display = 'block';

    document.getElementById('customerName').value =
        user.displayName || user.email;

    await renderOrderHistory();
});

/* =========================
   LOGOUT
========================= */
window.logout = async function () {
    if (!confirm('Logout?')) return;

    await signOut(auth);
    window.location.href = 'login.html';
};

/* =========================
   CART FUNCTIONS
========================= */
window.addToCartWithInput = function (name, price) {

    const input = document.getElementById('input-' + name);
    const qty = parseInt(input.value);

    if (!qty || qty < 1) {
        alert('Invalid quantity');
        return;
    }

    if (!cart[name]) {
        cart[name] = { price, quantity: qty };
    } else {
        cart[name].quantity += qty;
    }

    input.value = 1;
    updateCart();
};

window.removeItem = function (name) {

    if (!cart[name]) return;

    cart[name].quantity--;

    if (cart[name].quantity <= 0) {
        delete cart[name];
    }

    updateCart();
};

/* =========================
   UPDATE CART UI
========================= */
function updateCart() {

    const cartDiv = document.getElementById('cart-items');
    cartDiv.innerHTML = '';

    let total = 0;

    for (let item in cart) {

        const entry = cart[item];
        total += entry.price * entry.quantity;

        const div = document.createElement('div');
        div.className = 'cart-item';

        let html = `
            <div><strong>${item} x${entry.quantity}</strong></div>
            <div style="color:#666;margin-top:5px;">
                NT$${entry.price} × ${entry.quantity}
            </div>
        `;

        if (bundles[item]) {
            html += `<div class="bundle-sub">`;

            for (let sub in bundles[item]) {
                html += `
                    <div>${sub} x${bundles[item][sub] * entry.quantity}</div>
                `;
            }

            html += `</div>`;
        }

        html += `
            <div style="margin-top:8px;font-weight:bold;color:green;">
                NT$${entry.price * entry.quantity}
            </div>

            <button class="remove-btn" onclick="removeItem('${item}')">
                Remove 1
            </button>
        `;

        div.innerHTML = html;
        cartDiv.appendChild(div);
    }

    if (total === 0) {
        cartDiv.innerHTML = `<div class="empty-cart">Cart empty</div>`;
    }

    document.getElementById('total').textContent = total;

    document.getElementById('qty-Dr Pepper').textContent =
        cart['Dr Pepper'] ? cart['Dr Pepper'].quantity : 0;

    document.getElementById('qty-Chicken Noodle Snack').textContent =
        cart['Chicken Noodle Snack'] ? cart['Chicken Noodle Snack'].quantity : 0;

    document.getElementById('qty-Bundle Pack').textContent =
        cart['Bundle Pack'] ? cart['Bundle Pack'].quantity : 0;

    document.getElementById('qty-Chocolate').textContent =
        cart['Chocolate'] ? cart['Chocolate'].quantity : 0;
}

/* =========================
   CHECKOUT (FIXED TIMESTAMP)
========================= */
window.checkout = async function () {

    const name = document.getElementById('customerName').value.trim();
    const total = Number(document.getElementById('total').textContent);

    if (!name || total <= 0) {
        alert('Invalid order');
        return;
    }

    await addDoc(collection(db, "orders"), {
        customer: name,
        userEmail: currentUser.email,
        items: cart,
        total: total,
        createdAt: serverTimestamp()
    });

    alert("Order placed!");

    cart = {};
    updateCart();

    await renderOrderHistory();
};

/* =========================
   ORDER HISTORY (NEWEST FIRST FIX)
========================= */
async function renderOrderHistory() {

    const box = document.getElementById('history-list');
    box.innerHTML = 'Loading...';

    const q = query(
        collection(db, "orders"),
        where("userEmail", "==", currentUser.email),
        orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
        box.innerHTML = 'No orders yet';
        return;
    }

    box.innerHTML = '';

    snap.forEach(d => {

        const order = { id: d.id, ...d.data() };

        const div = document.createElement('div');
        div.className = 'cart-item';

        const time = order.createdAt?.toDate
            ? order.createdAt.toDate().toLocaleString()
            : "Just now";

        let html = `
            <div style="font-weight:bold;color:#007bff;">
                📦 Order
            </div>

            <div style="color:#666;">
                ${time}
            </div>

            <div style="margin-top:10px;">
        `;

        for (let item in order.items) {
            html += `<div>${item} x${order.items[item].quantity}</div>`;
        }

        html += `
            </div>

            <div style="margin-top:10px;font-weight:bold;color:green;">
                Total: NT$${order.total}
            </div>

            <button class="remove-btn"
                style="margin-top:10px;"
                onclick="deleteOrder('${order.id}')">
                Delete Order
            </button>
        `;

        div.innerHTML = html;
        box.appendChild(div);
    });
}

/* =========================
   TOGGLE HISTORY
========================= */
window.toggleOrderHistory = function () {

    const box = document.getElementById('order-history');
    box.style.display =
        box.style.display === 'block' ? 'none' : 'block';
};

/* =========================
   DELETE ORDER
========================= */
window.deleteOrder = async function (id) {

    if (!confirm('Delete this order?')) return;

    await deleteDoc(doc(db, "orders", id));

    await renderOrderHistory();
};

/* =========================
   INIT
========================= */
updateCart();
