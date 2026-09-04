import { auth } from './firebase.js';

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    getIdTokenResult,
    signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";


/* =========================
   ADMIN SETTINGS
========================= */

// Your admin email
const ADMIN_EMAIL = "charlie197103@gmail.com";

// Temporary verification code.
// IMPORTANT: This is NOT secure because it is visible
// in the website's JavaScript.
const ADMIN_CODE = "123456";


/* =========================
   SHOW CUSTOMER LOGIN
========================= */

window.showLogin = function() {

    document.getElementById('loginForm').style.display = 'block';

    document.getElementById('registerForm').style.display = 'none';

    document.getElementById('adminLoginForm').style.display = 'none';

    document.getElementById('verificationForm').style.display = 'none';

    document.getElementById('formTitle').textContent =
        '🏪 Login to Snack Store';

    hideMessages();
};


/* =========================
   SHOW REGISTER
========================= */

window.showRegister = function() {

    document.getElementById('loginForm').style.display = 'none';

    document.getElementById('registerForm').style.display = 'block';

    document.getElementById('adminLoginForm').style.display = 'none';

    document.getElementById('verificationForm').style.display = 'none';

    document.getElementById('formTitle').textContent =
        '🏪 Register for Snack Store';

    hideMessages();
};


/* =========================
   SHOW ADMIN LOGIN
========================= */

window.showAdminLogin = function() {

    document.getElementById('loginForm').style.display = 'none';

    document.getElementById('registerForm').style.display = 'none';

    document.getElementById('adminLoginForm').style.display = 'block';

    document.getElementById('verificationForm').style.display = 'none';

    document.getElementById('formTitle').textContent =
        '🛡️ Admin Login';

    hideMessages();
};


/* =========================
   SHOW VERIFICATION
========================= */

function showVerification() {

    document.getElementById('loginForm').style.display = 'none';

    document.getElementById('registerForm').style.display = 'none';

    document.getElementById('adminLoginForm').style.display = 'none';

    document.getElementById('verificationForm').style.display = 'block';

    document.getElementById('formTitle').textContent =
        '🔐 Verify Admin Login';

    hideMessages();

    document.getElementById('verificationCode').value = '';

    document.getElementById('verificationCode').focus();
}


/* =========================
   HIDE MESSAGES
========================= */

function hideMessages() {

    document.getElementById('errorMsg').style.display = 'none';

    document.getElementById('successMsg').style.display = 'none';
}


/* =========================
   ERROR
========================= */

function showError(message) {

    const errorMsg =
        document.getElementById('errorMsg');

    errorMsg.textContent = message;

    errorMsg.style.display = 'block';

    document.getElementById('successMsg').style.display = 'none';
}


/* =========================
   SUCCESS
========================= */

function showSuccess(message) {

    const successMsg =
        document.getElementById('successMsg');

    successMsg.textContent = message;

    successMsg.style.display = 'block';

    document.getElementById('errorMsg').style.display = 'none';
}


/* =========================
   REGISTER
========================= */

window.register = async function() {

    const name =
        document.getElementById('registerName')
            .value
            .trim();

    const email =
        document.getElementById('registerEmail')
            .value
            .trim();

    const password =
        document.getElementById('registerPassword')
            .value;

    const confirmPassword =
        document.getElementById('registerConfirmPassword')
            .value;


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


        await signOut(auth);


        showSuccess(
            'Registration successful! You can now login.'
        );


        setTimeout(function() {

            showLogin();

        }, 1500);


    } catch(error) {

        console.error(error);

        showError(
            error.message
        );
    }
};


/* =========================
   CUSTOMER LOGIN
========================= */

window.login = async function() {

    const email =
        document.getElementById('loginEmail')
            .value
            .trim();

    const password =
        document.getElementById('loginPassword')
            .value;


    if (!email || !password) {

        showError(
            'Please enter email and password'
        );

        return;
    }


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        showSuccess(
            'Login successful!'
        );


        setTimeout(function() {

            window.location.href =
                'index.html';

        }, 1000);


    } catch(error) {

        console.error(error);

        showError(
            error.message
        );
    }
};


/* =========================
   ADMIN LOGIN
========================= */

window.adminLogin = async function() {

    const email =
        document.getElementById('adminEmail')
            .value
            .trim();

    const password =
        document.getElementById('adminPassword')
            .value;


    if (!email || !password) {

        showError(
            'Please enter your admin email and password.'
        );

        return;
    }


    if (
        email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        showError(
            'This account is not the administrator account.'
        );

        return;
    }


    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const tokenResult =
            await getIdTokenResult(
                userCredential.user,
                true
            );


        /*
         * Check Firebase custom admin permission.
         */
        if (tokenResult.claims.admin !== true) {

            await signOut(auth);

            showError(
                'This account does not have administrator permission.'
            );

            return;
        }


        /*
         * In this free version, the code is shown
         * on screen instead of being emailed.
         */
        showVerification();


        showSuccess(
            'Admin verified. Enter the verification code: 123456'
        );


    } catch(error) {

        console.error(
            'Admin login error:',
            error
        );

        showError(
            error.message ||
            'Admin login failed.'
        );
    }
};


/* =========================
   VERIFY ADMIN CODE
========================= */

window.verifyAdminCode = async function() {

    const code =
        document.getElementById('verificationCode')
            .value
            .trim();


    if (!/^\d{6}$/.test(code)) {

        showError(
            'Please enter the 6-digit verification code.'
        );

        return;
    }


    if (code !== ADMIN_CODE) {

        showError(
            'Incorrect verification code.'
        );

        return;
    }


    try {

        const user = auth.currentUser;


        if (!user) {

            showError(
                'Your login session has expired. Please login again.'
            );

            showLogin();

            return;
        }


        const tokenResult =
            await getIdTokenResult(
                user,
                true
            );


        if (tokenResult.claims.admin !== true) {

            await signOut(auth);

            showError(
                'Administrator permission could not be verified.'
            );

            showLogin();

            return;
        }


        showSuccess(
            'Admin verification successful!'
        );


        setTimeout(function() {

            window.location.href =
                'index.html';

        }, 1000);


    } catch(error) {

        console.error(
            'Verification error:',
            error
        );

        showError(
            'Admin verification failed.'
        );
    }
};


/* =========================
   AUTH STATE
========================= */

// Do not automatically redirect.
// Admin users must complete verification.

onAuthStateChanged(
    auth,
    (user) => {

        // Intentionally empty.
    }
);
