
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

/* =========================
   AUTH
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
   CART
========================= */
window.addToCartWithInput = function (name, price) {

    const input = document.getElementById('input-' + name.replaceAll(' ', ''));
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

window.removeItem = function (name) {

    if (!cart[name]) return;

    cart[name].quantity--;

    if (cart[name].quantity <= 0) delete cart[name];

    updateCart();
};

/* =========================
   UPDATE CART
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

        div.innerHTML = `
            <div><strong>${item} x${entry.quantity}</strong></div>
            <div>NT$${entry.price * entry.quantity}</div>
            <button onclick="removeItem('${item}')">Remove</button>
        `;

        cartDiv.appendChild(div);
    }

    if (total === 0) {
        cartDiv.innerHTML = "Cart empty";
    }

    document.getElementById('total').textContent = total;

    const map = {
        "Dr Pepper": "DrPepper",
        "Chicken Noodle Snack": "ChickenNoodleSnack",
        "Bundle Pack": "BundlePack",
        "Chocolate": "Chocolate"
    };

    for (let key in map) {
        const el = document.getElementById('qty-' + map[key]);
        if (el) el.textContent = cart[key]?.quantity || 0;
    }
}

/* =========================
   CHECKOUT
========================= */
window.checkout = async function () {

    const name = document.getElementById('customerName').value;
    const total = Number(document.getElementById('total').textContent);

    if (!name || total <= 0) return;

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

/* =========================
   ORDER HISTORY (NEWEST FIRST)
========================= */
async function renderOrderHistory() {

    const box = document.getElementById('history-list');
    box.innerHTML = '';

    const q = query(
        collection(db, "orders"),
        where("userEmail", "==", currentUser.email),
        orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    snap.forEach(d => {

        const order = d.data();

        const div = document.createElement('div');
        div.className = 'cart-item';

        div.innerHTML = `
            <div>${order.customer}</div>
            <div>Total: NT$${order.total}</div>
        `;

        box.appendChild(div);
    });
}

/* =========================
   TOGGLE HISTORY
========================= */
window.toggleOrderHistory = function () {
    const box = document.getElementById('order-history');
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
};

/* =========================
   LOGOUT
========================= */
window.logout = async function () {
    await signOut(auth);
    window.location.href = 'login.html';
};

/* =========================
   INIT
========================= */
updateCart();
