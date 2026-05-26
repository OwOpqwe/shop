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
    doc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let cart = {};
let currentUser = null;

// ---------------- AUTH ----------------
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

    if (currentUser) {
        await renderOrderHistory();
    }
});

// ---------------- LOGOUT ----------------
window.logout = async function () {
    await signOut(auth);
    window.location.href = 'login.html';
};

// ---------------- CART ----------------
window.addToCartWithInput = function (name, price) {

    const safeId = name.replace(/ /g, '-');
    const input = document.getElementById('input-' + safeId);
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

    if (cart[name].quantity <= 0) {
        delete cart[name];
    }

    updateCart();
};

// ---------------- CART UPDATE ----------------
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

    document.getElementById('total').textContent = total;

    const setQty = (id, item) => {
        const el = document.getElementById(id);
        if (el) el.textContent = cart[item] ? cart[item].quantity : 0;
    };

    setQty('qty-Dr-Pepper', 'Dr Pepper');
    setQty('qty-Chicken-Noodle-Snack', 'Chicken Noodle Snack');
    setQty('qty-Bundle-Pack', 'Bundle Pack');
    setQty('qty-Chocolate', 'Chocolate');
}

// ---------------- CHECKOUT (NO REDIRECT) ----------------
window.checkout = async function () {

    const name = document.getElementById('customerName').value.trim();
    const total = document.getElementById('total').textContent;

    if (!name || total <= 0) {
        alert('Invalid order');
        return;
    }

    await addDoc(collection(db, "orders"), {
        customer: name,
        userEmail: currentUser.email,
        items: structuredClone(cart),
        total,
        createdAt: new Date().toISOString()
    });

    // FORMSUBMIT (NO REDIRECT)
    const form = document.getElementById("orderForm");

    document.getElementById("customerNameField").value = name;
    document.getElementById("orderTotal").value = "NT$" + total;
    document.getElementById("orderDetails").value = JSON.stringify(cart);
    document.getElementById("emailSubject").value = "New Order";

    fetch(form.action, {
        method: "POST",
        body: new FormData(form)
    });

    cart = {};
    updateCart();
    await renderOrderHistory();

    alert("Order placed!");
};

// ---------------- HISTORY ----------------
window.toggleOrderHistory = function () {

    const box = document.getElementById('order-history');
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
};

// ---------------- ORDER HISTORY ----------------
async function renderOrderHistory() {

    if (!currentUser) return;

    const box = document.getElementById('history-list');
    box.innerHTML = 'Loading...';

    const q = query(
        collection(db, "orders"),
        where("userEmail", "==", currentUser.email)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
        box.innerHTML = 'No orders yet';
        return;
    }

    box.innerHTML = '';

    snap.forEach(d => {

        const order = d.data();

        const div = document.createElement('div');
        div.className = 'cart-item';

        let html = `
            <div>📦 Order</div>
            <div>${new Date(order.createdAt).toLocaleString()}</div>
        `;

        for (let item in order.items) {
            html += `<div>${item} x${order.items[item].quantity}</div>`;
        }

        html += `<div>Total: NT$${order.total}</div>`;

        div.innerHTML = html;
        box.appendChild(div);
    });
}

// INIT
updateCart();
