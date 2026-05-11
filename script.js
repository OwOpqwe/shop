// CHECK IF USER IS LOGGED IN - FIRST THING!
(function() {
    var currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    var user = JSON.parse(currentUser);

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('customerName').value = user.name;
})();

// LOGOUT FUNCTION
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// CART + ORDER HISTORY
var cart = {};

var orderHistory = JSON.parse(
    localStorage.getItem('orderHistory') || '[]'
);

var bundles = {
    "Bundle Pack": {
        "Dr Pepper": 1,
        "Chicken Noodle Snack": 1
    }
};

// ADD TO CART
function addToCartWithInput(name, price) {

    var inputElement = document.getElementById('input-' + name);

    var quantity = parseInt(inputElement.value);

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
}

// REMOVE ITEM
function removeItem(name) {

    if (cart[name]) {

        cart[name].quantity--;

        if (cart[name].quantity === 0) {
            delete cart[name];
        }

        updateCart();
    }
}

// UPDATE CART DISPLAY
function updateCart() {

    var cartDiv = document.getElementById('cart-items');

    cartDiv.innerHTML = '';

    var total = 0;

    for (var item in cart) {

        var entry = cart[item];

        total += entry.price * entry.quantity;

        var div = document.createElement('div');

        div.className = 'cart-item';

        var html = '';

        html += '<div><strong>' + item + ' x' + entry.quantity + '</strong></div>';

        html += '<div style="color:#666;margin-top:5px">';
        html += 'NT$' + entry.price + ' × ' + entry.quantity;
        html += '</div>';

        // BUNDLE ITEMS
        if (bundles[item]) {

            html += '<div class="bundle-sub">';

            for (var subItem in bundles[item]) {

                html += '<div>';
                html += subItem + ' x' + (bundles[item][subItem] * entry.quantity);
                html += '</div>';
            }

            html += '</div>';
        }

        html += '<div style="font-weight:bold;color:green;margin-top:8px">';
        html += 'NT$' + (entry.price * entry.quantity);
        html += '</div>';

        html += '<button class="remove-btn" onclick="removeItem(\'' + item + '\')">';
        html += 'Remove 1';
        html += '</button>';

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

    // UPDATE TOTAL
    document.getElementById('total').innerText = total;

    // UPDATE ITEM COUNTS
    document.getElementById('qty-Dr Pepper').textContent =
        cart['Dr Pepper'] ? cart['Dr Pepper'].quantity : 0;

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
function checkout() {

    var customerName =
        document.getElementById('customerName').value.trim();

    var total =
        document.getElementById('total').textContent;

    if (!customerName) {

        alert('Please enter your name before checking out!');

        document.getElementById('customerName').focus();

        return;
    }

    if (parseFloat(total) <= 0) {

        alert('Your cart is empty!');

        return;
    }

    // PLAY SOUND
    var audio = new Audio(
        'https://cdn.freesound.org/previews/678/678271_3797507-lq.mp3'
    );

    audio.play();

    // BUILD ORDER DETAILS
    var orderDetails = 'ORDER DETAILS:\n\n';

    for (var item in cart) {

        var entry = cart[item];

        orderDetails +=
            item +
            ' x' +
            entry.quantity +
            ' = NT$' +
            (entry.price * entry.quantity) +
            '\n';

        // BUNDLE DETAILS
        if (bundles[item]) {

            for (var subItem in bundles[item]) {

                orderDetails +=
                    '  - ' +
                    subItem +
                    ' x' +
                    (bundles[item][subItem] * entry.quantity) +
                    '\n';
            }
        }
    }

    orderDetails +=
        '\n⚠️ CASH ONLY - Please have exact change ready!';

    // SAVE ORDER HISTORY
    var orderRecord = {
        customer: customerName,
        items: JSON.parse(JSON.stringify(cart)),
        total: total,
        date: new Date().toLocaleString()
    };

    orderHistory.unshift(orderRecord);

    localStorage.setItem(
        'orderHistory',
        JSON.stringify(orderHistory)
    );

    // EMAIL FORM
    document.getElementById('emailSubject').value =
        'New Order from ' +
        customerName +
        ' - NT$' +
        total;

    document.getElementById('customerNameField').value =
        customerName;

    document.getElementById('orderDetails').value =
        orderDetails;

    document.getElementById('orderTotal').value =
        'NT$' + total;

    // SEND FORM
    document.getElementById('orderForm').submit();

    // SUCCESS MESSAGE
    alert(
        'Order sent successfully! 🎉\n\n' +
        'Thank you, ' +
        customerName +
        '!\n\n' +
        'Total: NT$' +
        total +
        '\n\nWe will prepare your order.\n\n' +
        'Remember: CASH ONLY!'
    );

    // CLEAR CART
    cart = {};

    updateCart();

    // REFRESH HISTORY
    renderOrderHistory();

    // REVIEW POPUP
    setTimeout(function() {

        var review = confirm(
            'Thank you for your order!\n\n' +
            'Would you like to leave us a review?\n\n' +
            'Click OK to write a review via email.'
        );

        if (review) {

            var reviewSubject =
                'Review for Snack Store';

            var reviewBody =
                'Hi,\n\n' +
                'I would like to leave a review ' +
                'for my recent order:\n\n' +
                '[Please write your review here]\n\n' +
                'Rating (1-5 stars): \n\n' +
                'Comments:\n\n\n' +
                'Thank you!';

            var reviewMailto =
                'mailto:charlie2011.ting@gmail.com' +
                '?subject=' +
                encodeURIComponent(reviewSubject) +
                '&body=' +
                encodeURIComponent(reviewBody);

            window.open(reviewMailto, '_blank');
        }

    }, 2000);
}

// TOGGLE ORDER HISTORY
function toggleOrderHistory() {

    var historyDiv =
        document.getElementById('order-history');

    if (historyDiv.style.display === 'none') {

        historyDiv.style.display = 'block';

        renderOrderHistory();

    } else {

        historyDiv.style.display = 'none';
    }
}

// RENDER ORDER HISTORY
function renderOrderHistory() {

    var historyList =
        document.getElementById('history-list');

    // NO HISTORY
    if (orderHistory.length === 0) {

        historyList.innerHTML =
            '<div>No previous orders</div>';

        return;
    }

    historyList.innerHTML = '';

    orderHistory.forEach(function(order, index) {

        var div = document.createElement('div');

        div.style.background = '#f5f5f5';
        div.style.padding = '15px';
        div.style.borderRadius = '10px';
        div.style.marginBottom = '15px';

        var html = '';

        html += '<div style="font-weight:bold;font-size:1.1em;">';
        html += 'Order #' + (orderHistory.length - index);
        html += '</div>';

        html += '<div style="color:#666;margin-top:5px;">';
        html += order.date;
        html += '</div>';

        html += '<div style="margin-top:10px;">';

        for (var item in order.items) {

            html += '<div>';
            html += item + ' x' + order.items[item].quantity;
            html += '</div>';
        }

        html += '</div>';

        html += '<div style="margin-top:10px;font-weight:bold;color:green;">';
        html += 'Total: NT$' + order.total;
        html += '</div>';

        div.innerHTML = html;

        historyList.appendChild(div);
    });
}

// CLEAR ORDER HISTORY
function clearOrderHistory() {

    var confirmClear = confirm(
        'Are you sure you want to clear all order history?'
    );

    if (!confirmClear) {
        return;
    }

    orderHistory = [];

    localStorage.setItem(
        'orderHistory',
        JSON.stringify(orderHistory)
    );

    renderOrderHistory();
}

// INITIALIZE
updateCart();
renderOrderHistory();
