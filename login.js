import { auth, functions } from './firebase.js';

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";


/* =========================
   CLOUD FUNCTIONS
========================= */

const sendAdminCode =
    httpsCallable(functions, "sendAdminCode");

const verifyAdminCodeFunction =
    httpsCallable(functions, "verifyAdminCode");


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
   ERROR MESSAGE
========================= */

function showError(message) {

    const errorMsg =
        document.getElementById('errorMsg');

    errorMsg.textContent = message;

    errorMsg.style.display = 'block';

    document.getElementById('successMsg').style.display = 'none';
}


/* =========================
   SUCCESS MESSAGE
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
        document.getElementById('loginEmail').value.trim();

    const password =
        document.getElementById('loginPassword').value;


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
        document.getElementById('adminEmail').value.trim();

    const password =
        document.getElementById('adminPassword').value;


    if (!email || !password) {

        showError(
            'Please enter your admin email and password.'
        );

        return;
    }


    try {

        // Sign in normally first
        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        // Force Firebase to refresh the ID token
        // so we get the latest admin claim.
        const tokenResult =
            await getIdTokenResult(
                user,
                true
            );


        // Check the admin custom claim.
        if (tokenResult.claims.admin !== true) {

            showError(
                'This account does not have administrator permission.'
            );

            return;
        }


        showSuccess(
            'Admin account verified. Sending code...'
        );


        // Cloud Function sends the 6-digit code.
        await sendAdminCode();


        showVerification();


        showSuccess(
            'Verification code sent to the administrator email.'
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


    try {

        showSuccess(
            'Checking verification code...'
        );


        await verifyAdminCodeFunction({
            code: code
        });


        showSuccess(
            'Admin verification successful!'
        );


        /*
         * Temporary destination.
         *
         * We will create the actual admin page
         * later.
         */
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
            error.message ||
            'Incorrect verification code.'
        );
    }
};


/* =========================
   AUTH STATE
========================= */

// Do NOT automatically redirect users here.
//
// Admin users must be allowed to complete
// the verification-code step.

onAuthStateChanged(
    auth,
    (user) => {

        // Intentionally empty.
        //
        // Login buttons control navigation.
    }
);
