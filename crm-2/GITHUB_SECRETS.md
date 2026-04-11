# GitHub Secrets Setup Guide
## SAI RoloTech CRM — CI/CD Configuration

GitHub Repository mein jaake: **Settings → Secrets and variables → Actions → New repository secret**

---

## 🌐 Web Deploy Secrets

| Secret Name | Value | Kahan se milega |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyCzbu9_P0QYsNlIu9iaofJEf3z9HOjVbkc` | Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | `sai-rolotech-offical` | Firebase Console |
| `VITE_FIREBASE_APP_ID` | `1:1090230838763:web:63f4db80f4b02c414465ae` | Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `sai-rolotech-offical.firebaseapp.com` | Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | `sai-rolotech-offical.firebasestorage.app` | Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1090230838763` | Firebase Console |
| `REPLIT_DEPLOY_TOKEN` | Replit API Token | replit.com/account → API Keys |
| `REPLIT_REPL_ID` | Your Repl ID | Replit URL mein dikhega |

---

## 📱 Mobile Secrets (Expo / EAS)

| Secret Name | Value | Kahan se milega |
|---|---|---|
| `EXPO_TOKEN` | EAS Access Token | expo.dev → Account Settings → Access Tokens |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON file content | Google Play Console → Setup → API access |
| `APPLE_ID` | apple@youremail.com | Apple Developer account |
| `APPLE_TEAM_ID` | XXXXXXXXXX | developer.apple.com → Membership |
| `ASC_APP_ID` | App Store Connect App ID | App Store Connect → App → General |

---

## 🔄 CI/CD Flow — Kya Kab Hoga

### Har Push on `main` branch:
```
Developer → git push → GitHub
                          ↓
              ┌───────────┴───────────┐
              │                       │
         🌐 Web Deploy           📱 Mobile OTA
         (Replit rebuild)        (Instant update)
              │                       │
         Users ko naya           App open karte hi
         web milega              naya version milega
```

### GitHub Release publish karne par:
```
GitHub Release → Publish
                    ↓
         ┌──────────┴──────────┐
         │                     │
    🤖 Android            🍎 iOS Build
    Build & Submit         & Submit
         │                     │
    Play Store            App Store
    (Review: 1-2 hrs)    (Review: 1-3 days)
```

---

## 📋 Steps to Activate

1. **GitHub repo mein jaayein**
2. **Settings → Secrets and variables → Actions**
3. **Upar diye saare secrets add karein**
4. **Expo account par:**
   - expo.dev par account banayein
   - `eas login` kar ke project link karein
   - `eas update:configure` chalayein
5. **Pehla push karein — sab auto ho jaayega!**
