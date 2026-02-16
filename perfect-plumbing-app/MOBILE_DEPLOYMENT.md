# Mobile Deployment Guide

This guide explains how to build, run, and deploy your Perfect Plumbing App to Android and iOS devices.

## Prerequisites

- **Node.js** and **npm** installed.
- **Android Studio** (for Android development).
- **Xcode** (for iOS development, requires macOS).
- **CocoaPods** (for iOS dependencies, run `sudo gem install cocoapods` on Mac).

## Project Architecture

- **Web App**: The core application built with React and Vite.
- **Capacitor**: The bridge that allows your web app to run natively.
- **Android Project**: Located in `android/`.
- **iOS Project**: Located in `ios/`.

## Development Workflow

### 1. Develop in Browser
Run the standard development server to build your UI:
```bash
npm run dev
```

### 2. Sync to Mobile
Whenever you make changes to the web code that you want to test on mobile:
1.  **Build the web app**:
    ```bash
    npm run build
    ```
2.  **Sync assets to mobile projects**:
    ```bash
    npx cap sync
    ```
    *Alternatively, run `npm run ionic:build` to do both steps at once.*

### 3. Open in Native IDEs

#### Android
Open the `android` folder in **Android Studio**:
```bash
npx cap open android
```
- Wait for Gradle sync to finish.
- Select a connected device or emulator.
- Click the **Run** button (green play icon).

#### iOS (macOS only)
Open the `ios` folder in **Xcode**:
```bash
npx cap open ios
```
- Wait for indexing to finish.
- Select a target simulator or device.
- Click the **Play** button.

## Deployment to Stores

### Google Play Store (Android)

1.  **Generate Icon and Splash Screen**:
    - Place your `icon.png` (1024x1024) and `splash.png` (2732x2732) in a `resources` folder.
    - Install `capacitor-assets`: `npm install @capacitor/assets --save-dev`.
    - Run `npx capacitor-assets generate --android`.

2.  **Versioning**:
    - Start Android Studio.
    - Go to `build.gradle` (Module: app) and update `versionCode` and `versionName`.

3.  **Build Signed Bundle**:
    - In Android Studio, go to **Build > Generate Signed Bundle / APK**.
    - Choose **Android App Bundle**.
    - Create a new keystore key (keep this safe!).
    - Build the release bundle.

4.  **Upload**:
    - Go to [Google Play Console](https://play.google.com/console).
    - Create a new app and upload the `.aab` file.

### Apple App Store (iOS)

1.  **Generate Assets**:
    - Run `npx capacitor-assets generate --ios` (requires setup steps above).

2.  **Versioning**:
    - Open Xcode.
    - Select the **App** project in the navigator.
    - Update **Version** and **Build**.

3.  **Archive and Upload**:
    - Select **Any iOS Device (arm64)** as the target.
    - Go to **Product > Archive**.
    - Once finished, the Organizer window will open.
    - Click **Distribute App** and follow the prompts to upload to **App Store Connect**.

## Troubleshooting

- **Supabase Connection**: Ensure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct in `.env`.
- **White Screen on Launch**: Check `capacitor.config.ts` to ensure `webDir` matches your build output folder (`dist`).
- **Network Requests Failed**: Ensure your specific domain is allowed in your backend standard CORS settings if you are not using localhost.
