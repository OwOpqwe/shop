import {
    auth,
    db
} from './firebase.js';

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let currentUser;

let cart = {};

onAuthStateChanged(auth, async(user) => {

    if (!user) {

        location.href = 'login.html';

        return;
    }

    currentUser = user;

    document.getElementById('userName').textContent =
        user.email;

    document.getElementById('customerName').value =
        user.email;

    renderOrderHistory();
});

window.logout = async function () {

    await signOut(auth);

    location.href = 'login.html';
};

window.addToCartWithInput = function(name, price) {

    const quantity = parseInt(
        document.getElementById('input-' + name).value
    );

    if (!cart[name]) {

        cart[name] = {
            price,
            quantity
        };

    } else {

        cart[name].quantity += quantity;
    }

    updateCart();
};

function updateCart() {

    const cartItems =
        document.getElementById('cart-items');

    cartItems.innerHTML = '';

    let total = 0;

    for (let item in cart) {

        const entry = cart[item];

        total += entry.price * entry.quantity;

        const div = document.createElement('div');

        div.className = 'cart-item';

        div.innerHTML = `
            <strong>${item}</strong><br>
            Quantity: ${entry.quantity}<br>
            NT$${entry.price * entry.quantity}
            <br><br>
            <button onclick="removeItem('${item}')">
                Remove
            </button>
        `;

        cartItems.appendChild(div);
    }

    document.getElementById('total').textContent =
        total;

    document.getElementById('qty-Dr Pepper').textContent =
        cart['Dr Pepper'] ? cart['Dr Pepper'].quantity : 0;

    document.getElementById('qty-Chocolate').textContent =
        cart['Chocolate'] ? cart['Chocolate'].quantity : 0;
}

window.removeItem = function(name) {

    delete cart[name];

    updateCart();
};

window.checkout = async function () {

    const total =
        document.getElementById('total').textContent;

    if (parseFloat(total) <= 0) {

        alert('Cart empty');

        return;
    }

    try {

        await addDoc(
            collection(db, 'orders'),
            {
                userEmail: currentUser.email,
                items: cart,
                total: total,
                createdAt: new Date().toISOString()
            }
        );

        let orderDetails = '';

        for (let item in cart) {

            orderDetails +=
                `${item} x${cart[item].quantity}\n`;
        }

        await fetch(
            'https://formsubmit.co/ajax/YOUR_EMAIL@gmail.com',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.strin
