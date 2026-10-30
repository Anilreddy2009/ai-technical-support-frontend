# Support desk - React frontend

React 18 + Vite + React Router + TanStack Query. Plain CSS, no UI kit. Talks to the NestJS backend.

## Run
```bash
# backend first: docker compose up -d && npm run migration:run && npm run seed && npm run start:dev
cp .env.example .env
npm install
npm run dev          # http://localhost:5173  (proxies /api to http://localhost:3000)
```
Demo logins are on the sign-in page (password `Passw0rd!`).

## Screens
| Route | Who | What |
|---|---|---|
| /login | all | Sign in, demo account shortcuts |
| / | all | Ticket inbox, All/Open/Closed filter, New ticket dialog |
| /tickets/:id | all | Conversation, composer (manual reply or add customer message), environment details, investigation, draft, evidence, approval |
| /documentation | admin: manage, agent: view | Ingest a PDF URL, live progress, failed/interrupted + Retry, version / retrieval date / extraction limitations |

Cited passages open in a slide-over styled like a manual page (page number in the margin, cited quote highlighted, source URL, retrieval date, full-page view).

## Assignment states covered
- Loading, empty and error states on every list; network errors explain what to check.
- Docs not ready: banner on tickets, Investigate disabled, explanation of what still works.
- Repeated Investigate: backend returns the active one, UI shows "Investigation already running." (button also disabled while active).
- Outdated draft: amber banner, old draft kept (dimmed, read-only), Approve disabled, "Run new investigation".
- Double approval / conflicts: server message shown ("This reply was already sent."), data refetched.
- Failed investigation: reason + "Start a new investigation"; ticket viewing and manual replies unaffected.
- Interrupted investigation / ingestion: warning + Resume / Retry.
- Approved reply shows author and time; original AI draft stays viewable on the message.
- Closed tickets are readable but read-only.
- Cross-company or unknown ticket: "does not exist, or you do not have access" (the backend returns 404 for both).

## Structure
```
src/api/        fetch client (token, ApiError with code), query hooks with polling
src/auth/       AuthContext (login, logout, clears cache on account change)
src/components/ Layout, PassageDrawer (+ context), shared UI
src/features/ticket/  Conversation, Composer, EnvironmentPanel, InvestigationPanel, DraftView
src/pages/      Login, Tickets, TicketDetail, Documents
```

## Notes
- Written without network access: JSX was syntax-checked only, not run in a browser.
- Token is kept in localStorage for simplicity; for production prefer an httpOnly cookie.
- Fonts load from Google Fonts with system fallbacks.
