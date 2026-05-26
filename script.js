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

const bundles = {
    "Bundle Pack": {
        "Dr Pepper": 1,
        "Chicken Noodle Snack": 1
    }
};

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

    await renderOrderHistory();
});

// ---------------- LOGOUT ----------------
window.logout = async function () {
    if (!confirm('Logout?')) return;
    await signOut(auth);
    window.location.href = 'login.html';
};

// ---------------- CART ----------------
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

// ---------------- CART UPDATE (UNCHANGED) ----------------
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
            html += `<div>`;
            for (let sub in bundles[item]) {
                html += `<div>${sub} x${bundles[item][sub] * entry.quantity}</div>`;
            }
            html += `</div>`;
        }

        html += `
            <div style="margin-top:8px;font-weight:bold;color:green;">
                NT$${entry.price * entry.quantity}
            </div>

            <button onclick="removeItem('${item}')">
                Remove 1
            </button>
        `;

        div.innerHTML = html;
        cartDiv.appendChild(div);
    }

    if (total === 0) {
        cartDiv.innerHTML = `<div>Cart empty</div>`;
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

// ---------------- CHECKOUT (FIXED SAFE VERSION) ----------------
window.checkout = async function () {

    const name = document.getElementById('customerName').value.trim();
    const total = document.getElementById('total').textContent;

    if (!name || total <= 0) {
        alert('Invalid order');
        return;
    }

    try {

        // FIREBASE SAVE
        await addDoc(collection(db, "orders"), {
            customer: name,
            userEmail: currentUser.email,
            items: structuredClone(cart),
            total,
            createdAt: new Date().toISOString()
        });

        // FORMSUBMIT EMAIL
        document.getElementById("customerNameField").value = name;
        document.getElementById("orderTotal").value = "NT$" + total;
        document.getElementById("orderDetails").value = JSON.stringify(cart);
        document.getElementById("emailSubject").value = "New Order from Snack Store";

        document.getElementById("orderForm").submit();

        // RESET
        cart = {};
        updateCart();
        await renderOrderHistory();

        alert("Order placed!");

    } catch (err) {
        console.error(err);
        alert("Checkout failed");
    }
};

// ---------------- HISTORY ----------------
window.toggleOrderHistory = function () {

    const box = document.getElementById('order-history');
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
};

// ---------------- DELETE ORDER ----------------
window.deleteOrder = async function (id) {

    if (!confirm('Delete this order?')) return;

    await deleteDoc(doc(db, "orders", id));

    await renderOrderHistory();
};

// ---------------- ORDER HISTORY ----------------
async function renderOrderHistory() {

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

    let orders = [];

    snap.forEach(d => {
        orders.push({ id: d.id, ...d.data() });
    });

    orders.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    box.innerHTML = '';

    orders.forEach(order => {

        const div = document.createElement('div');
        div.className = 'cart-item';

        let html = `
            <div>📦 Order</div>
            <div>${new Date(order.createdAt).toLocaleString()}</div>
        `;

        for (let item in order.items) {
            html += `<div>${item} x${order.items[item].quantity}</div>`;
        }

        html += `
            <div>Total: NT$${order.total}</div>
            <button onclick="deleteOrder('${order.id}')">
                Delete Order
            </button>
        `;

        div.innerHTML = html;
        box.appendChild(div);
    });
}

// INIT
updateCart();
