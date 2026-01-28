import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ADMIN_EMAIL = "m462556532@gmail.com";

const balanceLabel = document.getElementById("balanceLabel");
const balanceMini = document.getElementById("balanceMini");

// admin ui
const adminAmount = document.getElementById("adminAmount");
const adminTopUpBtn = document.getElementById("adminTopUpBtn");

let currentUid = null;
let currentEmail = null;
let unsub = null;

function formatRub(n) {
  return `${Math.max(0, Math.floor(Number(n) || 0))} ₽`;
}

export async function addBalance(amount) {
  if (!currentUid) throw new Error("NOT_AUTH");

  const n = Math.max(0, Math.floor(Number(amount) || 0));
  const ref = doc(db, "users", currentUid);

  await updateDoc(ref, {
    balance: increment(n),
    updatedAt: serverTimestamp(),
  });
}

async function adminTopUpSelf(amount) {
  const email = (currentEmail || "").toLowerCase();
  if (email !== ADMIN_EMAIL.toLowerCase()) throw new Error("NOT_ADMIN");
  await addBalance(amount);
}

adminTopUpBtn?.addEventListener("click", async () => {
  try {
    const val = Number(adminAmount?.value || 0);
    if (!val || val <= 0) return alert("Введи сумму больше 0");
    await adminTopUpSelf(val);
    adminAmount.value = "";
  } catch {
    alert("Нет прав администратора");
  }
});

onAuthStateChanged(auth, (user) => {
  currentUid = user?.uid ?? null;
  currentEmail = user?.email ?? null;

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
