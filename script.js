// ORDER HISTORY
async function renderOrderHistory() {

    const historyList =
        document.getElementById('history-list');

    historyList.innerHTML =
        'Loading orders...';

    try {

        // QUERY
        const q = query(
            collection(db, "orders"),
            where(
                "userEmail",
                "==",
                currentUser.email
            )
        );

        const querySnapshot =
            await getDocs(q);

        // EMPTY
        if (querySnapshot.empty) {

            historyList.innerHTML =
                'No previous orders';

            return;
        }

        // STORE ORDERS
        let orders = [];

        querySnapshot.forEach((doc) => {

            orders.push(doc.data());
        });

        // SORT NEWEST FIRST
        orders.sort((a, b) => {

            return new Date(b.createdAt) -
                   new Date(a.createdAt);
        });

        historyList.innerHTML = '';

        // DISPLAY
        orders.forEach((order) => {

            const div =
                document.createElement('div');

            div.style.background = '#f5f5f5';

            div.style.padding = '15px';

            div.style.borderRadius = '10px';

            div.style.marginBottom = '15px';

            let html = '';

            // TITLE
            html += `
                <div style="
                font-weight:bold;
                font-size:1.1em;
                color:#007bff;
                ">
                    📦 Previous Order
                </div>
            `;

            // DATE
            html += `
                <div style="
                color:#666;
                margin-top:5px;
                ">
                    ${new Date(order.createdAt).toLocaleString()}
                </div>
            `;

            // ITEMS
            html += `
                <div style="
                margin-top:10px;
                ">
            `;

            for (let item in order.items) {

                html += `
                    <div>
                        ${item}
                        x${order.items[item].quantity}
                    </div>
                `;
            }

            html += `</div>`;

            // TOTAL
            html += `
                <div style="
                margin-top:10px;
                font-weight:bold;
                color:green;
                ">
                    Total:
                    NT$${order.total}
                </div>
            `;

            div.innerHTML = html;

            historyList.appendChild(div);
        });

    } catch(error) {

        console.error(error);

        historyList.innerHTML =
            'Failed to load orders';
    }
}
