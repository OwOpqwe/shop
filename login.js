function showRegister(){
    document.getElementById("loginForm").style.display="none";
    document.getElementById("registerForm").style.display="block";
}

function showLogin(){
    document.getElementById("loginForm").style.display="block";
    document.getElementById("registerForm").style.display="none";
}

function register(){

    let name=document.getElementById("registerName").value;
    let email=document.getElementById("registerEmail").value;
    let pass=document.getElementById("registerPassword").value;
    let confirm=document.getElementById("confirmPassword").value;

    if(pass!==confirm){
        document.getElementById("msg").innerText="Passwords not match";
        return;
    }

    let users=JSON.parse(localStorage.getItem("users")||"[]");

    users.push({name,email,pass});

    localStorage.setItem("users",JSON.stringify(users));

    document.getElementById("msg").style.color="green";
    document.getElementById("msg").innerText="Registered! Now login";

    showLogin();
}

function login(){

    let email=document.getElementById("loginEmail").value;
    let pass=document.getElementById("loginPassword").value;

    let users=JSON.parse(localStorage.getItem("users")||"[]");

    let user=users.find(u=>u.email===email && u.pass===pass);

    if(!user){
        document.getElementById("msg").innerText="Invalid login";
        return;
    }

    localStorage.setItem("currentUser",JSON.stringify(user));

    window.location.href="index.html";
}
