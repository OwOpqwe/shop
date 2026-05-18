For changing from `localStorage` to a real database, the easiest and best option for your snack store is:

# ✅ Use Firebase

Firebase by [Google Firebase](https://firebase.google.com?utm_source=chatgpt.com) gives you:

* Real user accounts
* Cloud database
* Order history saved online
* Works on GitHub Pages
* Free tier
* No backend server needed

---

# ✅ What You’ll Replace

| Current                  | Replace With            |
| ------------------------ | ----------------------- |
| localStorage users       | Firebase Authentication |
| localStorage orders      | Firestore Database      |
| localStorage currentUser | Firebase Auth session   |

---

# ✅ STEP 1 — Create Firebase Project

Go to:

[Firebase Console](https://console.firebase.google.com?utm_source=chatgpt.com)

Then:

1. Click **Create Project**
2. Name it:
   `Snack Store`
3. Continue
4. Create project

---

# ✅ STEP 2 — Enable Authentication

Inside Firebase:

1. Click **Authentication**
2. Click **Get Started**
3. Go to **Sign-in Method**
4. Enable:

   * Email/Password

---

# ✅ STEP 3 — Create Database

1. Click **Firestore Database**
2. Click **Create Database**
3. Start in:

   * Test Mode
4. Choose nearest region

---

# ✅ STEP 4 — Register Web App

1. Click gear ⚙️ → Project Settings
2. Scroll to:
   **Your Apps**
3. Click:
   `</>`
4. App nickname:
   `Snack Store`
5. Register app

Firebase gives you code like this:

```javascript id="k12bgw"
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456",
  appId: "APP_ID"
};
```

You will paste this into your code.

---

# ✅ STEP 5 — Add Firebase to `login.html`

Inside `<head>` add:

```html id="jryqf6"
<script type="module" src="login.js"></script>
```

Then REMOVE the old `<script>` at the bottom.

---

# ✅ STEP 6 — Create `login.js`

Create a NEW file:

# `login.js`

```javascript id="j2h9tz"
import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "123456",
    appId: "APP_ID"
};

// INIT
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

// REGISTER
window.register = async function() {

    const name =
        document.getElementById('registerName').value;

    const email =
        document.getElementById('registerEmail').value;

    const password =
        document.getElementById('registerPassword').value;

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

        alert('Registration successful!');

        showLogin();

    } catch(error) {

        alert(error.message);
    }
};

// LOGIN
window.login = async function() {

    const email =
        document.getElementById('loginEmail').value;

    const password =
        document.getElementById('loginPassword').value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        window.location.href = 'index.html';

    } catch(error) {

        alert(error.message);
    }
};
```

---

# ✅ STEP 7 — Create `firebase.js`

Create another new file:

# `firebase.js`

```javascript id="0cq30w"
import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "123456",
    appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
```

---

# ✅ STEP 8 — Replace `script.js`

At the TOP:

```javascript id="z1t2cq"
import { auth, db } from './firebase.js';
```

Then use Firebase auth instead of localStorage.

---

# ✅ STEP 9 — Save Orders to Firestore

Replace localStorage order saving with:

```javascript id="vmd9jw"
import {
    collection,
    addDoc
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

await addDoc(
    collection(db, "orders"),
    {
        customer: customerName,
        items: cart,
        total: total,
        date: new Date().toISOString(),
        user: auth.currentUser.email
    }
);
```

---

# ✅ STEP 10 — Load Order History

```javascript id="nv43yj"
import {
    collection,
    getDocs
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const querySnapshot =
    await getDocs(collection(db, "orders"));

querySnapshot.forEach((doc) => {

    console.log(doc.data());

});
```

---

# ✅ FINAL FILES

Your project becomes:

```text id="jry1gm"
index.html
login.html
styles.css
script.js
login.js
firebase.js
```

---

# ✅ Benefits

You now get:

* ☁️ Real cloud database
* 🔐 Secure authentication
* 📱 Works across devices
* 👥 Multiple users
* 📦 Real order history
* 🚫 No data loss
* 🌍 Live website backend

---

# ✅ Important for GitHub Pages

In BOTH html files, change:

```html id="lm3hbm"
<script src="script.js"></script>
```

to:

```html id="hlmbjx"
<script type="module" src="script.js"></script>
```

because Firebase uses ES modules.
