import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ВСТАВЬ СВОЙ КОНФИГ из Firebase Console → Project settings → Web app
const firebaseConfig = {
  apiKey: "AIzaSyCbqSbH2jUJ7SZXLZPPIUsTfV1ggt0OyoU",
  authDomain: "rknblockers.firebaseapp.com",
  projectId: "rknblockers",
  storageBucket: "rknblockers.firebasestorage.app",
  messagingSenderId: "334341413972",
  appId: "1:334341413972:web:f3d57be7671ad6c27021c1",
  measurementId: "G-GRJB7LVZWX"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
