# Developer Guide — CRM Auto-Deploy Setup

## Kaise Kaam Karta Hai?

```
Developer → GitHub push → GitHub Actions → Auto Build → Replit Redeploy
```

Jab bhi koi developer `main` branch par code push kare, app automatically
update ho jaata hai. Baar baar manually deploy karne ki zarurat nahi.

---

## GitHub Par Code Push Karna (Pehli Baar)

```bash
git init
git add .
git commit -m "Initial CRM app setup"
git remote add origin https://github.com/adminsairolotech-bit/crm-2.git
git push -u origin main
```

---

## GitHub Secrets Setup Karna (Ek Baar)

GitHub par jaayein → Repository → **Settings** → **Secrets and variables** → **Actions**

Yeh 2 secrets add karein:

| Secret Name            | Value Kahan Se Milega                        |
|------------------------|----------------------------------------------|
| `REPLIT_DEPLOY_TOKEN`  | Replit → Account Settings → SSH Keys/Tokens  |
| `REPLIT_REPL_ID`       | Replit URL mein dikh jaata hai               |

---

## Developer Workflow (Roz Ka Kaam)

### Naya Feature Banana:
```bash
git checkout -b feature/meri-nayi-feature
# ... code likho ...
git add .
git commit -m "Nayi feature add ki"
git push origin feature/meri-nayi-feature
```

### GitHub par Pull Request banao → Review → Merge into `main`
**Merge hote hi app automatically deploy ho jaayega!** ✅

---

## GitHub Actions — Kya Karta Hai?

### `deploy.yml` — Main Branch par push hone par:
1. Code download karta hai
2. `npm install` — dependencies install karta hai
3. `npm run build` — production build banata hai
4. Replit ko redeploy karne ka signal bhejta hai

### `ci.yml` — Pull Request par:
1. Code check karta hai
2. Build successful hai ya nahi verify karta hai
3. Agar build fail ho toh merge block kar deta hai

---

## Branch Strategy (Team Ke Liye)

```
main          ← Production (sirf approved code)
  └── develop ← Development branch
        ├── feature/login-update
        ├── feature/dashboard-charts
        └── fix/password-bug
```

---

## Important Notes

- **Kabhi bhi directly `main` par push mat karo**
- Hamesha Pull Request banao, review ke baad merge karo
- `main` par merge = automatic deploy
- Build fail ho toh deploy nahi hoga (protection)
