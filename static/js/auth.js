import { auth, db } from "./firebase-init.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ADMIN_EMAIL = "m462556532@gmail.com";

// profile modal open/close
const profileFab = document.getElementById("profileFab");
const profileOverlay = document.getElementById("profileOverlay");
const profileModal = document.getElementById("profileModal");
const profileClose = document.getElementById("profileClose");

// views
const loadingView = document.getElementById("loadingView");
const authView = document.getElementById("authView");
const accountView = document.getElementById("accountView");

// avatar ui
const avatarBadge = document.getElementById("avatarBadge");
const avatarBig = document.getElementById("avatarBig");
const avatarInput = document.getElementById("avatarInput");
const saveAvatarBtn = document.getElementById("saveAvatarBtn");
const emojiGrid = document.getElementById("emojiGrid");

// profile info
const profileEmail = document.getElementById("profileEmail");

// auth inputs/buttons
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authError = document.getElementById("authError");

// admin
const adminPanel = document.getElementById("adminPanel");

let unsubUserDoc = null;

function showAuthError(text) {
  if (!authError) return;
  if (!text) {
    authError.style.display = "none";
    authError.textContent = "";
    return;
  }
  authError.style.display = "block";
  authError.textContent = text;
}

function setViews(mode) {
  // mode: "loading" | "out" | "in"
  if (loadingView) loadingView.style.display = (mode === "loading") ? "block" : "none";
  if (authView) authView.style.display = (mode === "out") ? "block" : "none";
  if (accountView) accountView.style.display = (mode === "in") ? "block" : "none";
}

function openProfile() {
  profileOverlay?.classList.add("show");
  profileModal?.classList.add("show");
}
function closeProfile() {
  profileOverlay?.classList.remove("show");
  profileModal?.classList.remove("show");
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
      emailLower: (email ?? "").toLowerCase(),
      balance: 0,
      avatarEmoji: "🙂",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

function humanAuthError(e) {
  const code = e?.code || "";
  if (code === "auth/email-already-in-use") return "занято";
  if (code === "auth/invalid-email") return "Некорректный email";
  if (code === "auth/weak-password") return "Пароль минимум 6 символов";
  if (code === "auth/wrong-password") return "Неверный пароль";
  if (code === "auth/user-not-found") return "Пользователь не найден";
  if (code === "auth/too-many-requests") return "Слишком много попыток. Попробуй позже";
  if (code === "auth/popup-closed-by-user") return "Окно входа закрыто";
  return "Ошибка авторизации";
}

// ✅ фикс сохранения входа (чтобы после перезагрузки не слетало)
setViews("loading");
setPersistence(auth, browserLocalPersistence).catch(() => {
  // даже если не получилось — не блокируем
});

// auth actions
googleLoginBtn?.addEventListener("click", async () => {
  try {
    showAuthError("");
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    await ensureUserDoc(res.user.uid, res.user.email);
  } catch (e) {
    showAuthError(humanAuthError(e));
  }
});

emailRegisterBtn?.addEventListener("click", async () => {
  try {
    showAuthError("");
    const email = (emailEl?.value || "").trim();
    const pass = passEl?.value || "";
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await ensureUserDoc(res.user.uid, res.user.email);
  } catch (e) {
    showAuthError(humanAuthError(e));
  }
});

emailLoginBtn?.addEventListener("click", async () => {
  try {
    showAuthError("");
    const email = (emailEl?.value || "").trim();
    const pass = passEl?.value || "";
    const res = await signInWithEmailAndPassword(auth, email, pass);
    await ensureUserDoc(res.user.uid, res.user.email);
  } catch (e) {
    showAuthError(humanAuthError(e));
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

// emoji pick
emojiGrid?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-emoji]");
  if (!btn) return;
  const emo = btn.getAttribute("data-emoji");
  if (avatarInput) avatarInput.value = emo;
});

// save avatar
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

// ✅ главный переключатель UI
onAuthStateChanged(auth, (user) => {
  if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }

  if (!user) {
    setViews("out");
    if (adminPanel) adminPanel.style.display = "none";
    if (profileEmail) profileEmail.textContent = "—";
    setAvatar("👤");
    return;
  }

  setViews("in");

  if (profileEmail) profileEmail.textContent = user.email || "—";
  const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (adminPanel) adminPanel.style.display = isAdmin ? "block" : "none";

  unsubUserDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};
    setAvatar(data.avatarEmoji || "🙂");
  });
});
