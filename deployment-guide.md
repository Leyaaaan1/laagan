# 🚀 Deployment Guide — Spring Boot + React Native + Supabase
> Portfolio scale · Play Store release

---

## 📋 Overview

```
Users → Play Store → React Native App
                         ↓ API calls
                      Spring Boot (Railway)
                         ↓ database / auth / storage
                      Supabase (already hosted)
```

You need to deploy:
1. **Spring Boot** → Railway (cloud server)
2. **React Native** → Google Play Store

---

## PART 1 — Deploy Spring Boot

### ✅ Pre-deployment Checklist

- [ ] App runs locally with no errors (`mvn spring-boot:run`)
- [ ] All Supabase credentials use environment variables, not hardcoded
- [ ] No hardcoded `localhost` URLs anywhere in your code
- [ ] CORS is configured to allow requests from your app
- [ ] Production `application.properties` profile is ready

### 🔧 Step 1 — Prepare `application.properties`

```properties
# Never hardcode secrets — use environment variables
supabase.url=${SUPABASE_URL}
supabase.key=${SUPABASE_KEY}
server.port=${PORT:8080}
```

### 🔧 Step 2 — Build your JAR

```bash
mvn clean package -DskipTests
# Output: target/your-app-name.jar
```

### 🚂 Step 3 — Deploy to Railway

- [ ] Go to [railway.app](https://railway.app) → sign up with GitHub
- [ ] Click **New Project → Deploy from GitHub Repo**
- [ ] Select your Spring Boot repo
- [ ] Go to **Variables** tab and add:
  ```
  SUPABASE_URL=your_supabase_project_url
  SUPABASE_KEY=your_supabase_anon_or_service_key
  ```
- [ ] Railway auto-detects Maven and builds your JAR
- [ ] Go to **Settings → Networking → Generate Domain**
- [ ] Copy your public URL e.g. `https://your-app.up.railway.app`

### ✅ Verify Spring Boot is Live

```bash
https://your-app.up.railway.app/actuator/health
# Should return: {"status":"UP"}
```

---

## PART 2 — Prepare React Native for Play Store

### ✅ Pre-build Checklist

- [ ] Replace ALL `http://localhost:8080` with your Railway URL
- [ ] Replace ALL `http://10.0.2.2:8080` with your Railway URL
- [ ] Test API calls work with the new URL on a real device
- [ ] App has a proper name, icon, and splash screen
- [ ] No debug logs or dev tools visible in the UI

### 🔧 Step 1 — Update Base URL

```js
// Before
const BASE_URL = 'http://10.0.2.2:8080/api';

// After
const BASE_URL = 'https://your-app.up.railway.app/api';
```

### 🔧 Step 2 — Update App Version in `android/app/build.gradle`

```gradle
android {
    defaultConfig {
        applicationId "com.yourname.appname"   // unique ID — cannot change after publishing
        versionCode 1                           // increment every upload to Play Store
        versionName "1.0.0"                    // visible version shown to users
    }
}
```

> ⚠️ `applicationId` is permanent. Choose it carefully before your first upload.

### 🔧 Step 3 — Generate a Signing Keystore (ONE TIME ONLY)

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore my-upload-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

> ⚠️ CRITICAL — If you lose this `.keystore` file, you can NEVER update your app on Play Store.
> Back it up to Google Drive, USB, or anywhere safe.

- [ ] Move keystore to `android/app/my-upload-key.keystore`
- [ ] Back up keystore to a safe location outside the project

### 🔧 Step 4 — Add Signing Credentials to `android/gradle.properties`

```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your_keystore_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

### 🔧 Step 5 — Configure Signing in `android/app/build.gradle`

```gradle
signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 🔧 Step 6 — Build Release AAB (Play Store requires AAB, not APK)

```bash
cd android
./gradlew bundleRelease

# Output file:
# android/app/build/outputs/bundle/release/app-release.aab
```

> ℹ️ Play Store requires `.aab` (Android App Bundle), not `.apk`.
> `.apk` is only for direct installs / testing.

- [ ] AAB builds with no errors
- [ ] Test on real device first using APK:
  ```bash
  ./gradlew assembleRelease
  adb install app/build/outputs/apk/release/app-release.apk
  ```

---

## PART 3 — Google Play Store Setup

### 💳 Step 1 — Create a Google Play Developer Account

- [ ] Go to [play.google.com/console](https://play.google.com/console)
- [ ] Sign in with your Google account
- [ ] Pay the **one-time $25 registration fee**
- [ ] Fill in your developer profile (name, email, etc.)
- [ ] Account approval takes up to **48 hours**

### 📱 Step 2 — Create a New App

- [ ] Click **Create app**
- [ ] Fill in:
  - App name (what users see on Play Store)
  - Default language
  - App or Game → **App**
  - Free or Paid → **Free**
- [ ] Accept the declarations
- [ ] Click **Create app**

### 📝 Step 3 — Fill in Store Listing

Go to **Store presence → Main store listing**

- [ ] **App name** — your app's display name
- [ ] **Short description** — max 80 characters
- [ ] **Full description** — max 4000 characters
- [ ] **App icon** — 512×512 PNG, no transparency
- [ ] **Feature graphic** — 1024×500 PNG (banner)
- [ ] **Screenshots** — minimum 2, recommended 4–8 (1080×1920 or similar)
- [ ] **App category** — choose the most relevant
- [ ] **Email address** — your contact email (publicly visible)
- [ ] Click **Save**

### 🔒 Step 4 — Fill in App Content Declarations

Go to **Policy → App content**

- [ ] **Privacy policy URL** — required even for portfolio apps
  - Free option: generate at [privacypolicygenerator.info](https://www.privacypolicygenerator.info) and host on GitHub Pages
- [ ] **Ads** → No
- [ ] **Content rating** → Complete the questionnaire → Submit
- [ ] **Target audience** → Select age group (likely 18+)
- [ ] **Data safety** → Fill in what data your app collects
  - Location data → Yes (your app uses GPS)
  - Personal info → Yes (user accounts via Supabase)
  - Shared with third parties → mention Supabase

### 📦 Step 5 — Upload Your AAB

Go to **Release → Production → Create new release**

- [ ] Click **Upload** and select `app-release.aab`
- [ ] Wait for upload and processing
- [ ] Fill in **Release notes** (e.g. "Initial release")
- [ ] Click **Save**

### ✅ Step 6 — Complete Release Requirements

Go to **Dashboard** — it shows a checklist of things still needed:

- [ ] Store listing complete
- [ ] Content rating complete
- [ ] Privacy policy set
- [ ] Data safety form complete
- [ ] Target countries set (Release → Production → Countries/regions)
- [ ] At least 2 screenshots uploaded

### 🚀 Step 7 — Submit for Review

- [ ] Go to **Release → Production**
- [ ] Click **Review release**
- [ ] Fix any warnings or errors shown
- [ ] Click **Start rollout to Production**
- [ ] Confirm by clicking **Rollout**

> ⏳ Review takes **3–7 days** for a new app.
> You will get an email when approved or if there are issues.

---

## PART 4 — Final Checks Before Submitting

- [ ] Tested on a real Android device (not emulator)
- [ ] Login / signup works on mobile data (not just WiFi)
- [ ] Map loads and shows routes correctly
- [ ] No crash on app startup
- [ ] No visible `localhost` or debug URLs in behavior
- [ ] App icon looks good and is not blurry
- [ ] Screenshots are clean and look professional
- [ ] Privacy policy URL is publicly accessible

---

## 🔒 Security Reminders

- [ ] `.keystore` file is in `.gitignore` — never commit it
- [ ] `gradle.properties` passwords are in `.gitignore`
- [ ] Supabase keys are in Railway environment variables, not in code
- [ ] Using Supabase **anon key** in the app (not service role key)

```
# Add these to your .gitignore
android/app/my-upload-key.keystore
android/gradle.properties
```

---

## 🆘 Common Issues

| Problem | Fix |
|---|---|
| `Connection refused` on real device | Still have `localhost` URL somewhere in code |
| App crashes on release but not debug | Add Proguard `-keep` rules for your model classes |
| Play Store rejects AAB | Check `applicationId` is unique, not `com.example.*` |
| `Upload certificate error` | Wrong keystore — you must always use the original one |
| Content rating rejected | Answer the questionnaire more carefully |
| Privacy policy rejected | Must be a real hosted URL, not a local file |
| Build fails after updating versionCode | Run `./gradlew clean bundleRelease` |
| Map blank on release build | Leaflet assets not bundled — already fixed! |

---

## 📅 Timeline Estimate

| Step | Time |
|---|---|
| Spring Boot deploy to Railway | ~30 minutes |
| Build signed AAB | ~15 minutes |
| Google Play account approval | up to 48 hours |
| Fill store listing + assets | 1–2 hours |
| App review after submission | 3–7 days |
| **Total** | **~1 week** |
