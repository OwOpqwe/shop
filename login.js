import { auth } from './firebase.js';

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

// SHOW LOGIN
window.showLogin = function() {

    document.getElementById('loginForm').style.display = 'block';

    document.getElementById('registerForm').style.display = 'none';

    document.getElementById('formTitle').textContent =
        '🏪 Login to Snack Store';

    hideMessages();
};

// SHOW REGISTER
window.showRegister = function() {

    document.getElementById('loginForm').style.display = 'none';

    document.getElementById('registerForm').style.display = 'block';

    document.getElementById('formTitle').textContent =
        '🏪 Register for Snack Store';

    hideMessages();
};

// HIDE MESSAGES
function hideMessages() {

    document.getElementById('errorMsg').style.display = 'none';

    document.getElementById('successMsg').style.display = 'none';
}

// ERROR
function showError(message) {

    const errorMsg =
        document.getElementById('errorMsg');

    errorMsg.textContent = message;

    errorMsg.style.display = 'block';

    document.getElementById('successMsg').style.display =
        'none';
}

// SUCCESS
function showSuccess(message) {

    const successMsg =
        document.getElementById('successMsg');

    successMsg.textContent = message;

    successMsg.style.display = 'block';

    document.getElementById('errorMsg').style.display =
        'none';
}

// REGISTER
window.register = async function() {

    const name =
        document.getElementById('registerName').value.trim();

    const email =
        document.getElementById('registerEmail').value.trim();

    const password =
        document.getElementById('registerPassword').value;

    const confirmPassword =
        document.getElementById('registerConfirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {

        showError('Please fill in all fields');

        return;
    }

    if (password !== confirmPassword) {

        showError('Passwords do not match');

        return;
    }

    if (password.length < 6) {

        showError('Password must be at least 6 characters');

        return;
    }

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        await updateProfile(
            userCredential.user,
            {
                displayName: name
            }
        );

        showSuccess(
            'Registration successful! You can now login.'
        );

        setTimeout(function() {

            showLogin();

        }, 1500);

    } catch(error) {

        showError(error.message);
    }
};

// LOGIN
window.login = async function() {

    const email =
        document.getElementById('loginEmail').value.trim();

    const password =
        document.getElementById('loginPassword').value;

    if (!email || !password) {

        showError('Please enter email and password');

        return;
    }

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        showSuccess('Login successful!');

        setTimeout(function() {

            window.location.href = 'index.html';

        }, 1000);

    } catch(error) {

        showError(error.message);
    }
};

// AUTO LOGIN
onAuthStateChanged(auth, (user) => {

    if (user) {

        if (
            window.location.pathname.includes('login.html')
        ) {

            window.location.href = 'index.html';
        }
    }
});
