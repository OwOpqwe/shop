import { auth, db } from './firebase.js';

import {
    onAuthStateChanged,
    getIdTokenResult,
    signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// ========================================
// CART
// ========================================

let cart = {};

let currentUser = null;


// ========================================
// CHECK LOGIN
// ========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    // Show user's name
    const nameEl = document.getElementById('userName');

    if (nameEl) {
        nameEl.textContent =
            user.displayName || user.email;
    }

    // Show user information
    const panel =
        document.getElementById('userInfo');

    if (panel) {
        panel.style.display = 'block';
    }

    // Fill customer name
    const customer =
        document.getElementById('customerName');

    if (customer) {
        customer.value =
            user.displayName || user.email;
    }


    // ========================================
    // CHECK ADMIN PERMISSION
    // ========================================

    try {

        const tokenResult =
            await getIdTokenResult(user, true);

        const isAdmin =
            tokenResult.claims.admin === true;

        const adminMenu =
            document.getElementById('adminDashboardMenu');

        if (adminMenu) {

            if (isAdmin) {
                adminMenu.style.display = 'block';
            } else {
                adminMenu.style.display = 'none';
            }

        }

    } catch (error) {

        console.error(
            'Admin check failed:',
            error
        );

    }


    // Load order history
    await renderOrderHistory();

});


// ========================================
// ADD TO CART
// ========================================

window.addToCart = function (
    name,
    price,
    quantityId
) {

    const quantityInput =
        document.getElementById(quantityId);

    if (!quantityInput) return;

    const quantity =
        parseInt(quantityInput.value);

    if (isNaN(quantity) || quantity < 1) {
        alert('Please enter a valid quantity.');
        return;
    }

    if (!cart[name]) {

        cart[name] = {
            price: price,
            quantity: 0
        };

    }

    cart[name].quantity += quantity;

    quantityInput.value = 1;

    renderCart();

};


// ========================================
// RENDER CART
// ========================================

function renderCart() {

    const cartItems =
        document.getElementById('cart-items');

    const cartTotal =
        document.getElementById('cart-total');

    if (!cartItems || !cartTotal) return;


    cartItems.innerHTML = '';

    let total = 0;


    const itemNames =
        Object.keys(cart);


    if (itemNames.length === 0) {

        cartItems.textContent =
            'Your cart is empty.';

        cartTotal.textContent = '0';

        return;

    }


    itemNames.forEach((name) => {

        const item = cart[name];

        const itemTotal =
            item.price * item.quantity;

        total += itemTotal;


        const div =
            document.createElement('div');

        div.className = 'cart-item';


        div.innerHTML = `
            <span>
                ${name} ×${item.quantity}
            </span>

            <span>
                NT$${itemTotal}
            </span>

            <button
                onclick="removeFromCart('${name}')">
                Remove
            </button>
        `;


        cartItems.appendChild(div);

    });


    cartTotal.textContent = total;

}


// ========================================
// REMOVE FROM CART
// ========================================

window.removeFromCart = function (name) {

    delete cart[name];

    renderCart();

};


// ========================================
// CHECKOUT
// ========================================

window.checkout = async function () {

    if (!currentUser) {

        alert(
            'Please log in before placing an order.'
        );

        return;

    }


    const itemNames =
        Object.keys(cart);


    if (itemNames.length === 0) {

        alert('Your cart is empty.');

        return;

    }


    const customerNameInput =
        document.getElementById('customerName');


    const customerName =
        customerNameInput?.value ||
        currentUser.displayName ||
        currentUser.email;


    let total = 0;


    itemNames.forEach((name) => {

        total +=
            cart[name].price *
            cart[name].quantity;

    });


    try {

        await addDoc(
            collection(db, 'orders'),
            {
                customer: customerName,

                userId: currentUser.uid,

                userEmail: currentUser.email,

                items: cart,

                total: total,

                createdAt: serverTimestamp()
            }
        );


        alert(
            'Order placed successfully!'
        );


        cart = {};

        renderCart();

        await renderOrderHistory();


    } catch (error) {

        console.error(
            'Checkout failed:',
            error
        );

        alert(
            'Failed to place order.\n\n' +
            error.message
        );

    }

};


// ========================================
// ORDER HISTORY
// ========================================

async function renderOrderHistory() {

    const historyList =
        document.getElementById('history-list');

    if (!historyList || !currentUser) {
        return;
    }


    historyList.innerHTML =
        'Loading order history...';


    try {

        const q = query(

            collection(db, 'orders'),

            where(
                'userId',
                '==',
                currentUser.uid
            ),

            orderBy(
                'createdAt',
                'desc'
            )

        );


        const snapshot =
            await getDocs(q);


        historyList.innerHTML = '';


        if (snapshot.empty) {

            historyList.innerHTML =
                '<p>No orders yet.</p>';

            return;

        }


        snapshot.forEach((orderDoc) => {

            const order =
                orderDoc.data();

            const orderId =
                orderDoc.id;


            const time =
                order.createdAt?.toDate
                    ? order.createdAt
                        .toDate()
                        .toLocaleString()
                    : 'Unknown time';


            let itemsHTML =
                '<div class="history-items">';


            if (order.items) {

                for (
                    const [name, data]
                    of Object.entries(order.items)
                ) {

                    itemsHTML += `
                        <div>
                            ${name}
                            ×${data.quantity}
                            — NT$${data.price * data.quantity}
                        </div>
                    `;

                }

            }


            itemsHTML +=
                '</div>';


            const div =
                document.createElement('div');

            div.className =
                'history-order';


            div.innerHTML = `

                <h3>
                    ${order.customer || 'Unknown Customer'}
                </h3>

                <p>
                    Order time:
                    ${time}
                </p>

                ${itemsHTML}

                <strong>
                    Total:
                    NT$${order.total || 0}
                </strong>

                <br><br>

                <button
                    onclick="deleteOrder('${orderId}')">
                    Delete Order
                </button>

            `;


            historyList.appendChild(div);

        });


    } catch (error) {

        console.error(
            'Failed to load order history:',
            error
        );


        historyList.innerHTML = `
            <p style="color:red;">
                Failed to load order history.
                <br><br>
                ${error.message}
            </p>
        `;

    }

}


// ========================================
// TOGGLE ORDER HISTORY
// ========================================

window.toggleOrderHistory = function () {

    const history =
        document.getElementById('order-history');

    if (!history) return;


    if (history.style.display === 'none') {

        history.style.display = 'block';

        renderOrderHistory();

    } else {

        history.style.display = 'none';

    }

};


// ========================================
// DELETE CUSTOMER ORDER
// ========================================

window.deleteOrder = async function (
    orderId
) {

    if (
        !confirm(
            'Are you sure you want to delete this order?'
        )
    ) {
        return;
    }


    try {

        await deleteDoc(
            doc(db, 'orders', orderId)
        );


        await renderOrderHistory();


    } catch (error) {

        console.error(
            'Delete order failed:',
            error
        );

        alert(
            'Failed to delete order.'
        );

    }

};


// ========================================
// ADMIN DASHBOARD
// ========================================

window.goToAdminDashboard = async function () {

    if (!currentUser) {

        window.location.href =
            'login.html';

        return;

    }


    try {

        const tokenResult =
            await getIdTokenResult(
                currentUser,
                true
            );


        if (
            tokenResult.claims.admin !== true
        ) {

            alert(
                'You do not have administrator permission.'
            );

            return;

        }


        window.location.href =
            'admin.html';


    } catch (error) {

        console.error(
            'Admin verification failed:',
            error
        );


        alert(
            'Could not verify administrator permission.'
        );

    }

};


// ========================================
// LOGOUT
// ========================================

window.logout = async function () {

    try {

        await signOut(auth);

        window.location.href =
            'login.html';

    } catch (error) {

        console.error(
            'Logout failed:',
            error
        );

        alert(
            'Failed to logout.'
        );

    }

};

