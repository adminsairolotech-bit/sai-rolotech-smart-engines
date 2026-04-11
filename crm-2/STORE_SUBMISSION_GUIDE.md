# App Store Submission Guide

## Step 1: EAS Account Setup (Ek Baar)

```bash
# Mobile folder mein jaayein
cd mobile

# EAS CLI install karein
npm install -g eas-cli

# Expo account se login karein
eas login

# Project link karein
eas init
```

---

## Step 2: Google Play Store (Android)

### A. Service Account banayein:
1. [Google Play Console](https://play.google.com/console) par login karein
2. **Setup** → **API access** par jaayein
3. **Service Account** banayein aur JSON key download karein
4. JSON file ka naam `google-service-account.json` rakhein
5. `mobile/` folder mein rakhein

### B. Build banayein:
```bash
cd mobile
eas build --platform android --profile production
```

### C. Play Store par submit karein:
```bash
eas submit --platform android
```

---

## Step 3: Apple App Store (iOS)

### A. Apple verification complete hone ke baad:
1. [App Store Connect](https://appstoreconnect.apple.com) par login karein
2. New App banayein — Bundle ID: `com.sairolotech.crm`

### B. `eas.json` update karein:
- `appleId` → Apna Apple ID
- `ascAppId` → App Store Connect mein dikh jaayega
- `appleTeamId` → Apple Developer account se milega

### C. iOS build banayein:
```bash
cd mobile
eas build --platform ios --profile production
```

### D. App Store par submit karein:
```bash
eas submit --platform ios
```

---

## Step 4: Dono Ek Saath

```bash
cd mobile

# Dono platform ke liye build
eas build --platform all --profile production

# Dono submit
eas submit --platform all
```

---

## Preview APK (Testing ke Liye)

```bash
cd mobile
eas build --platform android --profile preview
```
Yeh ek APK file banayega jo aap seedha phone mein install kar sakte hain — 
Play Store ke bina bhi test kar sakte hain!

---

## App Icon aur Splash Screen

`mobile/assets/` folder mein yeh files chahiye:
- `icon.png` — 1024x1024 px (App icon)
- `adaptive-icon.png` — 1024x1024 px (Android adaptive icon)
- `splash.png` — 1284x2778 px (Splash screen)

---

## Auto-Deploy (GitHub se)

Jab bhi GitHub par code push ho, EAS automatically build trigger kar sakta hai.
GitHub repository settings mein EAS webhook setup karein.
