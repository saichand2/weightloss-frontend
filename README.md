# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

Run on web (mobile-first)

1. Install dependencies

```bash
npm install
```

2. Start the app on web (Expo serves a web app that uses react-native-web)

```bash
npm run web
# or
npx expo start --web
```

3. To create a production-friendly static web build (for hosting)

```bash
npx expo build:web
# or use `eas build` for advanced workflows
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## node server.js

## npx expo start -c

## Firebase (Centralized storage - optional)

If you want logs and custom meals to sync across devices, you can enable Firebase Firestore.

1. Install the Firebase SDK:

```powershell
npm install firebase
```

If you want improved local password security (development only), install `crypto-js`:

```powershell
npm install crypto-js
```

2. Create a Firebase project (Spark tier is free) and enable **Firestore** and **Anonymous Authentication**.

3. Copy your Firebase config settings from the Firebase console and paste them into `firebase/config.js`.
    - Do NOT commit secrets to public repos. Prefer environment variables if you share the repo.

Example `firebase/config.js`:

```js
export default {
   apiKey: "YOUR_API_KEY",
   authDomain: "your-app.firebaseapp.com",
   projectId: "your-project-id",
   storageBucket: "your-app.appspot.com",
   messagingSenderId: "...",
   appId: "1:...:web:...",
};
```

4. The app contains a Firestore helper at `services/firestore.js` that will automatically fall back to local `AsyncStorage` when Firebase is not configured or available.

5. After adding the config and installing `firebase`, run the app:

```powershell
npm install
npx expo start --web
```

Node runtime note:
- Some packages used by the project require a newer Node.js runtime (>= 20.19.4). If you see engine warnings or runtime issues, upgrade Node.js (via the official installer or `nvm-windows`) to a recent Node 20+ release.