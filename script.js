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
    orderBy
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// CART
var cart = {};

// BUNDLES
var bundles = {
    "Bundle Pack": {
        "Dr Pepper": 1,
        "Chicken Noodle Snack": 1
    }
};

// CURRENT USER
var currentUser = null;

// CHECK LOGIN
onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = 'login.html';

        return;
    }

    currentUser = user;

    // SHOW USER INFO
    document.getElementById('userName').textContent =
        user.displayName || user.email;

    document.getElementById('userInfo').style.display =
        'block';

    document.getElementById('customerName').value =
        user.displayName || user.email;

    // LOAD HISTORY
    await renderOrderHistory();
});

// LOGOUT
window.logout = async function() {

    const confirmLogout = confirm(
        'Are you sure you want to logout?'
    );

    if (!confirmLogout) {
        return;
    }

    try {

        await signOut(auth);

        window.location.href = 'login.html';

    } catch(error) {

        alert(error.message);
    }
};

// ADD TO CART
window.addToCartWithInput = function(name, price) {

    const inputElement =
        document.getElementById('input-' + name);

    const quantity =
        parseInt(inputElement.value);

    if (!quantity || quantity < 1) {

        alert('Please enter a valid quantity!');

        return;
    }

    if (!cart[name]) {

        cart[name] = {
            price: price,
            quantity: quantity
        };

    } else {

        cart[name].quantity += quantity;
    }

    inputElement.value = 1;

    updateCart();
};

// REMOVE ITEM
window.removeItem = function(name) {

    if (cart[name]) {

        cart[name].quantity--;

        if (cart[name].quantity <= 0) {

            delete cart[name];
        }

        updateCart();
    }
};

// UPDATE CART
function updateCart() {

    const cartDiv =
        document.getElementById('cart-items');

    cartDiv.innerHTML = '';

    let total = 0;

    for (let item in cart) {

        const entry = cart[item];

        total += entry.price * entry.quantity;

        const div = document.createElement('div');

        div.className = 'cart-item';

        let html = '';

        html += `
            <div>
                <strong>${item} x${entry.quantity}</strong>
            </div>
        `;

        html += `
            <div style="color:#666;margin-top:5px">
                NT$${entry.price} × ${entry.quantity}
            </div>
        `;

        // BUNDLE DETAILS
        if (bundles[item]) {

            html += `<div class="bundle-sub">`;

            for (let subItem in bundles[item]) {

                html += `
                    <div>
                        ${subItem} x
                        ${bundles[item][subItem] * entry.quantity}
                    </div>
                `;
            }

            html += `</div>`;
        }

        html += `
            <div style="
            font-weight:bold;
            color:green;
            margin-top:8px;
            ">
                NT$${entry.price * entry.quantity}
            </div>
        `;

        html += `
            <button
            class="remove-btn"
            onclick="removeItem('${item}')">
                Remove 1
            </button>
        `;

        div.innerHTML = html;

        cartDiv.appendChild(div);
    }

    // EMPTY CART
    if (total === 0) {

        cartDiv.innerHTML = `
            <div class="empty-cart">
                Your cart is empty
            </div>
        `;
    }

    // TOTAL
    document.getElementById('total').innerText =
        total;

    // ITEM COUNTS
    document.getElementById('qty-Dr Pepper').textContent =
        cart['Dr Pepper']
            ? cart['Dr Pepper'].quantity
            : 0;

    document.getElementById('qty-Chicken Noodle Snack').textContent =
        cart['Chicken Noodle Snack']
            ? cart['Chicken Noodle Snack'].quantity
            : 0;

    document.getElementById('qty-Bundle Pack').textContent =
        cart['Bundle Pack']
            ? cart['Bundle Pack'].quantity
            : 0;

    document.getElementById('qty-Chocolate').textContent =
        cart['Chocolate']
            ? cart['Chocolate'].quantity
            : 0;
}

// CHECKOUT
window.checkout = async function() {

    const customerName =
        document.getElementById('customerName')
        .value
        .trim();

    const total =
        document.getElementById('total')
        .textContent;

    if (!customerName) {

        alert('Please enter your name');

        return;
    }

    if (parseFloat(total) <= 0) {

        alert('Your cart is empty!');

        return;
    }

    try {

        // PLAY SOUND
        const audio = new Audio(
            'https://cdn.freesound.org/previews/678/678271_3797507-lq.mp3'
        );

        audio.play();

        // SAVE TO FIRESTORE
        await addDoc(
            collection(db, "orders"),
            {
                customer: customerName,
                userEmail: currentUser.email,
                items: cart,
                total: total,
                createdAt: new Date().toISOString()
            }
        );

        // EMAIL DETAILS
        let orderDetails =
            'ORDER DETAILS:\n\n';

        for (let item in cart) {

            const entry = cart[item];

            orderDetails +=
                `${item} x${entry.quantity} = NT$${entry.price * entry.quantity}\n`;

            if (bundles[item]) {

                for (let subItem in bundles[item]) {

                    orderDetails +=
                        `  - ${subItem} x${bundles[item][subItem] * entry.quantity}\n`;
                }
            }
        }

        orderDetails +=
            '\n⚠️ CASH ONLY';

        // SEND EMAIL FORM
        document.getElementById('emailSubject').value =
            `New Order from ${customerName} - NT$${total}`;

        document.getElementById('customerNameField').value =
            customerName;

        document.getElementById('orderDetails').value =
            orderDetails;

        document.getElementById('orderTotal').value =
            `NT$${total}`;

        document.getElementById('orderForm').submit();

        // SUCCESS
        alert(
            `Order sent successfully! 🎉\n\n` +
            `Thank you, ${customerName}!\n\n` +
            `Total: NT$${total}`
        );

        // CLEAR CART
        cart = {};

        updateCart();

        // REFRESH HISTORY
        await renderOrderHistory();

    } catch(error) {

        alert(error.message);
    }
};

// TOGGLE HISTORY
window.toggleOrderHistory = function() {

    const historyDiv =
        document.getElementById('order-history');

    if (historyDiv.style.display === 'none') {

        historyDiv.style.display = 'block';

    } else {

        historyDiv.style.display = 'none';
    }
};

// LOAD HISTORY FROM FIREBASE
async function renderOrderHistory() {

    const historyList =
        document.getElementById('history-list');

    historyList.innerHTML =
        'Loading orders...';

    try {

        const q = query(
            collection(db, "orders"),
            where("userEmail", "==", currentUser.email),
            orderBy("createdAt", "desc")
        );

        const querySnapshot =
            await getDocs(q);

        if (querySnapshot.empty) {

            historyList.innerHTML =
                'No previous orders';

            return;
        }

        historyList.innerHTML = '';

        let orderNumber = 1;

        querySnapshot.forEach((doc) => {

            const order = doc.data();

            const div =
                document.createElement('div');

            div.style.background = '#f5f5f5';
            div.style.padding = '15px';
            div.style.borderRadius = '10px';
            div.style.marginBottom = '15px';

            let html = '';

            html += `
                <div style="
                font-weight:bold;
                font-size:1.1em;
                ">
                    Order #${orderNumber}
                </div>
            `;

            html += `
                <div style="
                color:#666;
                margin-top:5px;
                ">
                    ${new Date(order.createdAt).toLocaleString()}
                </div>
            `;

            html += `
                <div style="margin-top:10px;">
            `;

            for (let item in order.items) {

                html += `
                    <div>
                        ${item} x${order.items[item].quantity}
                    </div>
                `;
            }

            html += `</div>`;

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

            historyList.appendChild(div);

            orderNumber++;
        });

    } catch(error) {

        historyList.innerHTML =
            'Failed to load orders';

        console.error(error);
    }
}

// INITIALIZE
updateCart();
