# SAI ROLO TECH - SUPER RULES (STRICTEST WORKFLOW)

## 🚨 MANDATORY PRE-READ (NON-NEGOTIABLE)

**SUPER_RULES.md SE PADHO HAR TASK SE PEHLE.**
**ISSE SKIP KARNE KA TARIKA NAHIN HAI.**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    SUPER RULES - ENFORCEMENT LAYER                    ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Ye rules MANDATORY hain. Inki har word follow karna hai.            ║
║  Agar rule todh doge toh kaam band hoga.                             ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## SECTION 1: PRE-CHECK (HAR TASK SE PEHLE)

### Rule 1.1: Memory Load Karna
```
HAR TASK SE PEHLE ye karo (ORDER MEIN):
1. cat .claude/memory.json    → Skills & API status
2. cat RULES.md               → Workflow rules
3. cat .claude/CHECKPOINT.md  → Validation key
4. cat SUPER_RULES.md         → YEH FILE (mandatory)
```
❌ Skip mat karo - error aayega
✅ Pehle padho, phir kaam karo

### Rule 1.2: API Key Verification
```
KAAM SHURU KARNE SE PEHLE:
1. Gemini API test karo - working hai ya nahi
2. Agar blocked hai toh new key lo YA fallback use karo
3. Never use blocked API key
```
❌ Blindly API call mat karo
✅ Test karo, phir use karo

### Rule 1.3: Task Scope Verification
```
KAAM SHURU KARNE SE PEHLE:
1. Task ko 5-step batches mein todho
2. Har batch ke baad test karo
3. Sirf ek batch ek time mein karo
```
❌ Multitask mat karo
✅ Ek kaam, pura karo, next

---

## SECTION 2: CODING RULES

### Rule 2.1: Small Batches (5 Steps)
```
EK BAAR MEIN MAX 5 steps karo:
1. Code likho (max 5 changes)
2. Test karo immediately
3. Working hai toh commit karo
4. Phir next batch
```
❌ Saara kaam ek saath mat karo
✅ Small batches = less errors

### Rule 2.2: Formula Consistency
```
PYTHON + TYPESCRIPT = EXACT MATCH hona chahiye:
1. passes_per_bend: max(2, ceil(90/maxAngle))
2. max_angle: 15-25 degrees depending on material
3. thickness_band: thin<0.8 | standard 0.8-1.2 | medium_heavy 1.2-2.0 | heavy>=2.0
4. K_factors: GI=0.44, CR=0.44, HR=0.42, SS=0.50, AL=0.43, HSLA=0.45
```
❌ Different formulas mat use karo
✅ Verify karo pehle

### Rule 2.3: Hardcoded Values Remove Karo
```
HAR hardcoded value ko constant mein convert karo:
1. Station limit 30 → STATION_LIMITS.MAX
2. Max angle 90 → MAX_ANGLE
3. K-factors → K_FACTORS constant
4. Thickness bands → thicknessBand() function
```
❌ Hardcoded values nahi
✅ Centralized constants

### Rule 2.4: Route Consistency
```
API routes mein consistency:
1. Parent router (/api) se mount karo
2. Child routes mein /api prefix mat likho
3. Full path: /api/route-name (NOT /api/api/route-name)
```
❌ /api/api/route mat likho
✅ Sirf /route likho (parent se prefix aayega)

---

## SECTION 3: TESTING RULES

### Rule 3.1: Test BEFORE Claim (MANDATORY)
```
HO GAYA NAHI BOLNA HAI!
TEST = PROOF, Assumption nahi:

WRONG: "Ho gaya, code likh diya"
RIGHT: "Code likha, test kiya, output dekho..."

Test Commands:
- npm run dev / build / test
- curl -s http://localhost:PORT/
- Browser console check
- API endpoint test
```
❌ "Ho gaya" bolna mat
✅ Test karo, output dikhao

### Rule 3.2: Live Verification
```
HAR CODE CHANGE KE BAAD:
1. Browser/App open karo
2. Feature use karo - koi error ya behavior dekho
3. Console/Network tab check karo
4. Sirf tab "working" jab full test ho
```
❌ Assume mat karo working hai
✅ Actually test karo

### Rule 3.3: Token Limit Check
```
HAR 50 messages KE BAAD:
1. Memory check karo
2. Extra context drop karo
3. Important points save karo memory.json mein
```
❌ Unbounded conversation mat rakhho
✅ Memory mein save karo

---

## SECTION 4: GIT RULES

### Rule 4.1: Checkpoint Commits (Every 5 Steps)
```
HAR 5 STEPS KE BAAD YE KARNA HAI:
git add . && git commit -m "checkpoint: [what was done]" && git push

STEP 1-5 done → COMMIT + PUSH
STEP 6-10 done → COMMIT + PUSH
...
```
❌ Skip mat karo - kaam kho jayega
✅ Har batch ke baad save karo

### Rule 4.2: Commit Message Format
```
COMMIT FORMAT:
type: short description

Types:
- feat: new feature
- fix: bug fix
- docs: documentation
- refactor: code improvement
- chore: maintenance
- test: testing

Example: "feat: add station calculation with K-factors"
```
❌ Random messages mat likho
✅ Standard format follow karo

### Rule 4.3: API Key Security
```
SECRETS MAT COMMIT KARNA:
1. .env files ko .gitignore mein daalo
2. API keys ko git push mat karo
3. GitHub token hatao file se PUSH se pehle
4. Agar secret leak hota hai toh immediately revoke karo
```
❌ API keys commit mat karo
✅ Secrets ko secure rakhho

### Rule 4.4: Git Push Verification
```
PUSH KE BAAD:
1. GitHub par check karo commit aaya ya nahi
2. Secret scanning error aaya toh fix karo immediately
3. Token leak hua toh GitHub se unblock karo
```
❌ Push mat karo without verification
✅ Push ke baad confirm karo

---

## SECTION 5: COMMUNICATION RULES

### Rule 5.1: Status Report Format
```
HAR TASK KE BAAD YE FORMAT USE KARO:

✅ [Feature Name] - WORKING
   Output: [actual result]
   Model Used: [which API]
   Tokens: [if tracking]
   Next: [what's next]

Example:
✅ Station Calculation - WORKING
   Output: 80 measurement points generated
   Model Used: Gemini Direct API
   Next: Add DXF import
```
❌ Generic "done" mat likho
✅ Specific output dikhao

### Rule 5.2: Error Report Format
```
ERROR AAYE TOH YE FORMAT USE KARO:

❌ [Error Name]
   Error: [exact error message]
   File: [which file has problem]
   Line: [line number if known]
   Solution: [how to fix]

Example:
❌ API Key Blocked (403)
   Error: "invalid API key"
   File: src/lib/api.js
   Solution: Use new Gemini key
```
❌ Vague errors mat likho
✅ Exact problem + solution

### Rule 5.3: Keep User Informed
```
LONG TASK CHAL RAHA HAI TOH:
1. Har 5-10 minutes update karo
2. Progress dikhao (50% done, etc.)
3. Blocker hai toh immediately batao
4. User ko wait mat karvao
```
❌ Chup mat raho
✅ Progress update karo

---

## SECTION 6: FILE STRUCTURE RULES

### Rule 6.1: Required Files Always Present
```
HAR PROJECT MEIN YE FILES HONI CHAIYE:
1. CLAUDE.md          → Main guide (read first)
2. RULES.md           → Workflow rules
3. SUPER_RULES.md     → Strictest rules (read before CLAUDE.md)
4. .claude/memory.json → Skills & API status
5. .claude/CHECKPOINT.md → Validation key

Agar koi file nahi hai toh create karo immediately
```
❌ Missing files nahi
✅ Sab files present honi chahiye

### Rule 6.2: Artifacts Structure
```
ARTIFACTS FOLDER:
artifacts/
├── api-server/       → Node.js backend
│   ├── src/
│   │   ├── routes/   → API endpoints
│   │   └── lib/       → Shared utilities
│   └── data/         → JSON data files
├── design-tool/      → React/Vite frontend
│   ├── src/
│   │   ├── lib/      → Shared TypeScript config
│   │   └── views/    → UI components
│   └── dist/         → Built output
└── python-api/       → Python FastAPI backend
```
❌ Random folder structure nahi
✅ Standard structure follow karo

### Rule 6.3: Configuration Files
```
SHARED CONFIG FILES:
1. lib/sai-config.ts (TypeScript)
   → Station calculation, K-factors, materials

2. lib/engineering-constants.ts (Node.js)
   → STATION_LIMITS, MAX_ANGLE, K_FACTORS

3. lib/config.js (Common)
   → Port numbers, API URLs

Ye files ek jagah update karo = sab jagah update
```
❌ Copy-paste mat karo
✅ Single source of truth

---

## SECTION 7: SECURITY RULES

### Rule 7.1: API Key Management
```
API KEYS KI PRIORITY ORDER:
1. Gemini Direct (FREE) → Always try pehle
2. OpenRouter → Fallback
3. Claude → Last resort (expensive)

Never use blocked key - always test before use
```
❌ Blocked key mat use karo
✅ Fresh key test karo

### Rule 7.2: Environment Variables
```
.env FILE RULES:
1. .env ko gitignore mein daalo ALWAYS
2. Sample .env.example create karo
3. Real values kabhi commit mat karo
4. Production keys ko secure store mein rakhho
```
❌ Real .env commit mat karo
✅ Sample file hi commit karo

### Rule 7.3: GitHub Token Handling
```
TOKEN LEAK HO GAYA TOH:
1. Immediately GitHub par revoke karo
2. Git history se hatao (BFG/tool)
3. Force push karo
4. New token use karo

Token in history = permanent block until removed
```
❌ Leaked token push mat karo
✅ Immediately fix karo

---

## SECTION 8: ERROR HANDLING RULES

### Rule 8.1: Don't Assume - Verify
```
ERROR AAYE TOH:
1. Exact error message note karo
2. File aur line number find karo
3. Root cause identify karo
4. Fix implement karo
5. Test karo working hai ya nahi

Problem → Solution → Verify
```
❌ Ignore mat karo error ko
✅ Investigate karo immediately

### Rule 8.2: API Failures
```
API FAIL HO GAYA TOH:
1. Check status code (401, 403, 500, etc.)
2. Check rate limits
3. Try different model/key
4. Fallback to working option
5. Never stop working - always find alternative
```
❌ "API failed, can't proceed" mat bol
✅ Alternative dhundho

### Rule 8.3: Build Failures
```
BUILD FAIL HO GAYA TOH:
1. Error message padho carefully
2. Check TypeScript/JavaScript syntax
3. Check imports/exports
4. Check missing dependencies
5. Fix one error at a time
```
❌ Random changes mat karo
✅ Systematic fix karo

---

## SECTION 9: PROJECT-SPECIFIC RULES

### Rule 9.1: COPRA Simulation
```
COPRA-LEVEL FEATURES:
1. 80 measurement points minimum
2. K-factor accuracy (±0.01)
3. Material database (GI, CR, HR, SS, AL, HSLA)
4. Thickness banding (thin/standard/medium_heavy/heavy)
5. Roll types (GUIDE/BREAKDOWN/FORMING/GROOVE/FINPASS/SIZING)
6. Standards (DIN 6935, VDI 3389, COPRA RF)
```
❌ Approximate calculations nahi
✅ Engineering-grade accuracy

### Rule 9.2: SAI Rolotech Port Map
```
PORTS:
- 8080: Desktop EXE (Electron)
- 3333: Cloud Engine (npx serve)
- 3000: API Server (Node Express)
- 3001: COPRA Simulation
- 18789: OpenClaw Gateway
- 42000: Pinokio AI Marketplace
```
❌ Port confusion mat karo
✅ Correct port use karo

### Rule 9.3: Roll Forming Formulas
```
STATION CALCULATION:
passes_per_bend = max(2, ceil(90 / max_angle_per_pass))
stations = sum(passes_per_bend for each bend)

THICKNESS BANDS:
- thin: < 0.8mm
- standard: 0.8 - 1.2mm
- medium_heavy: 1.2 - 2.0mm
- heavy: >= 2.0mm

K-FACTORS (DIN 6935):
- GI: 0.44, CR: 0.44, HR: 0.42
- SS: 0.50, AL: 0.43, HSLA: 0.45
```
❌ Wrong formulas mat use karo
✅ COPRA standard follow karo

---

## SECTION 10: FINAL CHECKLIST (HAR TASK KE BAAD)

### Before Claiming "DONE":
```
[ ] Code written
[ ] Built successfully (npm run build)
[ ] Tested in browser/app
[ ] Output verified (not assumed)
[ ] API working (tested)
[ ] Commit done
[ ] Push done
[ ] Memory.json updated
[ ] User informed with proof
```
❌ Incomplete mat chhoro
✅ Full verification karo

---

## VIOLATION CONSEQUENCES

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    VIOLATION CONSEQUENCES                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1. PRE-CHECK skip → Error at checkpoint, work stops                 ║
║  2. No test → Bug in production, user frustration                    ║
║  3. No commit → Work lost, can't rollback                           ║
║  4. API key leak → GitHub blocked, token revoke needed               ║
║  5. Wrong formula → Wrong calculations, safety risk                  ║
║  6. Hardcoded values → Inconsistent behavior                         ║
║                                                                       ║
║  SUPER RULES follow karna = fast, clean work                        ║
║  SUPER RULES todhna = blocked, redo needed                          ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## QUICK REFERENCE CARD

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    SUPER RULES - QUICK REF                             ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  PRE-CHECK (4 files):                                                 ║
║    1. .claude/memory.json                                            ║
║    2. RULES.md                                                        ║
║    3. .claude/CHECKPOINT.md                                          ║
║    4. SUPER_RULES.md (YEH FILE)                                      ║
║                                                                       ║
║  CODING:                                                              ║
║    Small batches (5 steps) | Formula consistency | No hardcoded     ║
║                                                                       ║
║  TESTING:                                                             ║
║    Test BEFORE claim | Live verification | Token check every 50      ║
║                                                                       ║
║  GIT:                                                                 ║
║    Commit every 5 steps | Clean messages | No secrets | Verify push ║
║                                                                       ║
║  PROJECT:                                                             ║
║    COPRA accuracy | Correct ports | Roll forming formulas             ║
║                                                                       ║
║  END:                                                                 ║
║    Full checklist before "DONE" | Memory update | User informed     ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

**END OF SUPER RULES**
**HAR TASK SE PEHLE PADHO. TODH NAHIN KAR SAKTE.**
