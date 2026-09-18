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
    doc,
    addDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let editingProductId = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const tokenResult = await getIdTokenResult(user, true);

        if (tokenResult.claims.admin !== true) {
            alert('You do not have administrator permission.');
            window.location.href = 'index.html';
            return;
        }

        const email = document.getElementById('adminEmail');

        if (email) {
            email.textContent = 'Logged in as: ' + user.email;
        }

        await loadOrders();
        await loadProducts();

    } catch (error) {
        console.error('Admin verification failed:', error);
        alert('Could not verify administrator permission.');
        window.location.href = 'login.html';
    }
});


async function loadOrders() {
    const container = document.getElementById('orders');

    if (!container) return;

    container.innerHTML = 'Loading orders...';

    try {
        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);

        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty">
                    No customer orders yet.
                </div>
            `;

            updateStats(0, 0, 0);
            return;
        }

        const customers = {};
        const customerEmails = new Set();

        let totalSales = 0;

        snapshot.forEach((orderDoc) => {
            const order = orderDoc.data();

            const customerName =
                order.customer || 'Unknown Customer';

            const customerEmail =
                order.userEmail || 'Unknown Email';

            const customerKey =
                order.userId || customerEmail;

            if (!customers[customerKey]) {
                customers[customerKey] = {
                    name: customerName,
                    email: customerEmail,
                    orders: []
                };
            }

            customers[customerKey].orders.push({
                ...order,
                orderId: orderDoc.id
            });

            totalSales += Number(order.total || 0);

            if (order.userEmail) {
                customerEmails.add(order.userEmail);
            }
        });

        Object.values(customers).forEach((customer) => {

            const customerSection =
                document.createElement('div');

            customerSection.className =
                'customer-orders';

            customerSection.style.background = '#0d0d0d';
            customerSection.style.border = '1px solid #444';
            customerSection.style.borderRadius = '12px';
            customerSection.style.padding = '20px';
            customerSection.style.marginBottom = '25px';

            const customerHeader =
                document.createElement('div');

            customerHeader.style.borderBottom =
                '1px solid #333';

            customerHeader.style.paddingBottom =
                '12px';

            customerHeader.style.marginBottom =
                '15px';

            const name =
                document.createElement('h2');

            name.style.margin = '0 0 5px';

            name.textContent =
                '👤 ' + customer.name;

            const email =
                document.createElement('div');

            email.style.color = '#aaa';

            email.textContent =
                customer.email;

            const orderCount =
                document.createElement('div');

            orderCount.style.color = '#00ff66';
            orderCount.style.marginTop = '5px';

            orderCount.textContent =
                customer.orders.length +
                (customer.orders.length === 1
                    ? ' order'
                    : ' orders');

            customerHeader.appendChild(name);
            customerHeader.appendChild(email);
            customerHeader.appendChild(orderCount);

            customerSection.appendChild(
                customerHeader
            );

            customer.orders.forEach((order) => {

                const orderDiv =
                    document.createElement('div');

                orderDiv.className =
                    'admin-order';

                orderDiv.style.background = '#181818';
                orderDiv.style.border = '1px solid #333';
                orderDiv.style.borderRadius = '10px';
                orderDiv.style.padding = '15px';
                orderDiv.style.marginBottom = '12px';

                const time =
                    order.createdAt?.toDate
                        ? order.createdAt
                            .toDate()
                            .toLocaleString()
                        : 'Unknown time';

                const timeElement =
                    document.createElement('div');

                timeElement.style.color = '#aaa';
                timeElement.style.marginBottom = '10px';

                timeElement.textContent =
                    'Order time: ' + time;

                orderDiv.appendChild(
                    timeElement
                );

                if (order.items) {

                    const itemsContainer =
                        document.createElement('div');

                    itemsContainer.className =
                        'order-items';

                    for (
                        const [itemName, itemData]
                        of Object.entries(order.items)
                    ) {

                        const quantity =
                            Number(itemData.quantity || 0);

                        const price =
                            Number(itemData.price || 0);

                        const itemTotal =
                            price * quantity;

                        const item =
                            document.createElement('div');

                        item.style.marginBottom =
                            '5px';

                        item.textContent =
                            itemName +
                            ' ×' +
                            quantity +
                            ' — NT$' +
                            itemTotal;

                        itemsContainer.appendChild(item);
                    }

                    orderDiv.appendChild(
                        itemsContainer
                    );
                }

                const total =
                    document.createElement('div');

                total.className =
                    'order-total';

                total.textContent =
                    'Total: NT$' +
                    Number(order.total || 0);

                total.style.marginTop =
                    '10px';

                orderDiv.appendChild(total);

                const deleteButton =
                    document.createElement('button');

                deleteButton.className =
                    'delete-btn';

                deleteButton.textContent =
                    'Delete Order';

                deleteButton.style.marginTop =
                    '10px';

                deleteButton.addEventListener(
                    'click',
                    () => {
                        window.deleteOrder(
                            order.orderId
                        );
                    }
                );

                orderDiv.appendChild(
                    deleteButton
                );

                customerSection.appendChild(
                    orderDiv
                );
            });

            container.appendChild(
                customerSection
            );
        });

        updateStats(
            snapshot.size,
            totalSales,
            customerEmails.size
        );

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


function updateStats(
    totalOrders,
    totalSales,
    totalCustomers
) {

    const orders =
        document.getElementById('totalOrders');

    const sales =
        document.getElementById('totalSales');

    const customers =
        document.getElementById('totalCustomers');

    if (orders) {
        orders.textContent =
            totalOrders;
    }

    if (sales) {
        sales.textContent =
            'NT$' + totalSales;
    }

    if (customers) {
        customers.textContent =
            totalCustomers;
    }
}


window.deleteOrder = async function(orderId) {

    if (!confirm(
        'Are you sure you want to delete this order?'
    )) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, 'orders', orderId)
        );

        await loadOrders();

    } catch (error) {

        console.error(
            'Delete order failed:',
            error
        );

        alert(
            'Failed to delete order.\n\n' +
            error.message
        );
    }
};


async function loadProducts() {

    const container =
        document.getElementById('productsAdmin');

    if (!container) return;

    container.innerHTML =
        'Loading products...';

    try {

        const snapshot =
            await getDocs(
                collection(db, 'products')
            );

        container.innerHTML = '';

        if (snapshot.empty) {

            container.innerHTML =
                '<p>No products yet.</p>';

            return;
        }

        snapshot.forEach((productDoc) => {

            const product =
                productDoc.data();

            const div =
                document.createElement('div');

            div.className =
                'admin-product';

            const image =
                document.createElement('img');

            image.src =
                product.image || '';

            image.alt =
                product.name || 'Product';

            const title =
                document.createElement('h3');

            title.textContent =
                product.name || 'Unnamed Product';

            const price =
                document.createElement('p');

            price.className =
                'price';

            price.textContent =
                'NT$' +
                Number(product.price || 0);

            const description =
                document.createElement('p');

            description.textContent =
                product.description || '';

            const buttons =
                document.createElement('div');

            buttons.className =
                'admin-product-buttons';

            const editButton =
                document.createElement('button');

            editButton.className =
                'edit-btn';

            editButton.textContent =
                'Edit';

            editButton.addEventListener(
                'click',
                () => {
                    editProduct(
                        productDoc.id,
                        product
                    );
                }
            );

            const deleteButton =
                document.createElement('button');

            deleteButton.className =
                'delete-btn';

            deleteButton.textContent =
                'Delete';

            deleteButton.addEventListener(
                'click',
                () => {
                    deleteProduct(
                        productDoc.id
                    );
                }
            );

            buttons.appendChild(
                editButton
            );

            buttons.appendChild(
                deleteButton
            );

            div.appendChild(image);
            div.appendChild(title);
            div.appendChild(price);
            div.appendChild(description);
            div.appendChild(buttons);

            container.appendChild(div);
        });

    } catch (error) {

        console.error(
            'Failed to load products:',
            error
        );

        container.innerHTML =
            '<p style="color:red;">' +
            'Failed to load products.<br><br>' +
            error.message +
            '</p>';
    }
}


function editProduct(
    productId,
    product
) {

    document.getElementById(
        'productName'
    ).value =
        product.name || '';

    document.getElementById(
        'productPrice'
    ).value =
        product.price || '';

    document.getElementById(
        'productImage'
    ).value =
        product.image || '';

    document.getElementById(
        'productDescription'
    ).value =
        product.description || '';

    editingProductId =
        productId;

    const title =
        document.getElementById(
            'productFormTitle'
        );

    if (title) {
        title.textContent =
            '✏️ Edit Product';
    }

    const cancel =
        document.getElementById(
            'cancelEdit'
        );

    if (cancel) {
        cancel.style.display =
            'inline-block';
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


async function deleteProduct(
    productId
) {

    if (!confirm(
        'Are you sure you want to delete this product?'
    )) {
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                'products',
                productId
            )
        );

        await loadProducts();

    } catch (error) {

        console.error(
            'Delete product failed:',
            error
        );

        alert(
            'Failed to delete product.\n\n' +
            error.message
        );
    }
}


const productForm =
    document.getElementById(
        'productForm'
    );

if (productForm) {

    productForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const name =
                document.getElementById(
                    'productName'
                ).value.trim();

            const price =
                Number(
                    document.getElementById(
                        'productPrice'
                    ).value
                );

            const image =
                document.getElementById(
                    'productImage'
                ).value.trim();

            const description =
                document.getElementById(
                    'productDescription'
                ).value.trim();

            const status =
                document.getElementById(
                    'productStatus'
                );

            try {

                const productData = {
                    name: name,
                    price: price,
                    image: image,
                    description: description
                };

                if (editingProductId) {

                    await updateDoc(
                        doc(
                            db,
                            'products',
                            editingProductId
                        ),
                        productData
                    );

                    if (status) {
                        status.textContent =
                            'Product updated successfully!';

                        status.style.color =
                            '#00ff66';
                    }

                } else {

                    await addDoc(
                        collection(
                            db,
                            'products'
                        ),
                        productData
                    );

                    if (status) {
                        status.textContent =
                            'Product added successfully!';

                        status.style.color =
                            '#00ff66';
                    }
                }

                productForm.reset();

                editingProductId = null;

                const title =
                    document.getElementById(
                        'productFormTitle'
                    );

                if (title) {
                    title.textContent =
                        '➕ Add Product';
                }

                const cancel =
                    document.getElementById(
                        'cancelEdit'
                    );

                if (cancel) {
                    cancel.style.display =
                        'none';
                }

                await loadProducts();

            } catch (error) {

                console.error(
                    'Save product failed:',
                    error
                );

                if (status) {
                    status.textContent =
                        'Failed to save product: ' +
                        error.message;

                    status.style.color =
                        'red';
                }
            }
        }
    );
}


const cancelEdit =
    document.getElementById(
        'cancelEdit'
    );

if (cancelEdit) {

    cancelEdit.addEventListener(
        'click',
        () => {

            productForm.reset();

            editingProductId = null;

            const title =
                document.getElementById(
                    'productFormTitle'
                );

            if (title) {
                title.textContent =
                    '➕ Add Product';
            }

            cancelEdit.style.display =
                'none';

            const status =
                document.getElementById(
                    'productStatus'
                );

            if (status) {
                status.textContent = '';
            }
        }
    );
}


window.goToStore = function() {
    window.location.href =
        'index.html';
};


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

        alert(
            'Failed to logout.'
        );
    }
};
