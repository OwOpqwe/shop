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


/* =========================
   SETTINGS
========================= */

const AI_API_URL =
    "https://csllm.vercel.app/api/chat";

let cart = {};
let currentUser = null;
let products = [];
let aiMessages = [];


/* =========================
   LOGIN
========================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    const nameEl =
        document.getElementById('userName');

    if (nameEl) {
        nameEl.textContent =
            user.displayName || user.email;
    }

    const customer =
        document.getElementById('customerName');

    if (customer) {
        customer.value =
            user.displayName || user.email;
    }

    try {

        const tokenResult =
            await getIdTokenResult(user, true);

        const isAdmin =
            tokenResult.claims.admin === true;

        const adminMenu =
            document.getElementById(
                'adminDashboardMenu'
            );

        if (adminMenu) {
            adminMenu.style.display =
                isAdmin ? 'block' : 'none';
        }

    } catch (error) {

        console.error(
            'Admin check failed:',
            error
        );
    }

    await loadProducts();
    await renderOrderHistory();
});


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

    const container =
        document.getElementById('products');

    if (!container) return;

    container.innerHTML =
        '<p>Loading products...</p>';

    try {

        const snapshot =
            await getDocs(
                collection(db, 'products')
            );

        products = [];

        snapshot.forEach((productDoc) => {

            const product =
                productDoc.data();

            products.push({
                id: productDoc.id,
                name: product.name || 'Unnamed Product',
                price: Number(product.price || 0),
                image: product.image || '',
                description: product.description || ''
            });
        });

        renderProducts();

    } catch (error) {

        console.error(
            'Failed to load products:',
            error
        );

        container.innerHTML = `
            <p style="color: red;">
                Failed to load products.
                <br><br>
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}


/* =========================
   DISPLAY PRODUCTS
========================= */

function renderProducts() {

    const container =
        document.getElementById('products');

    if (!container) return;

    container.innerHTML = '';

    if (products.length === 0) {

        container.innerHTML = `
            <p>No products are currently available.</p>
        `;

        return;
    }

    products.forEach((product) => {

        const card =
            document.createElement('div');

        card.className =
            'product-card';


        const image =
            document.createElement('img');

        image.src =
            product.image;

        image.alt =
            product.name;

        image.onerror = function() {
            this.style.display = 'none';
        };


        const title =
            document.createElement('h2');

        title.textContent =
            product.name;


        const description =
            document.createElement('p');

        description.textContent =
            product.description;


        const price =
            document.createElement('p');

        price.className =
            'price';

        price.textContent =
            'NT$' + product.price;


        const actions =
            document.createElement('div');

        actions.className =
            'product-actions';


        const quantity =
            document.createElement('input');

        quantity.type =
            'number';

        quantity.value =
            '1';

        quantity.min =
            '1';

        quantity.max =
            '99';

        quantity.setAttribute(
            'aria-label',
            'Quantity for ' + product.name
        );


        const addButton =
            document.createElement('button');

        addButton.textContent =
            'Add';

        addButton.addEventListener(
            'click',
            () => {

                addToCart(
                    product.id,
                    quantity.value
                );

                quantity.value = 1;
            }
        );


        actions.appendChild(quantity);
        actions.appendChild(addButton);

        card.appendChild(image);
        card.appendChild(title);

        if (product.description) {
            card.appendChild(description);
        }

        card.appendChild(price);
        card.appendChild(actions);

        container.appendChild(card);
    });
}


/* =========================
   CART
========================= */

function addToCart(productId, quantityValue) {

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) {
        alert('Product not found.');
        return;
    }

    const quantity =
        parseInt(quantityValue, 10);

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
    ) {
        alert('Please enter a quantity between 1 and 99.');
        return;
    }

    if (!cart[productId]) {

        cart[productId] = {
            name: product.name,
            price: product.price,
            quantity: 0
        };
    }

    cart[productId].quantity += quantity;

    renderCart();
}


function renderCart() {

    const cartItems =
        document.getElementById('cart-items');

    const cartTotal =
        document.getElementById('cart-total');

    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = '';

    let total = 0;

    const itemIds =
        Object.keys(cart);

    if (itemIds.length === 0) {

        cartItems.textContent =
            'Your cart is empty.';

        cartTotal.textContent = '0';

        return;
    }

    itemIds.forEach((id) => {

        const item = cart[id];

        const itemTotal =
            item.price * item.quantity;

        total += itemTotal;

        const div =
            document.createElement('div');

        div.className =
            'cart-item';


        const name =
            document.createElement('span');

        name.textContent =
            item.name + ' ×' + item.quantity;


        const price =
            document.createElement('span');

        price.textContent =
            'NT$' + itemTotal;


        const removeButton =
            document.createElement('button');

        removeButton.textContent =
            'Remove';

        removeButton.addEventListener(
            'click',
            () => removeFromCart(id)
        );


        div.appendChild(name);
        div.appendChild(price);
        div.appendChild(removeButton);

        cartItems.appendChild(div);
    });

    cartTotal.textContent = total;
}


function removeFromCart(productId) {

    delete cart[productId];

    renderCart();
}


/* =========================
   CHECKOUT
========================= */

window.checkout = async function() {

    if (!currentUser) {

        alert(
            'Please log in before placing an order.'
        );

        return;
    }

    const itemIds =
        Object.keys(cart);

    if (itemIds.length === 0) {

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

    const orderItems = {};

    itemIds.forEach((id) => {

        const item = cart[id];

        total +=
            item.price * item.quantity;

        orderItems[item.name] = {
            price: item.price,
            quantity: item.quantity
        };
    });


    try {

        await addDoc(
            collection(db, 'orders'),
            {
                customer: customerName,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                items: orderItems,
                total: total,
                createdAt: serverTimestamp()
            }
        );

        alert('Order placed successfully!');

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


/* =========================
   ORDER HISTORY
========================= */

async function renderOrderHistory() {

    const historyList =
        document.getElementById('history-list');

    if (!historyList || !currentUser) return;

    historyList.innerHTML =
        'Loading order history...';

    try {

        const q = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
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


            const div =
                document.createElement('div');

            div.className =
                'history-order';


            const title =
                document.createElement('h3');

            title.textContent =
                order.customer || 'Unknown Customer';


            const date =
                document.createElement('p');

            date.textContent =
                'Order time: ' + time;


            const items =
                document.createElement('div');

            items.className =
                'history-items';


            if (order.items) {

                Object.entries(order.items).forEach(
                    ([name, data]) => {

                        const item =
                            document.createElement('div');

                        item.textContent =
                            name +
                            ' ×' +
                            data.quantity +
                            ' — NT$' +
                            (
                                Number(data.price || 0) *
                                Number(data.quantity || 0)
                            );

                        items.appendChild(item);
                    }
                );
            }


            const total =
                document.createElement('strong');

            total.textContent =
                'Total: NT$' +
                Number(order.total || 0);


            const removeButton =
                document.createElement('button');

            removeButton.textContent =
                'Delete Order';

            removeButton.addEventListener(
                'click',
                () => deleteOrder(orderId)
            );


            div.appendChild(title);
            div.appendChild(date);
            div.appendChild(items);
            div.appendChild(total);
            div.appendChild(document.createElement('br'));
            div.appendChild(document.createElement('br'));
            div.appendChild(removeButton);

            historyList.appendChild(div);
        });

    } catch (error) {

        console.error(
            'Failed to load order history:',
            error
        );

        historyList.innerHTML = `
            <p style="color: red;">
                Failed to load order history.
                <br><br>
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}


/* =========================
   DELETE ORDER
========================= */

async function deleteOrder(orderId) {

    if (!confirm(
        'Are you sure you want to delete this order?'
    )) {
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

        alert('Failed to delete order.');
    }
}


/* =========================
   TOGGLE ORDER HISTORY
========================= */

window.toggleOrderHistory = function() {

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


/* =========================
   ADMIN DASHBOARD
========================= */

window.goToAdminDashboard = async function() {

    if (!currentUser) {

        window.location.href = 'login.html';

        return;
    }

    try {

        const tokenResult =
            await getIdTokenResult(
                currentUser,
                true
            );

        if (tokenResult.claims.admin !== true) {

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


/* =========================
   LOGOUT
========================= */

window.logout = async function() {

    try {

        await signOut(auth);

        window.location.href =
            'login.html';

    } catch (error) {

        console.error(
            'Logout failed:',
            error
        );

        alert('Failed to logout.');
    }
};


/* =========================
   AI ASSISTANT
========================= */

window.toggleSnackAI = function() {

    const panel =
        document.getElementById('snackAI');

    if (!panel) return;

    const isOpen =
        panel.style.display === 'flex';

    panel.style.display =
        isOpen ? 'none' : 'flex';

    if (!isOpen) {
        document.getElementById('aiInput').focus();
    }
};


/* =========================
   AI MESSAGE DISPLAY
========================= */

function addAIMessage(text, type) {

    const container =
        document.getElementById('aiMessages');

    if (!container) return;

    const message =
        document.createElement('div');

    message.className =
        'ai-message ' + type;

    message.textContent = text;

    container.appendChild(message);

    container.scrollTop =
        container.scrollHeight;

    return message;
}


/* =========================
   AI RECOMMENDATIONS
========================= */

const aiForm =
    document.getElementById('aiForm');

if (aiForm) {

    aiForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const input =
                document.getElementById('aiInput');

            const sendButton =
                document.getElementById('aiSend');

            const userMessage =
                input.value.trim();

            if (!userMessage) return;

            if (products.length === 0) {

                addAIMessage(
                    'Sorry, there are currently no products available for me to recommend.',
                    'bot'
                );

                return;
            }

            addAIMessage(
                userMessage,
                'user'
            );

            input.value = '';

            sendButton.disabled = true;

            sendButton.textContent =
                '...';


            /*
                Give the AI the current
                product list.
            */

            const productInformation =
                products.map((product) => {

                    return (
                        'Product: ' + product.name +
                        '\nPrice: NT$' + product.price +
                        '\nDescription: ' +
                        (product.description || 'No description')
                    );

                }).join('\n\n');


            const systemMessage = `
You are Snack AI, the friendly recommendation assistant for Snack Store.

Your job is to help customers choose snacks and drinks.

IMPORTANT RULES:

1. Only recommend products from the available product list below.
2. Never invent products, prices, or discounts.
3. Always use the listed prices.
4. Consider the customer's budget and preferences.
5. Explain briefly why you recommend each product.
6. If the customer asks for something unavailable, politely explain that it is not currently in the store.
7. Keep your answers friendly, helpful, and reasonably short.
8. You can suggest combinations of products if they fit the customer's budget.
9. Do not claim that an item has been added to the cart. Customers must add it themselves.

CURRENT STORE PRODUCTS:

${productInformation}
`;


            /*
                Keep recent conversation
                so the AI remembers context.
            */

            aiMessages.push({
                role: 'user',
                content: userMessage
            });

            if (aiMessages.length > 12) {
                aiMessages =
                    aiMessages.slice(-12);
            }


            try {

                const response =
                    await fetch(
                        AI_API_URL,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type': 'application/json'
                            },

                            body: JSON.stringify({

                                messages: [
                                    {
                                        role: 'system',
                                        content: systemMessage
                                    },
                                    ...aiMessages
                                ],

                                responseType: 'text',

                                graphType: 'none'
                            })
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        'AI server returned status ' +
                        response.status
                    );
                }


                const data =
                    await response.json();


                const reply =
                    data.reply ||
                    data.message ||
                    'Sorry, I could not generate a recommendation.';


                aiMessages.push({
                    role: 'assistant',
                    content: reply
                });


                addAIMessage(
                    reply,
                    'bot'
                );


            } catch (error) {

                console.error(
                    'Snack AI error:',
                    error
                );

                aiMessages.pop();

                addAIMessage(
                    'Sorry, I could not connect to Snack AI. Please try again later.',
                    'bot'
                );

            } finally {

                sendButton.disabled = false;

                sendButton.textContent =
                    'Send';

                input.focus();
            }
        }
    );
}


/* =========================
   HTML ESCAPING
========================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
