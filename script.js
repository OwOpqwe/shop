
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
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let cart = {};
let currentUser = null;

/* AUTH */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    const name = document.getElementById('userName');
    if (name) name.textContent = user.displayName || user.email;

    const customer = document.getElementById('customerName');
    if (customer) customer.value = user.displayName || user.email;

    await renderOrderHistory();
});

/* ADD ITEM */
window.addItem = function (id, name, price) {

    const input = document.getElementById('input-' + id);
    if (!input) return;

    const qty = parseInt(input.value);
    if (!qty || qty < 1) return;

    if (!cart[name]) {
        cart[name] = { price, quantity: qty };
    } else {
        cart[name].quantity += qty;
    }

    input.value = 1;
    updateCart();
};

/* REMOVE */
window.removeItem = function (name) {

    if (!cart[name]) return;

    cart[name].quantity--;

    if (cart[name].quantity <= 0) {
        delete cart[name];
    }

    updateCart();
};

/* UPDATE CART */
function updateCart() {

    const cartDiv = document.getElementById('cart-items');
    cartDiv.innerHTML = '';

    let total = 0;

    for (let item in cart) {

        const c = cart[item];
        total += c.price * c.quantity;

        const div = document.createElement('div');
        div.className = 'cart-item';

        div.innerHTML = `
            <div><strong>${item} x${c.quantity}</strong></div>
            <div>NT$${c.price * c.quantity}</div>
            <button onclick="removeItem('${item}')">Remove</button>
        `;

        cartDiv.appendChild(div);
    }

    if (total === 0) {
        cartDiv.innerHTML = `<div class="empty-cart">Cart empty</div>`;
    }

    const totalEl = document.getElementById('total');
    if (totalEl) totalEl.textContent = total;

    updateQtyUI();
}

/* UPDATE SMALL COUNTERS */
function updateQtyUI() {

    const map = {
        "dr-pepper": "Dr Pepper",
        "chicken": "Chicken Noodle Snack",
        "bundle": "Bundle Pack",
        "chocolate": "Chocolate"
    };

    for (let key in map) {
        const el = document.getElementById('qty-' + key);
        if (el) el.textContent = cart[map[key]]?.quantity || 0;
    }
}

/* CHECKOUT */
window.checkout = async function () {

    const name = document.getElementById('customerName')?.value;
    const total = Number(document.getElementById('total')?.textContent);

    if (!name || total <= 0 || !currentUser) return;

    await addDoc(collection(db, "orders"), {
        customer: name,
        userEmail: currentUser.email,
        items: cart,
        total,
        createdAt: serverTimestamp()
    });

    cart = {};
    updateCart();
    await renderOrderHistory();
};

/* HISTORY */
async function renderOrderHistory() {

    const box = document.getElementById('history-list');
    if (!box || !currentUser) return;

    box.innerHTML = '';

    const q = query(
        collection(db, "orders"),
        where("userEmail", "==", currentUser.email),
        orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    snap.forEach(doc => {

        const o = doc.data();

        const div = document.createElement('div');
        div.className = 'cart-item';

        div.innerHTML = `
            <div><strong>${o.customer}</strong></div>
            <div>Total: NT$${o.total}</div>
        `;

        box.appendChild(div);
    });
}

/* TOGGLE */
window.toggleOrderHistory = function () {

    const box = document.getElementById('order-history');
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
};

/* LOGOUT */
window.logout = async function () {
    await signOut(auth);
    window.location.href = 'login.html';
};

/* INIT */
updateCart();
