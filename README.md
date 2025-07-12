# React Native Push Notification App

A lightweight React Native mobile application that demonstrates real-time push notification handling using Firebase Cloud Messaging (FCM). This app supports notifications in foreground, background, and killed states, with native integration for Android using Java/Kotlin. Compatible with Android 13, 14, and 15+.

## Features

- Receive push notifications using Firebase Cloud Messaging (FCM)
- Works in foreground, background, and terminated states
- Device token registration using Firebase
- Native module integration using Java/Kotlin for Android
- Minimal UI simulating a chat interface
- Real-time in-app updates when a message is received

## Technologies Used

- React Native
- @react-native-firebase/messaging
- Firebase Cloud Messaging (FCM)
- Java/Kotlin for Android native services
- Android SDK (API 33+ tested)

## Getting Started

### 1. Install Dependencies

```
npm install
npx pod-install
```

### 2. Firebase Configuration

- Create a new project at https://console.firebase.google.com/
- Enable Cloud Messaging
- Download the `google-services.json` file
- Place `google-services.json` inside `android/app/`

### 3. Run the App

For development (debug mode):

```
npx react-native run-android
```

For release build (recommended for background/killed notifications):

```
cd android
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

## Sending a Test Notification

1. Go to Firebase Console > Engage > Cloud Messaging
2. Click "Send your first message"
3. Add title and body (e.g., "New Message", "Hello from Firebase")
4. Under "Test on device", paste your FCM device token
5. Click "Send"

Foreground: the app will show an alert and update the message list  
Background/Killed: the notification will appear in the system tray


## Optional Improvements

- Deep linking from notification to specific screen
- Badge counts and unread message indicators
- Backend API simulation to trigger notifications

