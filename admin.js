import { auth, db } from './firebase.js';

import {
    onAuthStateChanged,
    getIdTokenResult,
    signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


/* =========================
   CHECK ADMIN
========================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = 'login.html';

        return;
    }


    try {

        const tokenResult =
            await getIdTokenResult(
                user,
                true
            );


        /* Make sure this account is actually admin */

        if (tokenResult.claims.admin !== true) {

            alert(
                'You do not have administrator permission.'
            );

            window.location.href = 'index.html';

            return;
        }


        /* Show admin email */

        const email =
            document.getElementById('adminEmail');

        if (email) {

            email.textContent =
                'Logged in as: ' + user.email;

        }


        /* Load all orders */

        await loadOrders();


    } catch (error) {

        console.error(
            'Admin verification failed:',
            error
        );

        alert(
            'Could not verify administrator permission.'
        );

        window.location.href =
            'login.html';

    }

});


/* =========================
   LOAD ALL ORDERS
========================= */

async function loadOrders() {

    const container =
        document.getElementById('orders');


    if (!container) {
        return;
    }


    container.innerHTML =
        'Loading orders...';


    try {

        const q =
            query(
                collection(db, 'orders'),
                orderBy(
                    'createdAt',
                    'desc'
                )
            );


        const snapshot =
            await getDocs(q);


        container.innerHTML = '';


        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty">
                    No customer orders yet.
                </div>
            `;

            return;
        }


        snapshot.forEach((orderDoc) => {

            const order =
                orderDoc.data();


            const orderId =
                orderDoc.id;


            /* Get order time */

            const time =
                order.createdAt?.toDate
                    ? order.createdAt
                        .toDate()
                        .toLocaleString()
                    : 'Unknown time';


            /* Get items */

            let itemsHTML =
                '<div class="order-items">';


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


            /* Create order */

            const div =
                document.createElement('div');


            div.className =
                'order';


            div.innerHTML = `

                <div class="order-name">

                    ${order.customer || 'Unknown Customer'}

                </div>


                <div class="order-info">

                    Email:
                    ${order.userEmail || 'Unknown'}

                </div>


                <div class="order-info">

                    Order time:
                    ${time}

                </div>


                ${itemsHTML}


                <div class="order-total">

                    Total:
                    NT$${order.total || 0}

                </div>


                <button
                    class="delete-btn"
                    onclick="deleteOrder('${orderId}')">

                    Delete Order

                </button>

            `;


            container.appendChild(div);

        });


    } catch (error) {

        console.error(
            'Failed to load orders:',
            error
        );


        container.innerHTML = `

            <div class="error">

                Failed to load customer orders.

                <br><br>

                ${error.message}

            </div>

        `;

    }

}


/* =========================
   DELETE ORDER
========================= */

window.deleteOrder =
    async function(orderId) {

        if (
            !confirm(
                'Are you sure you want to delete this order?'
            )
        ) {

            return;

        }


        try {

            await deleteDoc(
                doc(
                    db,
                    'orders',
                    orderId
                )
            );


            await loadOrders();


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


/* =========================
   BACK TO STORE
========================= */

window.goToStore =
    function() {

        window.location.href =
            'index.html';

    };


/* =========================
   LOGOUT
========================= */

window.logout =
    async function() {

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
