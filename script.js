var cart = {};

var bundles = {
    "Bundle Pack": {
        "Dr Pepper": 1,
        "Chicken Noodle Snack": 1
    }
};

function addToCartWithInput(name, price) {
    var inputElement = document.getElementById('input-' + name);
    var quantity = parseInt(inputElement.value);

    if (!quantity || quantity < 1) {
        alert('Enter a valid quantity!');
        return;
    }

    if (!cart[name]) {
        cart[name] = { price: price, quantity: quantity };
    } else {
        cart[name].quantity += quantity;
    }

    inputElement.value = 1;
    updateCart();
}

function removeItem(name) {
    if (cart[name]) {
        cart[name].quantity--;
        if (cart[name].quantity === 0) {
            delete cart[name];
        }
        updateCart();
    }
}

function updateCart() {
    var cartDiv = document.getElementById('cart-items');
    cartDiv.innerHTML = '';
    var total = 0;

    for (var item in cart) {
        var entry = cart[item];
        total += entry.price * entry.quantity;

        var div = document.createElement('div');
        div.className = 'cart-item';

        var html = '<strong>' + item + ' x' + entry.quantity + '</strong><br>';
        html += 'NT$' + entry.price + ' × ' + entry.quantity + '<br>';

        if (bundles[item]) {
            for (var sub in bundles[item]) {
                html += '↳ ' + sub + ' x' + (bundles[item][sub] * entry.quantity) + '<br>';
            }
        }

        html += '<strong>NT$' + (entry.price * entry.quantity) + '</strong><br>';
        html += '<button class="remove-btn" onclick="removeItem(\'' + item + '\')">Remove 1</button>';

        div.innerHTML = html;
        cartDiv.appendChild(div);
    }

    if (total === 0) {
        cartDiv.innerHTML = 'Cart is empty';
    }

    document.getElementById('total').innerText = total;

    document.getElementById('qty-Dr Pepper').textContent = cart['Dr Pepper'] ? cart['Dr Pepper'].quantity : 0;
    document.getElementById('qty-Chicken Noodle Snack').textContent = cart['Chicken Noodle Snack'] ? cart['Chicken Noodle Snack'].quantity : 0;
    document.getElementById('qty-Bundle Pack').textContent = cart['Bundle Pack'] ? cart['Bundle Pack'].quantity : 0;
    document.getElementById('qty-Chocolate').textContent = cart['Chocolate'] ? cart['Chocolate'].quantity : 0;
}

function checkout() {
    var customerName = document.getElementById('customerName').value.trim();
    var total = parseFloat(document.getElementById('total').textContent);

    if (!customerName) {
        alert('Enter your name!');
        return;
    }

    if (total <= 0) {
        alert('Cart is empty!');
        return;
    }

    var orderDetails = '';

    for (var item in cart) {
        var entry = cart[item];
        orderDetails += item + ' x' + entry.quantity + ' = NT$' + (entry.price * entry.quantity) + '\n';

        if (bundles[item]) {
            for (var sub in bundles[item]) {
                orderDetails += '  - ' + sub + ' x' + (bundles[item][sub] * entry.quantity) + '\n';
            }
        }
    }

    document.getElementById('emailSubject').value =
        'Order from ' + customerName + ' - NT$' + total;

    document.getElementById('customerNameField').value = customerName;
    document.getElementById('orderDetails').value = orderDetails;
    document.getElementById('orderTotal').value = 'NT$' + total;

    document.getElementById('orderForm').submit();

    alert('Order sent! 🎉');

    cart = {};
    document.getElementById('customerName').value = '';
    updateCart();
}

updateCart();
