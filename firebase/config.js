// Paste your Firebase config here or set these values via environment variables.
// Example config (replace with your project's values):
// export default {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "your-app.firebaseapp.com",
//   projectId: "your-app-id",
//   storageBucket: "your-app.appspot.com",
//   messagingSenderId: "...",
//   appId: "1:...:web:...",
// };

// Firebase config: reads from environment variables when available.
// For Expo, prefer `EXPO_PUBLIC_` prefixed vars for client usage.
// Example env names supported (priority order):
// EXPO_PUBLIC_FIREBASE_API_KEY, FIREBASE_API_KEY
// EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, FIREBASE_AUTH_DOMAIN
// EXPO_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_PROJECT_ID
// EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, FIREBASE_STORAGE_BUCKET
// EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, FIREBASE_MESSAGING_SENDER_ID
// EXPO_PUBLIC_FIREBASE_APP_ID, FIREBASE_APP_ID

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "",
};

export default firebaseConfig;
