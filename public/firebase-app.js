import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase Web configuration (public app identifiers only; never put service-account keys here).
const firebaseConfig = {
  apiKey: "AIzaSyDmf98Ld_I-FvfPLrUoZfafJuD6tay417kE",
  authDomain: "sistema-kennedy.firebaseapp.com",
  projectId: "sistema-kennedy",
  storageBucket: "sistema-kennedy.firebasestorage.app",
  messagingSenderId: "786974792038",
  appId: "1:786974792038:web:a7af20eb84b4cc2a2450a7",
  measurementId: "G-EXRYQNK2D3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DEMO_ELECTION_ID = "ELEITORAL-DIGITAL-DEMO-2026";
const $ = (id) => document.getElementById(id);

function notify(message) {
  if (typeof window.toast === "function") window.toast(message);
  else alert(message);
}
function normalizeEmail(value) { return String(value || "").trim().toLowerCase(); }
function setBusy(form, busy) {
  const submit = form.querySelector('button[type="submit"]');
  if (!submit) return;
  if (!submit.dataset.label) submit.dataset.label = submit.textContent;
  submit.disabled = busy;
  submit.textContent = busy ? "Aguarde..." : submit.dataset.label;
}
function setAccount(user, profile = {}) {
  window.demoCurrentAccount = {
    uid: user.uid, email: user.email || "",
    fullName: profile.fullName || user.displayName || "",
    role: profile.role || "Participante demonstrativo"
  };
  if (typeof window.renderAccountProfile === "function") window.renderAccountProfile();
}
function enterPanel() { $("authGate").style.display = "none"; }
function showAuthGate() { $("authGate").style.display = "flex"; }

async function loadProfile(user) {
  const profileRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(profileRef);
  const profile = snapshot.exists() ? snapshot.data() : {};
  setAccount(user, profile);
  enterPanel();
}
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.demoCurrentAccount = null;
    showAuthGate();
    return;
  }
  try { await loadProfile(user); }
  catch (error) {
    console.error("Firebase profile:", error);
    notify("Login concluído, mas não foi possível carregar o perfil. Confira as regras do Firestore.");
    showAuthGate();
  }
});

$("signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fullName = $("signupFullName").value.trim();
  const email = normalizeEmail($("signupEmail").value);
  const password = $("signupPassword").value;
  const role = $("signupRole").value;
  if (password.length < 8 || password.length > 64) {
    notify("Use uma senha com 8 a 64 caracteres."); return;
  }
  setBusy(form, true);
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: fullName });
    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid, fullName, email, role,
      createdAt: serverTimestamp(), demo: true
    });
    setAccount(credential.user, { fullName, role });
    enterPanel();
    notify("Conta criada no Firebase. Use somente dados de demonstração.");
  } catch (error) {
    console.error("Firebase signup:", error);
    notify(authMessage(error.code));
  } finally { setBusy(form, false); }
});

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = normalizeEmail($("loginEmail").value);
  const password = $("loginPassword").value;
  setBusy(form, true);
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(credential.user);
    notify("Login realizado.");
  } catch (error) {
    console.error("Firebase login:", error);
    notify(authMessage(error.code));
  } finally { setBusy(form, false); }
});

window.firebaseDemoSubmitVote = async ({ candidateId, candidateName, city, state }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Entre na sua conta antes de votar.");
  const voteRef = doc(db, "demoVotes", user.uid);
  const existing = await getDoc(voteRef);
  if (existing.exists()) throw new Error("Esta conta já registrou um voto nesta eleição demonstrativa.");
  await setDoc(voteRef, {
    uid: user.uid, electionId: DEMO_ELECTION_ID,
    candidateId, candidateName, city, state,
    createdAt: serverTimestamp(), demo: true
  });
};

window.firebaseDemoLogout = async () => {
  await signOut(auth);
  window.demoCurrentAccount = null;
  showAuthGate();
};
window.logoutDemo = window.firebaseDemoLogout;

window.firebaseDemoPasswordReset = async () => {
  const email = normalizeEmail($("loginEmail").value || $("signupEmail").value);
  if (!email) { notify("Informe o e-mail no campo de login para recuperar a senha."); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    notify("Se houver uma conta com esse e-mail, o Firebase enviará as instruções de recuperação.");
  } catch (error) { notify(authMessage(error.code)); }
};

function authMessage(code) {
  const messages = {
    "auth/email-already-in-use": "Esse e-mail já possui uma conta.",
    "auth/invalid-email": "O formato do e-mail não é válido.",
    "auth/weak-password": "A senha é fraca. Use pelo menos 8 caracteres.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-not-found": "Não encontramos uma conta com esse e-mail.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
    "auth/network-request-failed": "Falha de conexão. Verifique a internet."
  };
  return messages[code] || "Não foi possível concluir. Confira se o método E-mail/senha está ativado no Firebase Authentication.";
}
