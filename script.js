let cart=0;
let total=0;

let user=JSON.parse(localStorage.getItem("currentUser"));

document.getElementById("userName").innerText=user.name;

function add(){
    cart++;
    total+=30;
    document.getElementById("cart").innerText="Dr Pepper x"+cart;
    document.getElementById("total").innerText=total;
}

function logout(){
    localStorage.removeItem("currentUser");
    window.location.href="login.html";
}

function checkout(){

    let email=document.getElementById("email").value;

    if(!email){
        alert("Enter email");
        return;
    }

    document.getElementById("subject").value="New Order";
    document.getElementById("order").value="Dr Pepper x"+cart;
    document.getElementById("emailField").value=email;

    document.getElementById("form").submit();

    alert("Order sent + confirmation email sent!");

    cart=0;
    total=0;
    document.getElementById("cart").innerText="";
    document.getElementById("total").innerText="0";
}
