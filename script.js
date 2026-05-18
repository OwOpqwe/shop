// ---------------- CHECKOUT ----------------
window.checkout = async function () {

    const name =
        document.getElementById('customerName')
        .value
        .trim();

    const total =
        document.getElementById('total')
        .textContent;

    // VALIDATION
    if (!name) {

        alert('Please enter your name');

        return;
    }

    if (parseFloat(total) <= 0) {

        alert('Your cart is empty');

        return;
    }

    try {

        // ---------------- SAVE TO FIREBASE ----------------
        await addDoc(
            collection(db, "orders"),
            {
                customer: name,

                userEmail: currentUser.email,

                items: cart,

                total: total,

                createdAt: new Date().toISOString()
            }
        );

        // ---------------- CREATE ORDER DETAILS ----------------
        let orderDetails =
            'ORDER DETAILS:\n\n';

        for (let item in cart) {

            const entry = cart[item];

            orderDetails +=
                `${item} x${entry.quantity} = NT$${entry.price * entry.quantity}\n`;

            // BUNDLE ITEMS
            if (bundles[item]) {

                for (let subItem in bundles[item]) {

                    orderDetails +=
                        `  - ${subItem} x${bundles[item][subItem] * entry.quantity}\n`;
                }
            }
        }

        orderDetails +=
            '\n⚠️ CASH ONLY';

        // ---------------- SEND EMAIL USING FORMSUBMIT ----------------
        const response = await fetch(
            "https://formsubmit.co/ajax/charlie2011.ting@gmail.com",
            {
                method: "POST",

                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },

                body: JSON.stringify({

                    subject:
                        `New Order from ${name}`,

                    Customer:
                        name,

                    Email:
                        currentUser.email,

                    Order:
                        orderDetails,

                    Total:
                        `NT$${total}`
                })
            }
        );

        // CHECK RESPONSE
        if (!response.ok) {

            throw new Error(
                'Failed to send email'
            );
        }

        // ---------------- SUCCESS ----------------
        alert(
            `Order sent successfully! 🎉\n\nTotal: NT$${total}`
        );

        // PLAY SOUND
        const audio = new Audio(
            'https://cdn.freesound.org/previews/678/678271_3797507-lq.mp3'
        );

        audio.play();

        // RESET CART
        cart = {};

        updateCart();

        // REFRESH HISTORY
        await renderOrderHistory();

    } catch(error) {

        console.error(error);

        alert(
            'Checkout failed. Please try again.'
        );
    }
};
