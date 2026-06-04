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
    serverTimestamp,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

/* =========================
   STATE
========================= */
let cart = {};
let currentUser = null;

/* =========================
   AUTH (SAFE)
========================= */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = user.displayName || user.email;

    const panel = document.getElementById('userInfo');
    if (panel) panel.style.display = 'block';

    const customer = document.getElementById('customerName');
    if (customer) customer.value = user.displayName || user.email;

    await renderOrderHistory();
});

/* =========================
   ADD ITEM
========================= */
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

/* =========================
   REMOVE ITEM
========================= */
window.removeItem = function (name) {

    if (!cart[name]) return;

    cart[name].quantity--;

    if (cart[name].quantity <= 0) {
        delete cart[name];
    }

    updateCart();
};

/* =========================
   CART UPDATE
========================= */
function updateCart() {

    const box = document.getElementById('cart-items');
    if (!box) return;

    box.innerHTML = '';

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

        box.appendChild(div);
    }

    if (total === 0) {
        box.innerHTML = `<div class="empty-cart">Cart empty</div>`;
    }

    const totalEl = document.getElementById('total');
    if (totalEl) totalEl.textContent = total;

    updateQtyUI();
}

/* =========================
   QTY DISPLAY
========================= */
function updateQtyUI() {

    const map = {
        "dr-pepper": "Dr Pepper",
        "chicken": "Chicken Noodle Snack",
        "bundle": "Bundle Pack",
        "chocolate": "Chocolate"
    };

    for (let id in map) {
        const el = document.getElementById('qty-' + id);
        if (el) el.textContent = cart[map[id]]?.quantity || 0;
    }
}

/* =========================
   CHECKOUT
========================= */
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

/* =========================
   ORDER HISTORY (WITH DELETE)
========================= */
async function renderOrderHistory() {

    const box = document.getElementById('history-list');
    if (!box || !currentUser) return;

    box.innerHTML = '';

    try {

        const q = query(
            collection(db, "orders"),
            where("userEmail", "==", currentUser.email),
            orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        snap.forEach(docSnap => {

            const o = docSnap.data();
            const id = docSnap.id;

            const time = o.createdAt?.toDate
                ? o.createdAt.toDate().toLocaleString()
                : "Unknown time";

            const items = o.items
                ? Object.entries(o.items)
                    .map(([name, data]) => `${name} x${data.quantity}`)
                    .join(", ")
                : "No items";

            const div = document.createElement('div');
            div.className = 'cart-item';

            div.innerHTML = `
                <div><strong>${o.customer}</strong></div>
                <div style="font-size:12px;color:#aaa;">${time}</div>
                <div>${items}</div>
                <div>Total: NT$${o.total}</div>

                <button onclick="deleteOrder('${id}')"
                    style="
                        margin-top:8px;
                        background:#e53935;
                        color:white;
                        border:none;
                        padding:6px 10px;
                        border-radius:8px;
                        cursor:pointer;
                    ">
                    Delete
                </button>
            `;

            box.appendChild(div);
        });

        if (snap.empty) {
            box.innerHTML = `<div class="empty-cart">No orders yet</div>`;
        }

    } catch (err) {
        console.error(err);
        box.innerHTML = `<div class="empty-cart">Failed to load history</div>`;
    }
}

/* =========================
   DELETE ORDER
========================= */
window.deleteOrder = async function (orderId) {

    if (!confirm("Delete this order?")) return;

    try {
        await deleteDoc(doc(db, "orders", orderId));
        await renderOrderHistory();
    } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete order.");
    }
};

/* =========================
   TOGGLE HISTORY
========================= */
window.toggleOrderHistory = function () {

    const box = document.getElementById('order-history');
    if (!box) return;

    box.style.display =
        box.style.display === 'block' ? 'none' : 'block';
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
