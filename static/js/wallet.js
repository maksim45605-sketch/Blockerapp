import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const balanceLabel = document.getElementById("balanceLabel");   // внутри профиля
const balanceMini = document.getElementById("balanceMini");     // на кнопке в углу

let currentUid = null;
let currentBalance = 0;
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

onAuthStateChanged(auth, (user) => {
  currentUid = user?.uid ?? null;

  if (unsub) { unsub(); unsub = null; }

  if (!user) {
    currentBalance = 0;
    if (balanceLabel) balanceLabel.textContent = formatRub(0);
    if (balanceMini) balanceMini.textContent = formatRub(0);
    return;
  }

  const ref = doc(db, "users", user.uid);
  unsub = onSnapshot(ref, (snap) => {
    const data = snap.data() || {};
    currentBalance = Number(data.balance || 0);

    const txt = formatRub(currentBalance);
    if (balanceLabel) balanceLabel.textContent = txt;
    if (balanceMini) balanceMini.textContent = txt;
  });
});
