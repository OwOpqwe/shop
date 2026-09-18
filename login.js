javascript
import { auth } from './firebase.js';

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";


// ========================================
// ADMIN SETTINGS
// ========================================

const ADMIN_EMAIL = "charlie197103@gmail.com";

// Change this to whatever fixed code you want
const ADMIN_CODE = "123456";


// ========================================
// GET HTML ELEMENTS
// ========================================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const adminLoginForm = document.getElementById("adminLoginForm");
const adminCodeForm = document.getElementById("adminCodeForm");

const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");


// ========================================
// HELPER FUNCTIONS
// ========================================

function showError(message) {
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = "block";
    }

    if (successMsg) {
        successMsg.style.display = "none";
    }
}

function showSuccess(message) {
    if (successMsg) {
        successMsg.textContent = message;
        successMsg.style.display = "block";
    }

    if (errorMsg) {
        errorMsg.style.display = "none";
    }
}


// ========================================
// CUSTOMER LOGIN
// ========================================

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        showError("");
        showSuccess("");

        try {
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            window.location.href = "index.html";

        } catch (error) {
            console.error("Customer login error:", error);

            showError(
                error.message || "Failed to log in."
            );
        }
    });
}


// ========================================
// CUSTOMER REGISTER
// ========================================

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("registerConfirmPassword").value;

        showError("");
        showSuccess("");

        // Check passwords
        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            return;
        }

        // Basic password length check
        if (password.length < 6) {
            showError(
                "Password must be at least 6 characters."
            );
            return;
        }

        try {
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            // Save the user's name
            await updateProfile(
                userCredential.user,
                {
                    displayName: name
                }
            );

            showSuccess(
                "Account created successfully! You can now log in."
            );

            registerForm.reset();

        } catch (error) {
            console.error("Registration error:", error);

            showError(
                error.message || "Failed to create account."
            );
        }
    });
}


// ========================================
// ADMIN LOGIN
// ========================================

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email =
            document.getElementById("adminEmailInput").value.trim();

        const password =
            document.getElementById("adminPasswordInput").value;

        showError("");
        showSuccess("");

        // Make sure the correct admin email is being used
        if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            showError(
                "This email does not have administrator access."
            );
            return;
        }

        try {
            // Sign in with Firebase
            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            // Force Firebase to refresh the ID token
            // so we get the newest custom claims
            const tokenResult =
                await getIdTokenResult(user, true);

            // Check Firebase administrator permission
            if (tokenResult.claims.admin !== true) {
                showError(
                    "This account does not have administrator permission."
                );
                return;
            }

            // Admin is valid.
            // Show the fixed-code screen.
            if (adminLoginForm) {
                adminLoginForm.style.display = "none";
            }

            if (adminCodeForm) {
                adminCodeForm.style.display = "block";
            }

            showSuccess(
                "Administrator verified. Enter the administrator code."
            );

        } catch (error) {
            console.error("Admin login error:", error);

            showError(
                error.message || "Failed to log in as administrator."
            );
        }
    });
}


// ========================================
// ADMIN FIXED CODE
// ========================================

if (adminCodeForm) {
    adminCodeForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const enteredCode =
            document.getElementById("adminCodeInput").value.trim();

        showError("");
        showSuccess("");

        // Check the fixed code
        if (enteredCode !== ADMIN_CODE) {
            showError("Incorrect administrator code.");
            return;
        }

        try {
            const user = auth.currentUser;

            if (!user) {
                showError(
                    "Your administrator login session has expired."
                );
                return;
            }

            // Check the Firebase admin claim again
            const tokenResult =
                await getIdTokenResult(user, true);

            if (tokenResult.claims.admin !== true) {
                showError(
                    "You do not have administrator permission."
                );
                return;
            }

            // Everything is correct
            showSuccess(
                "Administrator verification successful!"
            );

            // Go to dashboard
            window.location.href = "admin.html";

        } catch (error) {
            console.error(
                "Administrator code verification error:",
                error
            );

            showError(
                "Could not verify administrator permission."
            );
        }
    });
}

