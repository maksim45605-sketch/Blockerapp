import { auth, db, functions } from "./firebase-init.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const ADMIN_EMAIL = "m462556532@gmail.com";

const balanceLabel = document.getElementById("balanceLabel");
const balanceMini = document.getElementById("balanceMini");

// admin ui (может отсутствовать)
const adminSelfAmount = document.getElementById("adminSelfAmount");
const adminSelfTopUpBtn = document.getElementById("adminSelfTopUpBtn");
const adminToEmail = document.getElementById("adminToEmail");
const adminToAmount = document.getElementById("adminToAmount");
const adminSendBtn = document.getElementById("adminSendBtn");
const adminError = document.getElementById("adminError");

let currentUid = null;
let currentEmail = null;
let unsub = null;

// ✅ Promise готовности Auth
let authReadyResolved = false;
let _resolveAuthReady;
const authReady = new Promise((resolve) => { _resolveAuthReady = resolve; });

function resolveAuthReadyOnce() {
  if (!authReadyResolved) {
    authReadyResolved = true;
    _resolveAuthReady();
  }
}

function showAdminError(text) {
  if (!adminError) return;
  if (!text) {
    adminError.style.display = "none";
    adminError.textContent = "";
    return;
  }
  adminError.style.display = "block";
  adminError.textContent = text;
}

function formatRub(n) {
  return `${Math.max(0, Math.floor(Number(n) || 0))} ₽`;
}

// ✅ игра вызывает это
export async function addBalance(amount) {
  await authReady;

  if (!currentUid) {
    const err = new Error("NOT_AUTH");
    err.code = "NOT_AUTH";
    throw err;
  }

  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return;

  await updateDoc(doc(db, "users", currentUid), {
    balance: increment(n),
    updatedAt: serverTimestamp(),
  });
}

// админ: пополнить себе
async function adminTopUpSelf(amount) {
  await authReady;
  const email = (currentEmail || "").toLowerCase();
  if (email !== ADMIN_EMAIL.toLowerCase()) throw new Error("NOT_ADMIN");
  await addBalance(amount);
}

adminSelfTopUpBtn?.addEventListener("click", async () => {
  try {
    showAdminError("");
    const val = Number(adminSelfAmount?.value || 0);
    if (!val || val <= 0) return showAdminError("Введи сумму больше 0");
    await adminTopUpSelf(val);
    adminSelfAmount.value = "";
  } catch {
    showAdminError("Нет прав администратора");
  }
});

// админ: отправить по email (если есть функция)
const adminSendMoneyByEmail = httpsCallable(functions, "adminSendMoneyByEmail");

adminSendBtn?.addEventListener("click", async () => {
  try {
    showAdminError("");
    const email = String(adminToEmail?.value || "").trim().toLowerCase();
    const amount = Math.floor(Number(adminToAmount?.value || 0));
    if (!email.includes("@")) return showAdminError("Неверный email");
    if (!amount || amount <= 0) return showAdminError("Неверная сумма");

    adminSendBtn.disabled = true;
    adminSendBtn.textContent = "Отправка...";

    const res = await adminSendMoneyByEmail({ email, amount });
    if (res?.data?.ok) {
      adminSendBtn.textContent = "Готово ✅";
      adminToEmail.value = "";
      adminToAmount.value = "";
      setTimeout(() => (adminSendBtn.textContent = "Отправить деньги по email"), 900);
    } else {
      showAdminError("Не удалось отправить");
      adminSendBtn.textContent = "Отправить деньги по email";
    }
  } catch (e) {
    showAdminError(e?.message || "Ошибка отправки");
    adminSendBtn.textContent = "Отправить деньги по email";
  } finally {
    adminSendBtn.disabled = false;
  }
});

// realtime balance
onAuthStateChanged(auth, (user) => {
  currentUid = user?.uid ?? null;
  currentEmail = user?.email ?? null;

  resolveAuthReadyOnce();

  if (unsub) { unsub(); unsub = null; }

  if (!user) {
    const txt = formatRub(0);
    if (balanceLabel) balanceLabel.textContent = txt;
    if (balanceMini) balanceMini.textContent = txt;
    return;
  }

  unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};
    const bal = Number(data.balance || 0);
    const txt = formatRub(bal);
    if (balanceLabel) balanceLabel.textContent = txt;
    if (balanceMini) balanceMini.textContent = txt;
  });
});
