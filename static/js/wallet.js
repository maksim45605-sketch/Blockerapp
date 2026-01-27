import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const balanceLabel = document.getElementById("balanceLabel");

let currentUid = null;
let currentBalance = 0;
let unsub = null;

function formatRub(n) {
  return `${Math.max(0, Math.floor(Number(n) || 0))} ₽`;
}

export function getBalance() {
  return currentBalance;
}

export async function addBalance(amount) {
  if (!currentUid) throw new Error("NOT_AUTH");
  const ref = doc(db, "users", currentUid);

  const n = Math.max(0, Math.floor(Number(amount) || 0));
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
    return;
  }

  const ref = doc(db, "users", user.uid);
  unsub = onSnapshot(ref, (snap) => {
    const data = snap.data() || {};
    currentBalance = Number(data.balance || 0);
    if (balanceLabel) balanceLabel.textContent = formatRub(currentBalance);
  });
});
