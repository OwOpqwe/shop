@@ -62,67 +62,76 @@
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
    var total = document.getElementById('total').textContent;

    if (parseFloat(total) > 0) {
        // Play card swipe sound
        var audio = new Audio('https://cdn.freesound.org/previews/678/678271_3797507-lq.mp3');
        audio.play();

        // Build order details
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

        orderDetails += '\nTOTAL: NT$' + total + '\n\nCASH ONLY - Please have exact change ready!';
        orderDetails += '\n⚠️ CASH ONLY - Please have exact change ready!';

        var subject = 'Snack Store Order - NT$' + total;
        var mailtoLink = 'mailto:charlie2011.ting@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(orderDetails);
        // Fill hidden form
        document.getElementById('emailSubject').value = 'New Snack Store Order - NT$' + total;
        document.getElementById('orderDetails').value = orderDetails;
        document.getElementById('orderTotal').value = 'NT$' + total;

        window.location.href = mailtoLink;
        alert('Your email client will open. Please send the email to complete your order!\n\nTotal: NT$' + total);
        // Submit form
        document.getElementById('orderForm').submit();

        // Show success message
        alert('Order sent successfully! 🎉\n\nTotal: NT$' + total + '\n\nWe will prepare your order. Remember: CASH ONLY!');
        
        // Clear cart
        cart = {};
        updateCart();

        // Ask for review after 2 seconds
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
