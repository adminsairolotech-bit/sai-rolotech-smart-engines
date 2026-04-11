const fs = require('fs');

const html = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<title>SAI RoloTech CRM — Complete Project Documentation</title>
<style>
  @page { margin: 40px 50px; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; line-height: 1.6; font-size: 11px; }
  
  .cover { page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 60px; border-radius: 0; }
  .cover h1 { font-size: 36px; margin-bottom: 10px; color: #e94560; }
  .cover h2 { font-size: 20px; font-weight: 300; margin-bottom: 30px; }
  .cover .version { font-size: 14px; opacity: 0.8; margin-top: 20px; }
  .cover .date { font-size: 12px; opacity: 0.6; }
  
  .toc { page-break-after: always; padding: 30px 0; }
  .toc h2 { font-size: 24px; color: #e94560; border-bottom: 3px solid #e94560; padding-bottom: 10px; margin-bottom: 20px; }
  .toc-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ddd; font-size: 13px; }
  .toc-item.main { font-weight: bold; font-size: 14px; margin-top: 10px; }
  
  h1 { font-size: 24px; color: #e94560; border-bottom: 3px solid #e94560; padding-bottom: 8px; margin: 25px 0 15px 0; page-break-after: avoid; }
  h2 { font-size: 18px; color: #1a1a2e; margin: 20px 0 10px 0; page-break-after: avoid; }
  h3 { font-size: 14px; color: #0f3460; margin: 15px 0 8px 0; page-break-after: avoid; }
  
  p { margin-bottom: 8px; text-align: justify; }
  ul, ol { margin: 8px 0 8px 25px; }
  li { margin-bottom: 4px; }
  
  .section { page-break-inside: avoid; margin-bottom: 15px; }
  .feature-box { background: #f8f9fa; border-left: 4px solid #e94560; padding: 12px 15px; margin: 10px 0; border-radius: 0 8px 8px 0; page-break-inside: avoid; }
  .feature-box h3 { color: #e94560; margin-top: 0; }
  
  .tech-box { background: #e8f4f8; border-left: 4px solid #0f3460; padding: 12px 15px; margin: 10px 0; border-radius: 0 8px 8px 0; page-break-inside: avoid; }
  
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
  th { background: #1a1a2e; color: white; padding: 8px; text-align: left; }
  td { padding: 6px 8px; border: 1px solid #ddd; }
  tr:nth-child(even) { background: #f8f9fa; }
  
  .highlight { color: #e94560; font-weight: bold; }
  .badge { display: inline-block; background: #e94560; color: white; padding: 2px 8px; border-radius: 10px; font-size: 9px; }
  .badge-blue { background: #0f3460; }
  .badge-green { background: #27ae60; }
  
  .page-break { page-break-before: always; }
  
  .footer { text-align: center; font-size: 9px; color: #999; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; }
  
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  
  .stat-box { background: #1a1a2e; color: white; padding: 15px; border-radius: 8px; text-align: center; }
  .stat-box .number { font-size: 28px; color: #e94560; font-weight: bold; }
  .stat-box .label { font-size: 11px; opacity: 0.8; }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div style="font-size: 60px; margin-bottom: 20px;">⚙️</div>
  <h1>SAI RoloTech CRM</h1>
  <h2>Complete Project Documentation</h2>
  <p style="max-width: 500px; opacity: 0.9;">Industrial Automation CRM Portal + Android Mobile App<br>CRM Web Application + Expo/React Native Mobile App</p>
  <div class="version">Version 2.2.11 | Package: com.vipinjangra.crmmobile</div>
  <div class="date">Document Generated: March 29, 2026</div>
  <div style="margin-top: 40px; opacity: 0.7;">
    <p>Website: sairolotech.com</p>
    <p>Email: sairolotech@gmail.com</p>
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc">
  <h2>📋 Table of Contents</h2>
  <div class="toc-item main">1. Project Overview</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;1.1 Technology Stack</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;1.2 Project Statistics</div>
  <div class="toc-item main">2. Authentication & User Roles</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;2.1 Login System</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;2.2 User Roles (Admin, Sales, Technician)</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;2.3 Security Features</div>
  <div class="toc-item main">3. Dashboard & Analytics</div>
  <div class="toc-item main">4. AI-Powered Features</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;4.1 AI Photo Solution</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;4.2 PLC/VFD Error Code System</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;4.3 AI Quotation Generator</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;4.4 AI Buddy System</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;4.5 AI Machine Expert</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;4.6 AI Tools Hub</div>
  <div class="toc-item main">5. Sales & Lead Management</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;5.1 Sales Pipeline (Kanban)</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;5.2 Lead Intelligence</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;5.3 Lead Imports</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;5.4 Sales Sequences</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;5.5 Demo Scheduler</div>
  <div class="toc-item main">6. Quotation System</div>
  <div class="toc-item main">7. Machine Management</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;7.1 Machine Catalog</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;7.2 Used Machines Marketplace</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;7.3 Maintenance Guide</div>
  <div class="toc-item main">8. Management Tools</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;8.1 Supplier Management</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;8.2 Service Manager</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;8.3 User Management</div>
  <div class="toc-item main">9. Marketing & Communication</div>
  <div class="toc-item main">10. Mobile App (Android)</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;10.1 Architecture</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;10.2 Screens & Features</div>
  <div class="toc-item">&nbsp;&nbsp;&nbsp;10.3 CI/CD Pipeline</div>
  <div class="toc-item main">11. System Administration</div>
  <div class="toc-item main">12. Complete Page List (42+ Pages)</div>
</div>

<!-- SECTION 1: PROJECT OVERVIEW -->
<h1>1. Project Overview</h1>
<p>SAI RoloTech CRM ek comprehensive Industrial Automation CRM Portal hai jo specifically Roll Forming Machine industry ke liye design kiya gaya hai. Ye web application + Android mobile app ka combination hai jo sales management, AI-powered diagnosis, machine maintenance, quotation generation, aur bahut kuch provide karta hai.</p>

<h2>1.1 Technology Stack</h2>
<div class="two-col">
  <div class="tech-box">
    <h3>🌐 Frontend (Web CRM)</h3>
    <ul>
      <li><strong>React 18</strong> — UI Framework</li>
      <li><strong>Vite</strong> — Build Tool</li>
      <li><strong>TypeScript</strong> — Type Safety</li>
      <li><strong>Tailwind CSS</strong> — Styling</li>
      <li><strong>Shadcn/UI</strong> — Component Library</li>
      <li><strong>Framer Motion</strong> — Animations</li>
      <li><strong>Recharts</strong> — Data Visualization</li>
      <li><strong>React Router</strong> — Navigation</li>
    </ul>
  </div>
  <div class="tech-box">
    <h3>⚙️ Backend</h3>
    <ul>
      <li><strong>Node.js + Express</strong> — Server</li>
      <li><strong>Supabase</strong> — Database (PostgreSQL)</li>
      <li><strong>Google Gemini AI</strong> — AI Engine</li>
      <li><strong>JWT</strong> — Authentication Tokens</li>
      <li><strong>bcryptjs</strong> — Password Encryption</li>
    </ul>
  </div>
  <div class="tech-box">
    <h3>📱 Mobile App</h3>
    <ul>
      <li><strong>Expo SDK 52</strong> — Framework</li>
      <li><strong>React Native 0.76</strong> — Cross-Platform</li>
      <li><strong>expo-router v4</strong> — File-based Routing</li>
      <li><strong>expo-secure-store</strong> — Secure Storage</li>
      <li><strong>TanStack React Query</strong> — Data Fetching</li>
    </ul>
  </div>
  <div class="tech-box">
    <h3>🚀 DevOps & CI/CD</h3>
    <ul>
      <li><strong>GitHub Actions</strong> — CI/CD Pipeline</li>
      <li><strong>EAS (Expo)</strong> — Keystore Management</li>
      <li><strong>Gradle</strong> — Android Build</li>
      <li><strong>Google Play Console</strong> — Distribution</li>
      <li><strong>Replit</strong> — Hosting & Development</li>
    </ul>
  </div>
</div>

<h2>1.2 Project Statistics</h2>
<div class="two-col">
  <div class="stat-box"><div class="number">42+</div><div class="label">Total Pages/Screens</div></div>
  <div class="stat-box"><div class="number">6</div><div class="label">AI-Powered Features</div></div>
  <div class="stat-box"><div class="number">3</div><div class="label">User Roles</div></div>
  <div class="stat-box"><div class="number">5</div><div class="label">PLC/VFD Brands Supported</div></div>
</div>

<!-- SECTION 2: AUTHENTICATION -->
<h1 class="page-break">2. Authentication & User Roles</h1>

<h2>2.1 Login System</h2>
<div class="feature-box">
  <h3>Kaise Kaam Karta Hai:</h3>
  <ol>
    <li>User email aur password se login karta hai</li>
    <li>Server password verify karta hai <strong>bcryptjs</strong> encryption se</li>
    <li>Successful login par <strong>JWT Token</strong> generate hota hai (7 din valid)</li>
    <li>Token browser ke <strong>localStorage</strong> mein save hota hai</li>
    <li>Har API request mein token automatically send hota hai</li>
    <li>Token expire hone par user automatically logout ho jaata hai</li>
  </ol>
</div>

<h2>2.2 User Roles</h2>
<table>
  <tr><th>Role</th><th>Access Level</th><th>Available Features</th></tr>
  <tr>
    <td><span class="badge">Admin</span></td>
    <td>Full System Access</td>
    <td>Dashboard, Sales Pipeline, All AI Tools, User Management, Supplier Management, AI Control Center, System Health, Marketing Content, Reports, Settings — <strong>SAB KUCH</strong></td>
  </tr>
  <tr>
    <td><span class="badge-blue badge">Sales / Supplier</span></td>
    <td>Sales & Client Focus</td>
    <td>Dashboard, Map View, Used Machines Marketplace, Lead Management, Quotation Maker, Settings</td>
  </tr>
  <tr>
    <td><span class="badge-green badge">Technician</span></td>
    <td>Machine & Technical Focus</td>
    <td>Machine Catalog, AI Photo Solution, PLC/VFD Error Codes, Used Machines Marketplace, Maintenance Guide, Machine Guide</td>
  </tr>
</table>

<h2>2.3 Security Features</h2>
<div class="feature-box">
  <ul>
    <li><strong>Rate Limiting:</strong> Maximum 5 login attempts, uske baad 15 minute ka lockout</li>
    <li><strong>Auto Logout:</strong> 30 minute inactivity par automatic session expire</li>
    <li><strong>Activity Log:</strong> Har login, logout, aur failed attempt ka record</li>
    <li><strong>Password Encryption:</strong> bcryptjs se encrypted passwords — plain text kabhi store nahi hota</li>
    <li><strong>Route Guards:</strong> Unauthorized pages par access try karne par automatic redirect</li>
  </ul>
</div>

<!-- SECTION 3: DASHBOARD -->
<h1 class="page-break">3. Dashboard & Analytics</h1>
<div class="feature-box">
  <h3>Main Dashboard (/dashboard)</h3>
  <p>Login ke baad sabse pehle ye page dikhta hai. Isme business ke key metrics at-a-glance milte hain.</p>
  <ul>
    <li><strong>KPI Cards:</strong> Total Machines, Active Leads, Conversion Rate, Pipeline Value</li>
    <li><strong>Sales Pipeline Summary:</strong> Har stage mein kitne leads hain (New, Contacted, Quotation Sent, Won, Lost)</li>
    <li><strong>Recent Leads:</strong> Latest incoming leads ki list</li>
    <li><strong>Activity Feed:</strong> Recent actions jaise new quotes, lead updates, etc.</li>
  </ul>
</div>

<div class="feature-box">
  <h3>Growth Analytics (/growth)</h3>
  <ul>
    <li>Monthly revenue trends ka graph</li>
    <li>Lead conversion funnel visualization</li>
    <li>Regional performance analysis</li>
  </ul>
</div>

<div class="feature-box">
  <h3>Graphs & Charts (/graphs)</h3>
  <ul>
    <li>Machine category wise distribution</li>
    <li>Lead source analysis (IndiaMART vs Direct vs JustDial)</li>
    <li>AI usage statistics</li>
  </ul>
</div>

<div class="feature-box">
  <h3>Power Dashboard (/power-dashboard)</h3>
  <p>Admin-level advanced analytics with deep business insights.</p>
</div>

<div class="feature-box">
  <h3>Report Card (/report-card)</h3>
  <p>Team aur individual performance evaluation metrics.</p>
</div>

<!-- SECTION 4: AI FEATURES -->
<h1 class="page-break">4. AI-Powered Features</h1>
<p>SAI RoloTech CRM mein <strong>Google Gemini AI (gemini-2.5-flash model)</strong> integrated hai. Ye 6 major AI features power karta hai:</p>

<h2>4.1 AI Photo Solution (/ai-photo-solution)</h2>
<div class="feature-box">
  <h3>Ye Kya Hai?</h3>
  <p>Machine ki photo upload karo — AI turant diagnosis de dega ki problem kya hai aur kaise fix karna hai.</p>
  
  <h3>Kaise Kaam Karta Hai (Step-by-Step):</h3>
  <ol>
    <li><strong>Photo Upload:</strong> User phone camera se photo khichta hai ya gallery se select karta hai (max 10MB)</li>
    <li><strong>Base64 Conversion:</strong> Photo browser mein Base64 format mein convert hoti hai</li>
    <li><strong>API Call:</strong> Photo + optional description server ko bhejta hai (/api/ai-photo-solution)</li>
    <li><strong>AI Analysis:</strong> Gemini AI photo ko "Senior Industrial Engineer" ki tarah analyze karta hai</li>
    <li><strong>Diagnosis Report:</strong> AI ye cheezein batata hai:
      <ul>
        <li>Equipment identification (kaunsi machine hai)</li>
        <li>Problem identification (kya fault dikha)</li>
        <li>Step-by-step solution (kaise fix kare)</li>
        <li>Safety precautions (kya sawdhaniya rakhe)</li>
        <li>Preventive maintenance tips</li>
      </ul>
    </li>
  </ol>
  
  <h3>Supported Equipment:</h3>
  <ul>
    <li>Roll Forming Machines</li>
    <li>VFD (Variable Frequency Drives) — Vichi, Delta, Fuji</li>
    <li>PLC Systems — Siemens, Allen Bradley</li>
    <li>Servo Motors</li>
    <li>Decoilers, Straighteners, Punching Units</li>
  </ul>
  
  <h3>AI Response Language:</h3>
  <p>Hinglish (Hindi + English mix) — technicians ke liye easy to understand</p>
</div>

<h2 class="page-break">4.2 PLC/VFD Error Code System (/plc-error-codes)</h2>
<div class="feature-box">
  <h3>Ye Kya Hai?</h3>
  <p>Industrial machine pe error code aaye toh yahan search karo — turant solution milega.</p>
  
  <h3>Kaise Kaam Karta Hai:</h3>
  <ol>
    <li><strong>Local Database Search:</strong> Common error codes ka pre-built database hai — instant results milte hain bina internet ke</li>
    <li><strong>AI Expert Lookup:</strong> Agar code local database mein nahi mila, toh AI se poochho — detailed troubleshooting steps milenge</li>
  </ol>
  
  <h3>Supported Brands:</h3>
  <table>
    <tr><th>Brand</th><th>Series/Models</th><th>Error Types</th></tr>
    <tr><td>Vichi VFD</td><td>F Series, E Series</td><td>Overcurrent, Overvoltage, Overload, Communication</td></tr>
    <tr><td>Delta VFD</td><td>VFD-EL, VFD-M, VFD-CP, VFD-ED</td><td>Motor faults, Encoder errors, Temperature</td></tr>
    <tr><td>Fanuc</td><td>Servo Amplifier, CNC</td><td>Servo alarms, CNC errors, Axis faults</td></tr>
    <tr><td>Fuji Electric</td><td>FRENIC Series</td><td>Drive faults, Communication errors</td></tr>
    <tr><td>ABB</td><td>Motor Drives</td><td>Motor protection, Thermal faults</td></tr>
  </table>
  
  <h3>AI Response Format:</h3>
  <p>Har error code ke liye AI ye deta hai:</p>
  <ol>
    <li>Error ka full form/meaning</li>
    <li>Possible causes (3-5 reasons)</li>
    <li>Step-by-step troubleshooting</li>
    <li>Reset procedure</li>
    <li>Preventive measures</li>
  </ol>
  
  <h3>Safety Note:</h3>
  <p>System automatically remind karta hai: "Machine power OFF karo aur DC bus discharge hone do before working on hardware"</p>
</div>

<h2 class="page-break">4.3 AI Quotation Generator (/ai-quote)</h2>
<div class="feature-box">
  <h3>Ye Kya Hai?</h3>
  <p>AI automatically professional machine quotation generate karta hai — lead ka interest dekh ke price aur specs suggest karta hai.</p>
  
  <h3>Kaise Kaam Karta Hai:</h3>
  <ol>
    <li>Lead select karo (ya manual details enter karo)</li>
    <li>"AI Auto-Generate" button dabao</li>
    <li>AI lead ka budget, interest, aur machine type analyze karta hai</li>
    <li>Professional quotation generate hoti hai with:
      <ul>
        <li>Machine specifications</li>
        <li>Pricing (with GST 18%)</li>
        <li>Delivery terms</li>
        <li>Payment conditions</li>
        <li>Warranty details</li>
      </ul>
    </li>
    <li>PDF download ya print kar sakte ho</li>
  </ol>
</div>

<div class="feature-box">
  <h3>Quote Analyzer (/quote-analyzer)</h3>
  <p>Competitor ki quotation upload karo — AI analyze karke comparison report dega.</p>
</div>

<h2>4.4 AI Buddy System</h2>
<div class="feature-box">
  <h3>Buddy Dashboard (/buddy)</h3>
  <p>AI assistant ka analytics dashboard — kitne sessions hue, user satisfaction score, top queries</p>
  
  <h3>Buddy Rules (/buddy-rules)</h3>
  <p>Admin AI ki personality aur behavior configure kar sakta hai:</p>
  <ul>
    <li>Professional Greeting — kaise hello bole</li>
    <li>Price Range Only — exact price mat batao, range do</li>
    <li>No Competitor Comparison — competitors ka naam mat lo</li>
    <li>Language preference — Hinglish ya English</li>
  </ul>
  
  <h3>Buddy Parivar (/buddy-family)</h3>
  <p>Specialized AI sub-buddies:</p>
  <ul>
    <li><strong>Sales Buddy:</strong> Sales related queries handle karta hai</li>
    <li><strong>Tech Buddy:</strong> Technical troubleshooting mein help</li>
    <li><strong>Service Buddy:</strong> After-sales service queries</li>
  </ul>
</div>

<h2>4.5 AI Machine Expert (/machine-guide)</h2>
<div class="feature-box">
  <h3>MASTER — AI Machine Expert</h3>
  <p>Real-time machine troubleshooting assistant. Common problems ke liye instant solutions:</p>
  <ul>
    <li>"Strip Left Ja Rahi Hai" — Strip alignment issue fix</li>
    <li>"Profile Mein Twist" — Twisting problem solution</li>
    <li>"Machine Se Awaaz Aa Rahi Hai" — Noise diagnosis</li>
    <li>"Cutting Sahi Nahi Ho Rahi" — Cut-off issues</li>
  </ul>
</div>

<h2>4.6 AI Tools Hub (/ai-tools)</h2>
<div class="feature-box">
  <p>Sab AI features ek jagah — central directory:</p>
  <ul>
    <li>AI Photo Solution</li>
    <li>AI Quotation Generator</li>
    <li>Competitor Quote Analyzer</li>
    <li>Machine Troubleshooter</li>
    <li>AI Content Generator (Marketing)</li>
  </ul>
</div>

<!-- SECTION 5: SALES -->
<h1 class="page-break">5. Sales & Lead Management</h1>

<h2>5.1 Sales Pipeline (/sales-pipeline)</h2>
<div class="feature-box">
  <h3>Kanban Board Style Lead Tracking</h3>
  <p>Leads ko drag-and-drop karke stages mein move karo:</p>
  <table>
    <tr><th>Stage</th><th>Description</th></tr>
    <tr><td>🟢 New Lead</td><td>Nayi inquiry aayi — abhi contact nahi kiya</td></tr>
    <tr><td>🔵 Contacted</td><td>Lead se baat ho gayi</td></tr>
    <tr><td>🟡 Quotation Sent</td><td>Quote bhej di — response ka wait</td></tr>
    <tr><td>🟠 Negotiating</td><td>Price negotiation chal rahi hai</td></tr>
    <tr><td>✅ Won</td><td>Deal close ho gayi!</td></tr>
    <tr><td>❌ Lost</td><td>Deal nahi hui</td></tr>
  </table>
</div>

<h2>5.2 Lead Intelligence (/lead-intelligence)</h2>
<div class="feature-box">
  <ul>
    <li><strong>Source ROI Analysis:</strong> Kaun sa source (IndiaMART, Direct, JustDial) sabse zyada ROI de raha hai</li>
    <li><strong>Geographic Heatmap:</strong> Nearby vs Far leads — kaun se area se zyada inquiries aa rahi hain</li>
    <li><strong>Priority Scoring:</strong> Smart formula se leads ko prioritize karna — kaunsa lead pehle contact karna chahiye</li>
    <li><strong>Conversion Trends:</strong> Monthly conversion rate trends</li>
  </ul>
</div>

<h2>5.3 Lead Imports (/lead-imports)</h2>
<div class="feature-box">
  <h3>Bulk Lead Import Methods:</h3>
  <ul>
    <li><strong>CSV Upload:</strong> Excel/CSV file se bulk import</li>
    <li><strong>Gmail Integration:</strong> Automatically parse inquiry emails from:
      <ul>
        <li>IndiaMART inquiries</li>
        <li>JustDial leads</li>
        <li>TradeIndia inquiries</li>
      </ul>
    </li>
  </ul>
</div>

<h2>5.4 Sales Sequences (/sales-sequences)</h2>
<div class="feature-box">
  <h3>Automated Follow-up Workflows:</h3>
  <p>Pre-built multi-day follow-up sequences:</p>
  <ul>
    <li><strong>IndiaMART Lead Nurture:</strong> Day 1: WhatsApp → Day 3: Email → Day 5: Phone Call</li>
    <li><strong>Post-Demo Follow-up:</strong> Day 1: Thank You → Day 3: Quote → Day 7: Check-in</li>
    <li>Communication channels: WhatsApp, Email, Phone</li>
  </ul>
</div>

<h2>5.5 Demo Scheduler (/demo-scheduler)</h2>
<div class="feature-box">
  <ul>
    <li>Machine demonstrations aur factory visits schedule karo</li>
    <li>Status tracking: Scheduled / Completed / Cancelled</li>
    <li>Location types: Factory (Mundka), Customer Site, Video Call</li>
  </ul>
</div>

<!-- SECTION 6: QUOTATION -->
<h1 class="page-break">6. Quotation System</h1>

<h2>Quotation Maker (/quotation-maker)</h2>
<div class="feature-box">
  <h3>Professional Machine Quotation Generator</h3>
  
  <h3>Features:</h3>
  <ul>
    <li><strong>Lead Auto-Fill:</strong> Lead select karo — name, company, email, phone automatic fill</li>
    <li><strong>Machine Auto-Fill:</strong> Machine select karo — name aur standard price automatic</li>
    <li><strong>Multiple Line Items:</strong> Ek se zyada machines/items ek quote mein</li>
    <li><strong>Calculations:</strong> Automatic subtotal, discount (%), GST (18%), grand total</li>
    <li><strong>AI Generation:</strong> One-click AI se complete quote generate</li>
    <li><strong>PDF Export:</strong> Professional PDF format mein download/print</li>
  </ul>
  
  <h3>Quotation Fields:</h3>
  <table>
    <tr><th>Field</th><th>Description</th></tr>
    <tr><td>Reference Number</td><td>Unique ID (e.g., QT-K9W2X)</td></tr>
    <tr><td>Customer Details</td><td>Name, Company, Email, Phone, City</td></tr>
    <tr><td>Line Items</td><td>S.No, Description, HSN Code, Qty, Unit, Unit Price, Total</td></tr>
    <tr><td>Subtotal</td><td>All items ka total</td></tr>
    <tr><td>Discount</td><td>Percentage-based discount</td></tr>
    <tr><td>GST</td><td>18% tax calculation</td></tr>
    <tr><td>Grand Total</td><td>Final amount after discount + tax</td></tr>
    <tr><td>Terms</td><td>Delivery, Payment, Warranty conditions</td></tr>
    <tr><td>Validity</td><td>30 days default</td></tr>
    <tr><td>Company Info</td><td>SAI Rolotech address, GSTIN, contact</td></tr>
  </table>
</div>

<div class="feature-box">
  <h3>Quotation Logs (/quotations)</h3>
  <p>Sab generated quotes ka history:</p>
  <ul>
    <li>Status tracking: Draft → Sent → Accepted / Rejected</li>
    <li>Won Value statistics</li>
    <li>AI-generated vs Manual identification (Bot badge)</li>
    <li>Search & filter capability</li>
  </ul>
</div>

<!-- SECTION 7: MACHINE MANAGEMENT -->
<h1 class="page-break">7. Machine Management</h1>

<h2>7.1 Machine Catalog (/machines)</h2>
<div class="feature-box">
  <h3>Digital Machine Showroom</h3>
  <ul>
    <li>Machine types: Shutter Patti Machine, False Ceiling Machine, etc.</li>
    <li><strong>Pricing Wizard:</strong> Grade-based pricing configure karo:
      <ul>
        <li>Basic Grade — Manual operation</li>
        <li>Medium Grade — Semi-automatic</li>
        <li>Advance Grade — Fully automatic with PLC</li>
      </ul>
    </li>
    <li>Specifications, photos, aur detailed descriptions</li>
  </ul>
</div>

<h2>7.2 Used Machines Marketplace (/used-machines-marketplace)</h2>
<div class="feature-box">
  <h3>Buy & Sell Platform (Coming Soon)</h3>
  <ul>
    <li>Second-hand industrial machines ka marketplace</li>
    <li>Buyers aur sellers connect ho sakte hain</li>
    <li>Machine condition, age, aur price listing</li>
  </ul>
</div>

<h2>7.3 Maintenance Guide (/maintenance-guide)</h2>
<div class="feature-box">
  <h3>Complete Machine Maintenance System</h3>
  <p>Roll Forming Machines ke liye time-based maintenance schedules:</p>
  
  <table>
    <tr><th>Schedule</th><th>Frequency</th><th>Focus Area</th><th>Time Required</th></tr>
    <tr><td>Daily (Roz)</td><td>Har din start se pehle</td><td>Safety checks, surface cleaning, greasing</td><td>10-15 min</td></tr>
    <tr><td>Weekly (Hafta)</td><td>Har 7 din</td><td>Drive tension, temperature monitoring, panel cleaning</td><td>30-45 min</td></tr>
    <tr><td>Monthly (Mahina)</td><td>Har 30 din</td><td>Full lubrication, roll alignment, PLC backup</td><td>2-3 hours</td></tr>
    <tr><td>Quarterly (Timaahi)</td><td>Har 90 din</td><td>Gearbox oil change, hydraulic service, electrical inspection</td><td>Half day</td></tr>
    <tr><td>Yearly (Saal)</td><td>Annual</td><td>Complete overhaul, motor service, repainting</td><td>2-3 days</td></tr>
  </table>
  
  <h3>Features:</h3>
  <ul>
    <li><strong>Interactive Checklist:</strong> Tasks check-off karo — progress bar dikhta hai</li>
    <li><strong>Priority System:</strong> Critical / High / Normal priority labels</li>
    <li><strong>Categories:</strong> Lubrication, Mechanical, Electrical, Safety, Cleaning, Inspection</li>
    <li><strong>Spare Parts List:</strong> Essential spares with quantities and replacement frequency</li>
    <li><strong>Print Mode:</strong> Paper checklist print kar sakte ho workshop ke liye</li>
    <li><strong>Local Storage:</strong> Progress save hota hai — next time wahi se continue</li>
  </ul>
</div>

<!-- SECTION 8: MANAGEMENT -->
<h1 class="page-break">8. Management Tools</h1>

<h2>8.1 Supplier Management (/suppliers)</h2>
<div class="feature-box">
  <ul>
    <li>Machine aur component suppliers ka directory</li>
    <li>Contact details, specialization, aur rating</li>
    <li>Order history tracking</li>
  </ul>
</div>

<h2>8.2 Service Manager (/service-manager)</h2>
<div class="feature-box">
  <ul>
    <li>After-sales service requests handle karo</li>
    <li>Maintenance scheduling</li>
    <li>Service history tracking</li>
    <li>Technician assignment</li>
  </ul>
</div>

<h2>8.3 User Management (/users)</h2>
<div class="feature-box">
  <p>Admin-only feature:</p>
  <ul>
    <li>New users create karo</li>
    <li>Roles assign karo (Admin / Sales / Technician)</li>
    <li>User accounts activate/deactivate</li>
    <li>Activity logs dekho</li>
  </ul>
</div>

<h2>8.4 Product Manager (/product-manager)</h2>
<div class="feature-box">
  <ul>
    <li>Product list manage karo</li>
    <li>Specifications update karo</li>
    <li>Pricing configure karo</li>
  </ul>
</div>

<h2>8.5 Project Reports (/project-report)</h2>
<div class="feature-box">
  <ul>
    <li>Detailed project progress reports</li>
    <li>Client-wise project tracking</li>
    <li>Delivery status updates</li>
  </ul>
</div>

<!-- SECTION 9: MARKETING -->
<h1 class="page-break">9. Marketing & Communication</h1>

<h2>Marketing Content (/marketing-content)</h2>
<div class="feature-box">
  <h3>AI Content Generator</h3>
  <ul>
    <li>WhatsApp messages auto-generate</li>
    <li>Email templates create karo</li>
    <li>SMS content generate karo</li>
    <li><strong>Smart Timing Advisor:</strong> AI predict karta hai ki lead ko kab contact karna best rahega</li>
  </ul>
</div>

<h2>Outreach Templates (/outreach-templates)</h2>
<div class="feature-box">
  <ul>
    <li>Pre-built communication templates</li>
    <li>WhatsApp, Email, SMS ke liye ready-made formats</li>
    <li>Customize aur save karo</li>
  </ul>
</div>

<h2>WhatsApp Beta (/wa-beta)</h2>
<div class="feature-box">
  <ul>
    <li>WhatsApp integration testing</li>
    <li>Bulk messaging capability</li>
    <li>Message delivery tracking</li>
  </ul>
</div>

<h2>Map View (/map-view)</h2>
<div class="feature-box">
  <ul>
    <li>Leads aur clients ka geographic map view</li>
    <li>Area-wise distribution visualization</li>
    <li>Nearby leads identify karo</li>
  </ul>
</div>

<!-- SECTION 10: MOBILE APP -->
<h1 class="page-break">10. Mobile App (Android)</h1>

<h2>10.1 Architecture</h2>
<div class="tech-box">
  <table>
    <tr><th>Component</th><th>Technology</th></tr>
    <tr><td>Framework</td><td>Expo SDK 52 + React Native 0.76</td></tr>
    <tr><td>Routing</td><td>expo-router v4 (file-based)</td></tr>
    <tr><td>Auth Storage</td><td>expo-secure-store (encrypted)</td></tr>
    <tr><td>Data Fetching</td><td>TanStack React Query</td></tr>
    <tr><td>Package Name</td><td>com.vipinjangra.crmmobile</td></tr>
    <tr><td>Target API</td><td>Android API 35</td></tr>
    <tr><td>Min API</td><td>Android API 24 (Android 7.0+)</td></tr>
  </table>
</div>

<h2>10.2 Screens & Features</h2>
<div class="feature-box">
  <h3>Authentication Screens:</h3>
  <ul>
    <li><strong>Login:</strong> Branded login card with email/password</li>
    <li><strong>Forgot Password:</strong> Email-based password recovery</li>
  </ul>
  
  <h3>Main App Screens (Tab Navigation):</h3>
  <table>
    <tr><th>Tab</th><th>Screen</th><th>Features</th></tr>
    <tr><td>🏠 Home</td><td>Dashboard</td><td>Total Customers, Active Leads, Sales, Tasks + Recent Activity feed</td></tr>
    <tr><td>👥 Customers</td><td>Customer List</td><td>Contact details, city, status (Active/Inactive)</td></tr>
    <tr><td>📊 Leads</td><td>Lead Pipeline</td><td>Lead source, value, stage (Proposal/Negotiation)</td></tr>
    <tr><td>👤 Profile</td><td>User Profile</td><td>Role, ID, Settings, Notifications, Logout</td></tr>
  </table>
</div>

<h2>10.3 CI/CD Pipeline — Automatic Updates</h2>
<div class="feature-box">
  <h3>GitHub Actions se Automatic Build & Deploy</h3>
  <p>Jab bhi GitHub pe naya release banate ho, ye automatically hota hai:</p>
  <ol>
    <li><strong>Trigger:</strong> GitHub Release create hone par CI start hota hai</li>
    <li><strong>Setup:</strong> Node.js 20, Java 17, Android SDK install hote hain</li>
    <li><strong>Version Bump:</strong> versionCode automatically +1 hota hai</li>
    <li><strong>Expo Prebuild:</strong> Android project files generate hote hain</li>
    <li><strong>Keystore Download:</strong> EAS se signing keystore download hota hai (Expo GraphQL API se)</li>
    <li><strong>Gradle Build:</strong> AAB (Android App Bundle) build hota hai</li>
    <li><strong>Upload:</strong> AAB GitHub Release mein upload hota hai</li>
  </ol>
  
  <h3>Build Specs:</h3>
  <ul>
    <li>Build time: ~15 minutes</li>
    <li>Output: .aab file (~34 MB)</li>
    <li>Signing: EAS-managed keystore (automatic)</li>
    <li>Kotlin version: 1.9.25 (forced via Gradle init script)</li>
  </ul>
</div>

<!-- SECTION 11: SYSTEM ADMIN -->
<h1 class="page-break">11. System Administration</h1>

<h2>AI Control Center (/ai-control)</h2>
<div class="feature-box">
  <h3>Mission Control for Admins</h3>
  <ul>
    <li><strong>Feature Toggles:</strong> Maintenance Mode ON/OFF, AI Responses ON/OFF, WhatsApp Messaging ON/OFF</li>
    <li><strong>System Health Monitor:</strong> Server uptime, response times, error rates</li>
    <li><strong>Error Logs:</strong> Recent system errors ka log</li>
    <li><strong>AI Usage Stats:</strong> Kitne AI queries ho rahe hain, costs, etc.</li>
  </ul>
</div>

<h2>App Health (/admin-health)</h2>
<div class="feature-box">
  <ul>
    <li>System status monitoring</li>
    <li>Database connection health</li>
    <li>API response times</li>
    <li>Memory usage</li>
  </ul>
</div>

<h2>Feedback & Support</h2>
<div class="feature-box">
  <ul>
    <li><strong>Feedback (/feedback):</strong> Users feedback submit kar sakte hain</li>
    <li><strong>Support (/support):</strong> Help desk aur FAQ section</li>
  </ul>
</div>

<!-- SECTION 12: COMPLETE PAGE LIST -->
<h1 class="page-break">12. Complete Page List (42+ Pages)</h1>

<table>
  <tr><th>#</th><th>Page</th><th>URL</th><th>Access</th></tr>
  <tr><td>1</td><td>Login</td><td>/login</td><td>Public</td></tr>
  <tr><td>2</td><td>Register</td><td>/register</td><td>Public</td></tr>
  <tr><td>3</td><td>Forgot Password</td><td>/forgot-password</td><td>Public</td></tr>
  <tr><td>4</td><td>Role Select</td><td>/role-select</td><td>Authenticated</td></tr>
  <tr><td>5</td><td>Dashboard</td><td>/dashboard</td><td>All Roles</td></tr>
  <tr><td>6</td><td>Home</td><td>/home</td><td>All Roles</td></tr>
  <tr><td>7</td><td>Sales Pipeline</td><td>/sales-pipeline</td><td>Admin, Sales</td></tr>
  <tr><td>8</td><td>Sales Tasks</td><td>/sales-tasks</td><td>Admin, Sales</td></tr>
  <tr><td>9</td><td>Sales Sequences</td><td>/sales-sequences</td><td>Admin, Sales</td></tr>
  <tr><td>10</td><td>Lead Intelligence</td><td>/lead-intelligence</td><td>Admin</td></tr>
  <tr><td>11</td><td>Lead Imports</td><td>/lead-imports</td><td>Admin</td></tr>
  <tr><td>12</td><td>Demo Scheduler</td><td>/demo-scheduler</td><td>Admin, Sales</td></tr>
  <tr><td>13</td><td>Machine Catalog</td><td>/machines</td><td>All Roles</td></tr>
  <tr><td>14</td><td>AI Photo Solution</td><td>/ai-photo-solution</td><td>All Roles</td></tr>
  <tr><td>15</td><td>PLC/VFD Error Codes</td><td>/plc-error-codes</td><td>All Roles</td></tr>
  <tr><td>16</td><td>Machine Guide</td><td>/machine-guide</td><td>Technician</td></tr>
  <tr><td>17</td><td>Maintenance Guide</td><td>/maintenance-guide</td><td>Technician</td></tr>
  <tr><td>18</td><td>Used Machines</td><td>/used-machines-marketplace</td><td>All Roles</td></tr>
  <tr><td>19</td><td>Quotation Maker</td><td>/quotation-maker</td><td>Admin, Sales</td></tr>
  <tr><td>20</td><td>Quotation Logs</td><td>/quotations</td><td>Admin, Sales</td></tr>
  <tr><td>21</td><td>AI Quote</td><td>/ai-quote</td><td>Admin</td></tr>
  <tr><td>22</td><td>Quote Analyzer</td><td>/quote-analyzer</td><td>Admin</td></tr>
  <tr><td>23</td><td>AI Tools Hub</td><td>/ai-tools</td><td>Admin</td></tr>
  <tr><td>24</td><td>AI Control</td><td>/ai-control</td><td>Admin</td></tr>
  <tr><td>25</td><td>Buddy Dashboard</td><td>/buddy</td><td>Admin</td></tr>
  <tr><td>26</td><td>Buddy Rules</td><td>/buddy-rules</td><td>Admin</td></tr>
  <tr><td>27</td><td>Buddy Family</td><td>/buddy-family</td><td>Admin</td></tr>
  <tr><td>28</td><td>Supplier Management</td><td>/suppliers</td><td>Admin</td></tr>
  <tr><td>29</td><td>Service Manager</td><td>/service-manager</td><td>Admin</td></tr>
  <tr><td>30</td><td>Product Manager</td><td>/product-manager</td><td>Admin</td></tr>
  <tr><td>31</td><td>User Management</td><td>/users</td><td>Admin</td></tr>
  <tr><td>32</td><td>Growth Analytics</td><td>/growth</td><td>Admin</td></tr>
  <tr><td>33</td><td>Graphs & Charts</td><td>/graphs</td><td>Admin</td></tr>
  <tr><td>34</td><td>Report Card</td><td>/report-card</td><td>Admin</td></tr>
  <tr><td>35</td><td>Power Dashboard</td><td>/power-dashboard</td><td>Admin</td></tr>
  <tr><td>36</td><td>Project Reports</td><td>/project-report</td><td>Admin</td></tr>
  <tr><td>37</td><td>Map View</td><td>/map-view</td><td>Admin, Sales</td></tr>
  <tr><td>38</td><td>Marketing Content</td><td>/marketing-content</td><td>Admin</td></tr>
  <tr><td>39</td><td>Outreach Templates</td><td>/outreach-templates</td><td>Admin</td></tr>
  <tr><td>40</td><td>WhatsApp Beta</td><td>/wa-beta</td><td>Admin</td></tr>
  <tr><td>41</td><td>Settings</td><td>/settings</td><td>All Roles</td></tr>
  <tr><td>42</td><td>Admin Health</td><td>/admin-health</td><td>Admin</td></tr>
  <tr><td>43</td><td>Feedback</td><td>/feedback</td><td>All Roles</td></tr>
  <tr><td>44</td><td>Support</td><td>/support</td><td>All Roles</td></tr>
  <tr><td>45</td><td>Privacy Policy</td><td>/privacy-policy</td><td>Public</td></tr>
  <tr><td>46</td><td>Terms of Service</td><td>/terms</td><td>Public</td></tr>
  <tr><td>47</td><td>About / Landing</td><td>/about</td><td>Public</td></tr>
</table>

<div class="footer" style="margin-top: 50px;">
  <p><strong>SAI RoloTech CRM</strong> — Industrial Automation CRM Portal</p>
  <p>Version 2.2.11 | com.vipinjangra.crmmobile</p>
  <p>Website: sairolotech.com | Email: sairolotech@gmail.com</p>
  <p>Document Generated: March 29, 2026</p>
  <p style="margin-top: 10px; opacity: 0.5;">Confidential — For Internal Use Only</p>
</div>

</body>
</html>`;

fs.writeFileSync('public/docs/SAI-RoloTech-CRM-Documentation.html', html);
console.log('HTML documentation created');
