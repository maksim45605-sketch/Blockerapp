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
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// UI
const profileFab = document.getElementById("profileFab");
const profileOverlay = document.getElementById("profileOverlay");
const profileModal = document.getElementById("profileModal");
const profileClose = document.getElementById("profileClose");

const authView = document.getElementById("authView");
const accountView = document.getElementById("accountView");

const avatarBadge = document.getElementById("avatarBadge");
const avatarBig = document.getElementById("avatarBig");
const avatarInput = document.getElementById("avatarInput");
const saveAvatarBtn = document.getElementById("saveAvatarBtn");
const emojiGrid = document.getElementById("emojiGrid");

const profileEmail = document.getElementById("profileEmail");

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");

let unsubUserDoc = null;

// helpers
function openProfile() {
  profileOverlay.classList.add("show");
  profileModal.classList.add("show");
}
function closeProfile() {
  profileOverlay.classList.remove("show");
  profileModal.classList.remove("show");
}

profileFab?.addEventListener("click", openProfile);
profileOverlay?.addEventListener("click", closeProfile);
profileClose?.addEventListener("click", closeProfile);

function setAvatar(emoji) {
  const safe = (emoji && String(emoji).trim()) ? String(emoji).trim() : "👤";
  if (avatarBadge) avatarBadge.textContent = safe;
  if (avatarBig) avatarBig.textContent = safe;
}

async function ensureUserDoc(uid, email) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: email ?? null,
      balance: 0,
      avatarEmoji: "🙂",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Auth actions
googleLoginBtn?.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  await ensureUserDoc(res.user.uid, res.user.email);
});

emailRegisterBtn?.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  const pass = passEl.value;

  const res = await createUserWithEmailAndPassword(auth, email, pass);
  await ensureUserDoc(res.user.uid, res.user.email);
});

emailLoginBtn?.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  const pass = passEl.value;

  const res = await signInWithEmailAndPassword(auth, email, pass);
  await ensureUserDoc(res.user.uid, res.user.email);
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

// Emoji quick pick
emojiGrid?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-emoji]");
  if (!btn) return;
  const emo = btn.getAttribute("data-emoji");
  if (avatarInput) avatarInput.value = emo;
});

// Save avatar
saveAvatarBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const emo = (avatarInput?.value || "").trim();
  if (!emo) return;

  await updateDoc(doc(db, "users", user.uid), {
    avatarEmoji: emo,
    updatedAt: serverTimestamp(),
  });
});

// State
onAuthStateChanged(auth, (user) => {
  // cleanup old doc listener
  if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }

  if (!user) {
    authView.style.display = "block";
    accountView.style.display = "none";
    profileEmail.textContent = "—";
    setAvatar("👤");
    return;
  }

  authView.style.display = "none";
  accountView.style.display = "block";

  // Email показываем только тут (в профиле)
  profileEmail.textContent = user.email || "—";

  // listen user doc for avatar
  const ref = doc(db, "users", user.uid);
  unsubUserDoc = onSnapshot(ref, (snap) => {
    const data = snap.data() || {};
    setAvatar(data.avatarEmoji || "🙂");
  });
});
