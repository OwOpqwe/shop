import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ✅ YOUR FIXED CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyDhzfNAuJWW09uiXm2sj3apnG48Y7MFLs4",
    authDomain: "snack-store-ecc61.firebaseapp.com",
    projectId: "snack-store-ecc61",
    storageBucket: "snack-store-ecc61.appspot.com",
    messagingSenderId: "373410660807",
    appId: "1:373410660807:web:9e16901f9602f05713d9e2",
    measurementId: "G-P0EERKE117"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// keeps user logged in
setPersistence(auth, browserLocalPersistence).catch(console.error);
