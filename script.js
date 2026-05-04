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
        
        var html = '<div><strong>' + item + ' x' + entry.quantity + '</strong></div>';
        html += '<div style="color:#666;margin-top:5px">NT$' + entry.price + ' × ' + entry.quantity + '</div>';
        
        if (bundles[item]) {
            html += '<div class="bundle-sub">';
            for (var subItem in bundles[item]) {
                html += '<div>' + subItem + ' x' + (bundles[item][subItem] * entry.quantity) + '</div>';
            }
            html += '</div>';
        }
        
        html += '<div style="font-weight:bold;color:green;margin-top:8px">NT$' + (entry.price * entry.quantity) + '</div>';
        html += '<button class="remove-btn" onclick="removeItem(\'' + item + '\')">Remove 1</button>';
        
        div.innerHTML = html;
        cartDiv.appendChild(div);
    }

    if (total === 0) {
        cartDiv.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    }

    document.getElementById('total').innerText = total;
    document.getElementById('qty-Dr Pepper').textContent = cart['Dr Pepper'] ? cart['Dr Pepper'].quantity : 0;
    document.getElementById('qty-Chicken Noodle Snack').textContent = cart['Chicken Noodle Snack'] ? cart['Chicken Noodle Snack'].quantity : 0;
    document.getElementById('qty-Bundle Pack').textContent = cart['Bundle Pack'] ? cart['Bundle Pack'].quantity : 0;
    document.getElementById('qty-Chocolate').textContent = cart['Chocolate'] ? cart['Chocolate'].quantity : 0;
}

function checkout() {
    var customerName = document.getElementById('customerName').value.trim();
    var total = document.getElementById('total').textContent;
    
    if (!customerName) {
        alert('Please enter your name before checking out!');
        document.getElementById('customerName').focus();
        return;
    }
    
    if (parseFloat(total) > 0) {
        var audio = new Audio('https://cdn.freesound.org/previews/678/678271_3797507-lq.mp3');
        audio.play();
        
        var orderDetails = 'ORDER DETAILS:\n\n';
        
        for (var item in cart) {
            var entry = cart[item];
            orderDetails += item + ' x' + entry.quantity + ' = NT$' + (entry.price * entry.quantity) + '\n';
            
            if (bundles[item]) {
                for (var subItem in bundles[item]) {
                    orderDetails += '  - ' + subItem + ' x' + (bundles[item][subItem] * entry.quantity) + '\n';
                }
            }
        }
        
        orderDetails += '\n⚠️ CASH ONLY - Please have exact change ready!';
        
        document.getElementById('emailSubject').value = 'New Order from ' + customerName + ' - NT$' + total;
        document.getElementById('customerNameField').value = customerName;
        document.getElementById('orderDetails').value = orderDetails;
        document.getElementById('orderTotal').value = 'NT$' + total;
        
        document.getElementById('orderForm').submit();
        
        alert('Order sent successfully! 🎉\n\nThank you, ' + customerName + '!\n\nTotal: NT$' + total + '\n\nWe will prepare your order. Remember: CASH ONLY!');
        
        cart = {};
        document.getElementById('customerName').value = '';
        updateCart();
        
        setTimeout(function() {
            var review = confirm('Thank you for your order!\n\nWould you like to leave us a review?\n\nClick OK to write a review via email.');
            
            if (review) {
                var reviewSubject = 'Review for Snack Store';
                var reviewBody = 'Hi,\n\nI would like to leave a review for my recent order:\n\n[Please write your review here]\n\nRating (1-5 stars): \n\nComments:\n\n\nThank you!';
                var reviewMailto = 'mailto:charlie2011.ting@gmail.com?subject=' + encodeURIComponent(reviewSubject) + '&body=' + encodeURIComponent(reviewBody);
                window.location.href = reviewMailto;
            }
        }, 2000);
    } else {
        alert('Your cart is empty!');
    }
}

updateCart();
