import AsyncStorage from "@react-native-async-storage/async-storage";
import firebaseConfig from "../firebase/config";

// Optional REST backend (Railway/MongoDB). Set EXPO_PUBLIC_BACKEND_URL in env to enable.
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || null;
const BACKEND_TOKEN_KEY = "backend_token";

let firebaseApp = null;
let auth = null;
let firestore = null;

// Local auth fallback state
let _localUser = null;
const _authListeners = new Set();
const _logListeners = new Set();

const isConfigPresent = firebaseConfig && firebaseConfig.apiKey;

// Compute a SHA256 hash using crypto-js if available. Falls back to returning
// the raw string (salt+password) when `crypto-js` isn't installed so the
// app still works in development. Installing `crypto-js` is recommended.
async function computeHash(input) {
  try {
    const mod = await import("crypto-js");
    const Crypto = mod && mod.default ? mod.default : mod;
    return Crypto.SHA256(input).toString();
  } catch (e) {
    console.warn(
      "crypto-js not installed — falling back to insecure plaintext hashing. Install with: npm install crypto-js"
    );
    return input;
  }
}

async function tryInitFirebase() {
  if (!isConfigPresent) return false;
  if (firebaseApp) return true;

  try {
    // dynamic import so project doesn't break if firebase not installed yet
    const firebase = await import("firebase/app");
    await import("firebase/auth");
    await import("firebase/firestore");

    if (!firebase.getApps || firebase.getApps().length === 0) {
      firebase.initializeApp(firebaseConfig);
    }
    firebaseApp = firebase.getApp ? firebase.getApp() : firebase.app();
    auth = firebase.auth();
    firestore = firebase.firestore();

    // sign in anonymously if not signed in
    if (!auth.currentUser) {
      // do not force anonymous sign-in for explicit auth flows; keep anonymous sign-in
      // as a fallback for apps that don't configure auth. We'll sign in anonymously here.
      try {
        await auth.signInAnonymously();
      } catch (e) {
        // ignore anonymous sign-in errors
      }
    }

    return true;
  } catch (err) {
    // firebase not installed or init failed — fall back to AsyncStorage
    console.warn("Firebase init failed, falling back to local storage:", err.message || err);
    firebaseApp = null;
    auth = null;
    firestore = null;
    return false;
  }
}

async function backendFetch(path, opts = {}) {
  if (!BACKEND_URL) throw new Error("No backend configured");
  const url = `${BACKEND_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  try {
    const token = await AsyncStorage.getItem(BACKEND_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...opts, headers });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
    if (!res.ok) {
      const err = new Error((json && json.error) || `Request failed: ${res.status}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  } catch (e) {
    throw e;
  }
}

// AUTH helpers
async function signUp(email, password) {
  const ok = await tryInitFirebase();
  if (!ok) {
    console.log("signUp: using local fallback for", email);
    // Local signup fallback (stores users in AsyncStorage under 'local_users')
    const saved = await AsyncStorage.getItem("local_users");
    const users = saved ? JSON.parse(saved) : [];
    if (users.find((u) => u.email === email)) {
      const e = new Error("Email already in use");
      e.code = "auth/email-already-in-use";
      throw e;
    }
    // hash password with per-user salt
    const salt = Date.now().toString() + Math.random().toString(36).slice(2);
    const passwordHash = await computeHash(salt + password);
    const user = { uid: Date.now().toString(), email, passwordHash, salt };
    users.push(user);
    await AsyncStorage.setItem("local_users", JSON.stringify(users));
    _localUser = { uid: user.uid, email: user.email };
    await AsyncStorage.setItem("local_session", JSON.stringify(_localUser));
    // notify listeners
    _authListeners.forEach((cb) => cb(_localUser));
    return _localUser;
  }
  try {
    console.log("signUp: using firebase for", email);
    const res = await auth.createUserWithEmailAndPassword(email, password);
    return res.user;
  } catch (err) {
    console.error("signUp firebase error:", err);
    const code = err.code || "auth/error";
    let msg = err.message || "Sign up failed";
    if (code === "auth/email-already-in-use") msg = "Email already in use";
    if (code === "auth/invalid-email") msg = "Invalid email address";
    if (code === "auth/weak-password") msg = "Password is too weak";
    const e = new Error(msg);
    e.code = code;
    throw e;
  }
}

async function signIn(email, password) {
  const ok = await tryInitFirebase();
  if (!ok) {
    console.log("signIn: using local fallback for", email);
    // Local signin fallback
    const saved = await AsyncStorage.getItem("local_users");
    const users = saved ? JSON.parse(saved) : [];
    const userByEmail = users.find((u) => u.email === email);
    if (!userByEmail) {
      const e = new Error("Account not found");
      e.code = "auth/user-not-found";
      throw e;
    }
    // support hashed password storage; if legacy plain password exists, upgrade it
    if (userByEmail.passwordHash && userByEmail.salt) {
      const hash = await computeHash(userByEmail.salt + password);
      if (hash !== userByEmail.passwordHash) {
        const e = new Error("Incorrect password");
        e.code = "auth/wrong-password";
        throw e;
      }
    } else if (userByEmail.password) {
      // legacy plain password
      if (userByEmail.password !== password) {
        const e = new Error("Incorrect password");
        e.code = "auth/wrong-password";
        throw e;
      }
      // upgrade stored user to hashed password
      const salt = Date.now().toString() + Math.random().toString(36).slice(2);
      const passwordHash = await computeHash(salt + password);
      userByEmail.passwordHash = passwordHash;
      userByEmail.salt = salt;
      delete userByEmail.password;
      const updated = users.map((u) => (u.email === userByEmail.email ? userByEmail : u));
      await AsyncStorage.setItem("local_users", JSON.stringify(updated));
    }
    _localUser = { uid: userByEmail.uid, email: userByEmail.email };
    await AsyncStorage.setItem("local_session", JSON.stringify(_localUser));
    _authListeners.forEach((cb) => cb(_localUser));
    return _localUser;
  }
  try {
    console.log("signIn: using firebase for", email);
    const res = await auth.signInWithEmailAndPassword(email, password);
    return res.user;
  } catch (err) {
    console.error("signIn firebase error:", err);
    // Map firebase auth errors to friendly messages
    const code = err.code || "auth/error";
    let msg = err.message || "Authentication failed";
    if (code === "auth/user-not-found") msg = "Account not found";
    if (code === "auth/wrong-password") msg = "Incorrect password";
    if (code === "auth/invalid-email") msg = "Invalid email address";
    const e = new Error(msg);
    e.code = code;
    throw e;
  }
}

async function signOutUser() {
  const ok = await tryInitFirebase();
  if (!ok) {
    _localUser = null;
    await AsyncStorage.removeItem("local_session");
    _authListeners.forEach((cb) => cb(null));
    return;
  }
  try {
    await auth.signOut();
  } catch (err) {
    console.warn("signOut failed", err.message || err);
  }
}

function subscribeAuthState(callback) {
  // returns unsubscribe
  let unsubbed = false;
  // If Firebase available, use its listener
  tryInitFirebase().then((ok) => {
    if (ok) {
      const unsub = auth.onAuthStateChanged((user) => callback(user));
      // also add to local listeners set for symmetry
      _authListeners.add(callback);
      return;
    }
    // fallback: register local listener and emit current local session
    _authListeners.add(callback);
    (async () => {
      const sess = await AsyncStorage.getItem("local_session");
      if (sess) callback(JSON.parse(sess));
      else callback(null);
    })();
  });

  return () => {
    if (unsubbed) return;
    _authListeners.delete(callback);
    unsubbed = true;
  };
}

function getCurrentUser() {
  try {
    if (auth && auth.currentUser) return auth.currentUser;
    if (_localUser) return _localUser;
    return null;
  } catch (e) {
    return null;
  }
}

async function saveUserProfile(profile) {
  const ok = await tryInitFirebase();
  // prefer current firebase user; if not present, try local session
  let user = getCurrentUser();
  if (!user) {
    const sess = await AsyncStorage.getItem("local_session");
    user = sess ? JSON.parse(sess) : null;
  }
  if (!user) throw new Error("Not authenticated");
  if (!ok) {
    // local save
    const key = `user:${user.uid}`;
    await AsyncStorage.setItem(key, JSON.stringify({ ...profile, uid: user.uid }));
    return true;
  }
  try {
    await firestore.collection("users").doc(user.uid).set({ ...profile, uid: user.uid }, { merge: true });
    return true;
  } catch (err) {
    throw err;
  }
}

async function fetchUserProfile(uid) {
  const ok = await tryInitFirebase();
  if (!ok) {
    const key = `user:${uid}`;
    const saved = await AsyncStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }
  try {
    const doc = await firestore.collection("users").doc(uid).get();
    return doc.exists ? doc.data() : null;
  } catch (err) {
    console.warn("fetchUserProfile failed", err.message || err);
    return null;
  }
}

function getUserId() {
  try {
    return (auth && auth.currentUser && auth.currentUser.uid) || "local";
  } catch (e) {
    return "local";
  }
}

async function fetchLogs() {
  const ok = await tryInitFirebase();
  if (!ok) {
    const saved = await AsyncStorage.getItem("logs");
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const uid = getUserId();
    const q = await firestore.collection("logs").where("uid", "==", uid).get();
    const items = [];
    q.forEach((doc) => {
      items.push(doc.data());
    });
    // ensure AsyncStorage also updated for offline
    await AsyncStorage.setItem("logs", JSON.stringify(items));
    return items;
  } catch (err) {
    console.warn("fetchLogs firestore failed, using local:", err.message || err);
    const saved = await AsyncStorage.getItem("logs");
    return saved ? JSON.parse(saved) : [];
  }
}

async function saveLog(log) {
  const ok = await tryInitFirebase();
  if (!ok) {
    const saved = await AsyncStorage.getItem("logs");
    const parsed = saved ? JSON.parse(saved) : [];
    const updated = [...parsed, log];
    await AsyncStorage.setItem("logs", JSON.stringify(updated));
    // notify listeners of updated logs
    (async () => {
      const items = await fetchLogs();
      _logListeners.forEach((cb) => cb(items));
    })();
    return log;
  }

  try {
    const uid = getUserId();
    const docRef = firestore.collection("logs").doc(log.id);
    await docRef.set({ ...log, uid });
    // update AsyncStorage
    const saved = await AsyncStorage.getItem("logs");
    const parsed = saved ? JSON.parse(saved) : [];
    await AsyncStorage.setItem("logs", JSON.stringify([...parsed.filter(l => l.id !== log.id), log]));
      // notify listeners of updated logs
      (async () => {
        const items = await fetchLogs();
        _logListeners.forEach((cb) => cb(items));
      })();
    return log;
  } catch (err) {
    console.warn("saveLog firestore failed, saving local:", err.message || err);
    const saved = await AsyncStorage.getItem("logs");
    const parsed = saved ? JSON.parse(saved) : [];
    const updated = [...parsed, log];
    await AsyncStorage.setItem("logs", JSON.stringify(updated));
      // notify listeners of updated logs
      (async () => {
        const items = await fetchLogs();
        _logListeners.forEach((cb) => cb(items));
      })();
    return log;
  }
}

async function deleteLog(id) {
  const ok = await tryInitFirebase();
  if (!ok) {
    const saved = await AsyncStorage.getItem("logs");
    const parsed = saved ? JSON.parse(saved) : [];
    const updated = parsed.filter((l) => l.id !== id);
    await AsyncStorage.setItem("logs", JSON.stringify(updated));
    // notify listeners of updated logs
    (async () => {
      const items = await fetchLogs();
      _logListeners.forEach((cb) => cb(items));
    })();
    return true;
  }

  try {
    await firestore.collection("logs").doc(id).delete();
    const saved = await AsyncStorage.getItem("logs");
    const parsed = saved ? JSON.parse(saved) : [];
    await AsyncStorage.setItem("logs", JSON.stringify(parsed.filter(l => l.id !== id)));
      // notify listeners of updated logs
      (async () => {
        const items = await fetchLogs();
        _logListeners.forEach((cb) => cb(items));
      })();
    return true;
  } catch (err) {
    console.warn("deleteLog firestore failed, deleting local:", err.message || err);
    const saved = await AsyncStorage.getItem("logs");
    const parsed = saved ? JSON.parse(saved) : [];
    const updated = parsed.filter((l) => l.id !== id);
    await AsyncStorage.setItem("logs", JSON.stringify(updated));
      // notify listeners of updated logs
      (async () => {
        const items = await fetchLogs();
        _logListeners.forEach((cb) => cb(items));
      })();
    return true;
  }
}

function subscribeLogs(callback) {
  _logListeners.add(callback);
  // immediately emit current logs
  (async () => {
    try {
      const items = await fetchLogs();
      callback(items);
    } catch (e) {
      callback([]);
    }
  })();
  return () => {
    _logListeners.delete(callback);
  };
}

// Custom meals: stored in collection 'customMeals' with doc id = meal.id
async function fetchCustomMeals() {
  const ok = await tryInitFirebase();
  if (!ok) {
    const saved = await AsyncStorage.getItem("customMeals");
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const uid = getUserId();
    const q = await firestore.collection("customMeals").where("uid", "==", uid).get();
    const items = [];
    q.forEach((doc) => items.push(doc.data()));
    await AsyncStorage.setItem("customMeals", JSON.stringify(items));
    return items;
  } catch (err) {
    console.warn("fetchCustomMeals failed, using local:", err.message || err);
    const saved = await AsyncStorage.getItem("customMeals");
    return saved ? JSON.parse(saved) : [];
  }
}

async function saveCustomMeal(meal) {
  const ok = await tryInitFirebase();
  if (!ok) {
    const saved = await AsyncStorage.getItem("customMeals");
    const parsed = saved ? JSON.parse(saved) : [];
    const updated = [...parsed, meal];
    await AsyncStorage.setItem("customMeals", JSON.stringify(updated));
    return meal;
  }

  try {
    const uid = getUserId();
    const docRef = firestore.collection("customMeals").doc(meal.id);
    await docRef.set({ ...meal, uid });
    const saved = await AsyncStorage.getItem("customMeals");
    const parsed = saved ? JSON.parse(saved) : [];
    await AsyncStorage.setItem("customMeals", JSON.stringify([...parsed.filter(m => m.id !== meal.id), meal]));
    return meal;
  } catch (err) {
    console.warn("saveCustomMeal firestore failed, saving local:", err.message || err);
    const saved = await AsyncStorage.getItem("customMeals");
    const parsed = saved ? JSON.parse(saved) : [];
    const updated = [...parsed, meal];
    await AsyncStorage.setItem("customMeals", JSON.stringify(updated));
    return meal;
  }
}

async function deleteCustomMeal(id) {
  const ok = await tryInitFirebase();
  if (!ok) {
    const saved = await AsyncStorage.getItem("customMeals");
    const parsed = saved ? JSON.parse(saved) : [];
    const updated = parsed.filter((m) => m.id !== id);
    await AsyncStorage.setItem("customMeals", JSON.stringify(updated));
    return true;
  }

  try {
    await firestore.collection("customMeals").doc(id).delete();
    const saved = await AsyncStorage.getItem("customMeals");
    const parsed = saved ? JSON.parse(saved) : [];
    await AsyncStorage.setItem("customMeals", JSON.stringify(parsed.filter(m => m.id !== id)));
    return true;
  } catch (err) {
    console.warn("deleteCustomMeal firestore failed, deleting local:", err.message || err);
    const saved = await AsyncStorage.getItem("customMeals");
    const parsed = saved ? JSON.parse(saved) : [];
    const updated = parsed.filter((m) => m.id !== id);
    await AsyncStorage.setItem("customMeals", JSON.stringify(updated));
    return true;
  }
}

export {
    // logs / meals
    deleteCustomMeal,
    deleteLog,
    fetchCustomMeals,
    fetchLogs, fetchUserProfile, getCurrentUser, saveCustomMeal,
    saveLog,
    // user profile
    saveUserProfile, signIn,
    signOutUser,
    // auth
    signUp, subscribeAuthState,
    // log subscriptions
    subscribeLogs, tryInitFirebase
};

