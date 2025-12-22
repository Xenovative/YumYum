# Building OneNightDrink Android App

## Prerequisites

1. **Install Android Studio**: Download from https://developer.android.com/studio
2. **Install Java JDK 17**: Required for Android builds
3. **Set up environment variables**:
   - `ANDROID_HOME`: Path to Android SDK (usually `C:\Users\<username>\AppData\Local\Android\Sdk`)
   - `JAVA_HOME`: Path to JDK installation

## Build Steps

### 1. Build the web app
```bash
npm run build
```

### 2. Sync with Android
```bash
npm run cap:sync
```

### 3. Open in Android Studio
```bash
npm run cap:open:android
```

### 4. Build APK in Android Studio

**Option A: Debug APK (for testing)**
1. In Android Studio: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Option B: Release APK (for distribution)**
1. In Android Studio: `Build` → `Generate Signed Bundle / APK`
2. Select `APK`
3. Create or select keystore
4. Choose `release` build variant
5. APK location: `android/app/build/outputs/apk/release/app-release.apk`

### 5. Install on device
```bash
# Via ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Quick Build (Command Line)

If you have Gradle set up:

```bash
# Debug build
cd android
./gradlew assembleDebug

# Release build (requires keystore)
./gradlew assembleRelease
```

## App Configuration

- **App ID**: `com.onenightdrink.app`
- **App Name**: OneNightDrink
- **Version**: 1.0 (versionCode: 1)
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: Latest

## Updating the App

After making changes to the web app:

```bash
npm run build:android
```

This rebuilds the web app and syncs changes to Android.

## Troubleshooting

**Gradle sync failed**: Make sure ANDROID_HOME and JAVA_HOME are set correctly

**Build errors**: Try `Build` → `Clean Project` then rebuild

**App crashes**: Check logcat in Android Studio for errors
