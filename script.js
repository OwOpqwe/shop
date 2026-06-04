<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Snack Store</title>

<link rel="stylesheet" href="styles.css">

</head>

<body>

<!-- USER INFO -->
<div id="userInfo"
style="
position:fixed;
top:10px;
right:100px;
z-index:200;
background:white;
padding:10px 20px;
border-radius:12px;
box-shadow:0 2px 10px rgba(0,0,0,0.2);
display:none;
">

    <span style="font-weight:bold;color:#333;">
        Welcome,
        <span id="userName"></span>!
    </span>

    <button
    onclick="logout()"
    style="
    margin-left:15px;
    padding:8px 14px;
    background:#d32f2f;
    color:white;
    border:none;
    border-radius:10px;
    cursor:pointer;
    font-weight:bold;
    ">
        Logout
    </button>

</div>

<header>

    Snack Store

    <span class="cash-only">
        CASH ONLY
    </span>

</header>

<div class="main-container">

    <!-- STORE -->
    <div class="store-container">

        <!-- DR PEPPER -->
        <div class="item">

            <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Dr_Pepper_Dose_2024.jpg/250px-Dr_Pepper_Dose_2024.jpg"
            alt="Dr Pepper">

            <h3>Dr Pepper</h3>

            <p>NT$30</p>

            <div class="quantity">

                <input
                type="number"
                id="input-dr-pepper"
                min="1"
                value="1">

                <button
                class="add-btn"
                onclick="addItem('dr-pepper','Dr Pepper',30)">
                    Add
                </button>

            </div>

            <div style="margin-top:10px;font-weight:bold;">
                In cart:
                <span id="qty-dr-pepper">0</span>
            </div>

        </div>

        <!-- CHICKEN -->
        <div class="item">

            <img
            src="https://images.cdn.saveonfoods.com/detail/00074410700799.jpg"
            alt="Chicken Noodle Snack">

            <h3>Chicken Noodle Snack</h3>

            <p>NT$25</p>

            <div class="quantity">

                <input
                type="number"
                id="input-chicken"
                min="1"
                value="1">

                <button
                class="add-btn"
                onclick="addItem('chicken','Chicken Noodle Snack',25)">
                    Add
                </button>

            </div>

            <div style="margin-top:10px;font-weight:bold;">
                In cart:
                <span id="qty-chicken">0</span>
            </div>

        </div>

        <!-- BUNDLE PACK -->
        <div class="item">

            <div class="bundle-images">

                <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Dr_Pepper_Dose_2024.jpg/250px-Dr_Pepper_Dose_2024.jpg"
                alt="Dr Pepper">

                <img
                src="https://images.cdn.saveonfoods.com/detail/00074410700799.jpg"
                alt="Chicken Noodle Snack">

            </div>

            <h3>Bundle Pack</h3>

            <p>NT$50</p>

            <div class="quantity">

                <input
                type="number"
                id="input-bundle"
                min="1"
                value="1">

                <button
                class="add-btn"
                onclick="addItem('bundle','Bundle Pack',50)">
                    Add
                </button>

            </div>

            <div style="margin-top:10px;font-weight:bold;">
                In cart:
                <span id="qty-bundle">0</span>
            </div>

        </div>

        <!-- CHOCOLATE -->
        <div class="item">

            <img
            src="https://i.ebayimg.com/images/g/WboAAOSwPhBoI-cE/s-l1200.jpg"
            alt="Chocolate">

            <h3>Chocolate</h3>

            <p>NT$20</p>

            <div class="quantity">

                <input
                type="number"
                id="input-chocolate"
                min="1"
                value="1">

                <button
                class="add-btn"
                onclick="addItem('chocolate','Chocolate',20)">
                    Add
                </button>

            </div>

            <div style="margin-top:10px;font-weight:bold;">
                In cart:
                <span id="qty-chocolate">0</span>
            </div>

        </div>

    </div>

    <!-- CART -->
    <div class="cart-panel">

        <div class="cart-header">
            Your Cart
        </div>

        <!-- CUSTOMER -->
        <div class="customer-info">

            <label for="customerName">
                Your Name *
            </label>

            <input
            type="text"
            id="customerName"
            readonly>

        </div>

        <!-- CART ITEMS -->
        <div id="cart-items">

            <div class="empty-cart">
                Cart empty
            </div>

        </div>

        <!-- TOTAL -->
        <div class="cart-total">

            Total:
            NT$<span id="total">0</span>

        </div>

        <!-- CHECKOUT -->
        <button
        class="checkout-btn"
        onclick="checkout()">
            Checkout
        </button>

        <!-- HISTORY -->
        <button
        class="checkout-btn"
        style="
        background:#6f42c1;
        margin-top:10px;
        "
        onclick="toggleOrderHistory()">
            View Order History
        </button>

        <!-- ORDER HISTORY -->
        <div
        id="order-history"
        style="
        display:none;
        margin-top:20px;
        padding-top:20px;
        border-top:2px solid #ddd;
        ">

            <h3 style="margin-bottom:15px;">
                📦 Order History
            </h3>

            <div id="history-list">
                No previous orders
            </div>

        </div>

    </div>

</div>

<!-- FORMSUBMIT -->
<form
id="orderForm"
action="https://formsubmit.co/charlie2011.ting@gmail.com"
method="POST">

    <input
    type="hidden"
    name="_subject"
    id="emailSubject">

    <input
    type="hidden"
    name="_captcha"
    value="false">

    <input
    type="hidden"
    name="customer"
    id="customerField">

    <input
    type="hidden"
    name="order"
    id="orderField">

    <input
    type="hidden"
    name="total"
    id="totalField">

</form>

<script type="module" src="script.js"></script>

</body>
</html>
