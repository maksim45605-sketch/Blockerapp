import { auth, db } from "./firebase-init.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const userLabel = document.getElementById("userLabel");

async function ensureUserDoc(uid, email) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: email ?? null,
      balance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

document.getElementById("googleLoginBtn")?.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  await ensureUserDoc(res.user.uid, res.user.email);
});

document.getElementById("emailRegisterBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;

  const res = await createUserWithEmailAndPassword(auth, email, pass);
  await ensureUserDoc(res.user.uid, res.user.email);
});

document.getElementById("emailLoginBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;

  const res = await signInWithEmailAndPassword(auth, email, pass);
  await ensureUserDoc(res.user.uid, res.user.email);
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  userLabel.textContent = user ? (user.email || user.uid) : "—";
});
