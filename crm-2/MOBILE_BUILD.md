# SAI RoloTech — Mobile App Build Guide

## Play Store (Android) aur App Store (iOS) par Publish Kaise Karein

---

## Step 1: Web App Build Karein

```bash
npm run build
```

---

## Step 2: Capacitor Initialize Karein (Pehli Baar)

```bash
npx cap init "SAI RoloTech" "com.sairolotech.designengine" --web-dir dist
npx cap add android
npx cap add ios
```

---

## Step 3: Sync Karein

Har build ke baad:
```bash
npm run build
npx cap sync
```

---

## Step 4: Android (Play Store)

### Requirements:
- Android Studio install hona chahiye
- Java 17+

### Build Steps:
```bash
npx cap open android
```
Android Studio mein:
1. Build > Generate Signed Bundle/APK
2. Android App Bundle (.aab) select karein
3. Keystore file create karein (pehli baar)
4. Release variant select karein
5. .aab file generate hogi

### Play Store Submit:
1. play.google.com/console par jayen
2. New app create karein
3. App name: "SAI RoloTech Design Engine"
4. .aab file upload karein
5. Screenshots, description fill karein
6. Submit for review

---

## Step 5: iOS (App Store)

### Requirements:
- Mac computer (required)
- Xcode install hona chahiye
- Apple Developer Account ($99/year)

### Build Steps:
```bash
npx cap open ios
```
Xcode mein:
1. Product > Archive
2. Distribute App
3. App Store Connect select karein
4. Upload karein

### App Store Submit:
1. appstoreconnect.apple.com par jayen
2. New app create karein
3. Bundle ID: com.sairolotech.designengine
4. Build upload hone ke baad submit karein

---

## App Details (Fill Karein)

| Field | Value |
|-------|-------|
| App Name | SAI RoloTech Design Engine |
| Bundle ID | com.sairolotech.designengine |
| Version | 1.0.0 |
| Category | Business |
| Content Rating | Everyone |
| Price | Free |

## App Store Description (English)

SAI RoloTech Design Engine — India's #1 Roll Forming Machine Design Platform

✅ 92% Accuracy AI Design Engine
✅ 500+ Roll Forming Profiles (C, Z, U, Hat, Omega, Solar, Cable Tray and more)
✅ AI Quotation Maker — Instant Professional Quotations
✅ PMEGP / MSME / Bank Loan Project Report Generator
✅ Machine Troubleshooter — Fix Problems in Minutes
✅ Machine Maintenance Guide — Daily, Weekly, Monthly Schedule
✅ Custom Profile Inquiry with DXF/DWG Upload

Perfect for roll forming manufacturers, dealers, and engineers across India.

---

## PWA (Shortcut — App Store Bina)

App already PWA (Progressive Web App) hai:
- Android: Chrome mein open karein > "Add to Home Screen"
- iOS: Safari mein open karein > Share > "Add to Home Screen"

Yeh directly Play Store mein Trusted Web Activity (TWA) ke through bhi publish ho sakta hai:
- Tool: Bubblewrap (bubblewrap.dev)
- Google Play Billing bhi add kar sakte ho

---

## Contact

SAI RoloTech — Pune, Maharashtra
+91 98765 43210
