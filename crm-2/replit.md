# SAI RoloTech CRM 5.7 PRO

## Overview
SAI RoloTech CRM is a comprehensive, full-featured web application designed for industrial automation companies. It offers a professional, light-themed admin dashboard with extensive business management functionalities, role-based access control, and advanced AI integrations. The system supports PWA and Capacitor for native mobile experiences (Android/iOS), enabling broad accessibility and a seamless user experience across devices. The project aims to provide a robust solution for managing leads, customer interactions, sales pipelines, and internal operations, significantly enhancing efficiency and market potential for industrial automation businesses.

## User Preferences
I prefer that the agent focuses on the essential information, avoids verbose explanations, and prioritizes actionable steps. Do not make changes to the `public/` directory unless strictly necessary for PWA/Capacitor functionality. Do not make changes to `MOBILE_BUILD.md`. Ensure that all AI outputs are validated and adhere to safety standards. Do not make changes to the `server/services/aiManager.js` file regarding the OpenRouter primary and Gemini fallback configuration. All data operations should exclusively use Supabase, and Replit's built-in PostgreSQL should never be utilized. RLS on Supabase tables should remain disabled for development environments.

## System Architecture

### UI/UX Decisions
The application features a glass-card light-themed UI. It is fully responsive with a mobile sidebar and swipe navigation. Pages are lazy-loaded and include error boundaries for robustness. A toggle between Editor/Visitor modes is available, alongside a slide-out AI Buddy panel. Real-time toast notifications, virtual scrolling in data tables, and adaptive animations enhance the user experience.

### Technical Implementations
The frontend is built with React 18, TypeScript, and Vite, utilizing Tailwind CSS with custom CSS variables for styling. Wouter handles routing, and Framer Motion provides animations. Radix UI primitives and custom components form the UI library, with Lucide React for icons. The application integrates with the Gmail API for lead capture and uses WhatsApp Business API for communication. Security is hardened with strict CORS, CSP, AI output validation, and comprehensive error handling.

### Feature Specifications
- **PWA & Mobile Support**: Installable PWA (`public/manifest.json`, `public/sw.js`) and Capacitor-based native Android/iOS apps (`capacitor.config.json`).
- **Gmail Lead Capture**: Six backend endpoints manage Gmail integration for smart lead syncing, parsing, and CRM import from IndiaMart, JustDial, and TradeIndia emails.
- **Business Engine**: Includes meeting auto-booking via WhatsApp, a color-coded lead priority dashboard, user analytics, and a quotation tracker. A smart notification router directs messages based on user presence.
- **CRM Backend**: Modular structure in `server/` with dedicated services for AI management, job queueing, WhatsApp communication, push notifications (FCM), follow-up scheduling, Google Calendar integration, and reporting.
- **Lead Scoring**: Leads are scored (COLD, WARM, HOT, VERY_HOT) based on activity, triggering specific alerts and follow-ups.
- **Premium UI (v5.9)**: Skeleton shimmer loaders on dashboard, premium glass-card hover effects, gradient top borders on stats/section cards, smooth data-row hover animations, mobile-optimized interactions.
- **AI Smart Sales (v5.9)**: Conversation memory per lead (10 msg, 24h TTL), temperature-adaptive sales strategies (VERY_HOT→closing, HOT→demo, WARM→educate, COLD→rapport), rich context (name/city/product/score/history) passed to Gemini.
- **AI Memory System (v6.0)**: Persistent conversation store (`data/conversations.json`), intent detection (visit_plan, meeting_confirm, price_interest, demo_request, machine_inquiry, callback_request, positive_signal), smart auto follow-up scheduler (`data/smart_followups.json`), meeting reminder system (day-before + same-morning), full lead memory profile passed to Gemini. Smart follow-ups: DND-safe, deduplication, defer on recent activity, proper send/fail retry. Admin APIs: `/api/admin/memory/stats`, `/api/admin/memory/lead/:phone`.
- **AI Notes & Tasks System (v6.1)**: Gemini-powered lead notes generation (summary, customerNeed, interestLevel, nextAction, priority, keyPoints, followupMessage). Auto-task creation from AI notes (priority-based scheduling: HIGH=4h, MEDIUM=24h, LOW=48h). Daily morning plan (9 AM cron) with Hinglish action plan. AI follow-up message generation. Task states: pending→processing→completed/failed/skipped. Bulk notes generation. Admin APIs: `/api/admin/tasks/*` (stats, today, upcoming, daily-plan, create, complete, skip), `/api/admin/notes/*` (all, per-lead, generate, bulk-generate), `/api/admin/followup-message/:phone`. Data files: `data/lead_notes.json`, `data/tasks.json`.
- **Authentication**: Features a complete login/registration flow with role-based access (`admin`, `supplier`, `machine_user`, `new_user`, `operator`) and an `AuthContext` for state management.

### System Design Choices
- **Data Layer**: A `dataService.ts` provides a unified CRUD interface for all Supabase tables, replacing legacy API clients.
- **Modular Backend**: Services and models are separated for maintainability and scalability.
- **AI Integration**: Gemini is the primary AI, with OpenRouter/Codex for specific tasks. AI responses are validated and include a confidence gate and retry mechanism.
- **Job Queue**: An in-memory job queue with retry logic and exponential backoff handles asynchronous tasks like notifications and follow-ups.
- **Security**: Strict security measures are implemented, including input validation, secure error handling, and robust authentication.

## External Dependencies
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini (primary), OpenRouter/Codex (for specific audits)
- **Email**: Gmail API
- **Messaging**: WhatsApp Business API, Firebase Cloud Messaging (FCM)
- **Calendar**: Google Calendar API
- **Frontend Libraries**: React, TypeScript, Vite, Tailwind CSS, Wouter, Framer Motion, Recharts, Radix UI, Lucide React