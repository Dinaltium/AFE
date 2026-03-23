# AFE v1 — Release Notes

> Complete implementation of the AFE (Autonomous Finance Engine) frontend, auth system, database layer, theme system, and test suite.

**Date:** March 2026
**Branch:** main
**Tests:** 18 frontend (Vitest) + 23 Python (pytest) — all passing

---

## Overview

This release takes the project from a minimal scaffold with a redirect `/` page and mock user data to a fully functional application with real authentication, a Neon PostgreSQL database, a professional landing page, a complete dashboard, and a theme system.

---

## 1. Frontend — Shadcn/UI Configuration

**Files changed:**
- `apps/web/components.json` *(new)*
- `apps/web/tailwind.config.js` *(updated)*
- `apps/web/src/app/globals.css` *(updated)*

**What changed:**

Created `components.json` to configure shadcn/ui with the Default style, Neutral base colour, and CSS variable mode enabled. Updated `tailwind.config.js` to extend the theme with shadcn's HSL CSS variable tokens (`background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover`, `border`, `input`, `ring`) plus a full sidebar token set. Replaced the hand-written CSS utility classes in `globals.css` with the standard shadcn neutral variable sheet (light + dark).

**Installed packages:**
```
tailwindcss-animate
@radix-ui/* (auto-installed by shadcn add)
```

**Shadcn components added:**
`button` `input` `label` `card` `dialog` `sheet` `dropdown-menu` `avatar` `badge` `separator` `skeleton` `toast` `sonner` `table` `tabs` `form` `select` `textarea` `switch` `alert-dialog` `progress`

All component files written to `src/components/ui/`.

---

## 2. Navbar Components

**Note:** `@kokonutui/morphic-navbar` and `@react-bits/CardNav-JS-CSS` are not available on their respective registries. Equivalent desktop sidebar and mobile bottom navigation were built as custom components in Step 7 (`DashboardLayout.tsx`).

---

## 3. Database — Neon + Drizzle ORM

**Files added:**
- `apps/web/src/lib/db/schema.ts`
- `apps/web/src/lib/db/index.ts`
- `apps/web/drizzle.config.ts`
- `apps/web/.env.example` *(updated)*

### Schema (`schema.ts`)

Four application tables:

| Table | Key columns |
|-------|-------------|
| `users` | `id` uuid PK, `email` unique, `name`, `image`, `user_type` enum, `is_admin` bool, `created_at` |
| `user_profiles` | `id` uuid PK, `user_id` FK→users, `annual_income_estimate`, `tax_rate`, `collaborator_rate`, `collaborator_name`, `theme_config` jsonb |
| `payments` | `id` uuid PK, `user_id` FK→users, `amount`, `source`, `tax_amount`, `collaborator_amount`, `owner_amount`, `confidence`, `route_action`, `architect_reasoning` |
| `audit_events` | `id` serial PK, `payment_id`, `user_id` FK→users, `event_type`, `description`, `amount`, `created_at` |

Three NextAuth adapter tables added to the same schema: `accounts` (OAuth tokens), `sessions`, `verification_tokens`.

### DB client (`index.ts`)

Exports a Neon HTTP transport (`@neondatabase/serverless`) wired to Drizzle using `DATABASE_URL` from env. Falls back gracefully if not configured.

### Drizzle Kit config (`drizzle.config.ts`)

Points at `src/lib/db/schema.ts`, outputs migrations to `./drizzle/`, dialect `postgresql`.

**Installed packages:**
```
@neondatabase/serverless
drizzle-orm
drizzle-kit (dev)
```

---

## 4. Authentication — NextAuth v5

**Files added:**
- `apps/web/src/lib/auth.ts`
- `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- `apps/web/src/middleware.ts`
- `apps/web/src/types/next-auth.d.ts`
- `apps/web/.env.example` *(updated)*

### `auth.ts`

Configured NextAuth v5 (beta) with:
- **Google OAuth provider** — standard PKCE flow
- **Credentials provider** — email + bcrypt password validation against `users` table
- **Drizzle adapter** — connected to the Neon DB for OAuth account storage
- **JWT session strategy** — no server-side session storage required
- **Callbacks** — `jwt` enriches the token with `id`, `userType`, `isAdmin`; `session` forwards those to `session.user`
- **Auto-profile creation** — on first sign-in, inserts a row into `user_profiles` if none exists

### Route handler

`/api/auth/[...nextauth]/route.ts` exports `{ GET, POST }` from the auth config.

### Middleware (`middleware.ts`)

Protects all routes under `/dashboard` and `/settings`. Unauthenticated requests are redirected to `/login?callbackUrl=<original>`. Public routes (`/`, `/login`, `/signup`) are always accessible.

### Type augmentation (`next-auth.d.ts`)

Extends `Session["user"]` and `JWT` to include `id`, `userType`, and `isAdmin` without `any` types.

**Installed packages:**
```
next-auth@beta
@auth/drizzle-adapter
bcryptjs
@types/bcryptjs (dev)
```

---

## 5. Landing Page

**Files added:**
- `apps/web/src/app/page.tsx` *(replaced redirect)*
- `apps/web/src/components/providers/SmoothScroll.tsx`
- `apps/web/src/components/landing/LandingPage.tsx`

### Design

Dark background `#0A0A0A` throughout, primary accent `#00FF9C`, no emojis — Lucide React icons only.

### Sections

| Section | Description |
|---------|-------------|
| Navbar | Fixed top bar with logo, nav links, Log in + Get started CTAs |
| Hero | Full-viewport centred section: animated headline "Your finances, on autopilot.", two CTAs (Get started free → /signup, See how it works → smooth scroll anchor) |
| Stats bar | 4-column: 1.5B gig workers / $500B+ market / 20-40% earnings lost / 0 manual work with AFE |
| Features | 3 cards — Smart Income Split, Glass Box Audit Trail, Deal Vetting Agent — each with Lucide icon |
| How it works | 3 numbered steps with connecting gradient line — Payment arrives, AI thinks, Builder executes |
| Testimonials | 3 mock testimonials from Creator / Freelancer / Consultant user types |
| CTA | Full-width "Start for free today." section |
| Footer | Logo, tagline, nav links, copyright |

### Animations

All sections use `motion` (`motion/react`) with `useInView` for fade-up on scroll. Hero text animates on mount. Cards use staggered children. Smooth scrolling via `@studio-freight/lenis` (8% lerp).

**Installed packages:**
```
motion
@studio-freight/lenis
```

---

## 6. Auth Pages

**Files added:**
- `apps/web/src/app/(auth)/layout.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/signup/page.tsx`
- `apps/web/src/app/api/auth/signup/route.ts`
- `apps/web/src/app/dashboard/onboarding/page.tsx`

**Installed packages:**
```
react-hook-form
@hookform/resolvers
zod
```

### Auth layout

Dark centred layout (`#0A0A0A`) that frames the card on all auth routes.

### Login (`/login`)

Shadcn `Card` with:
- `react-hook-form` + zod schema (`email`, `password` ≥ 8 chars)
- "Continue with Google" button using inline SVG Google logo
- `Separator` between OAuth and email/password sections
- `signIn("credentials", { redirect: false })` on submit, Sonner `toast.error` on failure
- "Don't have an account? Sign up" footer link

### Signup (`/signup`)

Same layout with additional fields:
- `name` (required)
- `confirm password` with equality refinement in zod schema
- User type segmented selector — three clickable cards for Creator, Freelancer, Consultant — implemented with Shadcn `Button` toggled state
- On success, `POST /api/auth/signup` then `signIn("credentials")` then redirect to `/dashboard/onboarding`

### Signup API (`/api/auth/signup`)

`POST` handler that:
1. Validates required fields
2. Checks for duplicate email → 409 if exists
3. Inserts into `users` table
4. Creates empty `user_profiles` row
5. Returns `{ id }` with 201

### Onboarding (`/dashboard/onboarding`)

Post-signup profile setup form:
- annual income estimate — triggers suggested tax rate via `suggestTaxRate()` helper (maps income slabs to 5/10/20/30%)
- tax rate (pre-filled from suggestion, editable)
- collaborator name and rate
- Submit calls `updateUserProfile()` server action → redirects to `/dashboard`

---

## 7. Dashboard Overhaul

**Files added/updated:**
- `apps/web/src/app/dashboard/layout.tsx`
- `apps/web/src/components/dashboard/DashboardLayout.tsx`
- `apps/web/src/components/dashboard/DashboardOverview.tsx`
- `apps/web/src/app/dashboard/page.tsx` *(replaced)*
- `apps/web/src/app/dashboard/payments/page.tsx`
- `apps/web/src/components/dashboard/PaymentsTable.tsx`
- `apps/web/src/app/dashboard/audit/page.tsx`
- `apps/web/src/components/dashboard/AuditTimeline.tsx`
- `apps/web/src/app/dashboard/vetting/page.tsx`
- `apps/web/src/components/dashboard/VettingPageClient.tsx`

### Dashboard layout server component

Calls `auth()`, redirects to `/login` if no session. Passes session to `DashboardLayout` and wraps children in `ThemeProvider`.

### `DashboardLayout.tsx` (client)

**Desktop:** Fixed 240px left sidebar with:
- "AFE" logo in `#00FF9C`
- Nav items (Lucide icons): Dashboard (`LayoutDashboard`), Payments (`CreditCard`), Audit Log (`Shield`), Vetting (`Target`), Settings (`Settings2`)
- `usePathname()` for active highlight
- Footer: shadcn `Avatar` + user name + `Badge` showing user type + `SignOutButton`

**Mobile:** Bottom fixed navigation bar (5 icon tabs) + hamburger `Sheet` for full menu.

### Dashboard home (`/dashboard`)

Server component fetches `getPaymentHistory()` + `getAuditLog()` in parallel, passes to `DashboardOverview` client component.

**4 stat cards** computed from payment history:
- Total Processed — sum of all `amount`
- Tax Reserved — sum of all `tax_amount`
- Collaborator Paid — sum of all `collaborator_amount`
- Take-home — sum of all `owner_amount`

**Income chart** — Recharts stacked bar chart (Tax / Collaborator / Owner breakdown per payment).

**Recent splits** — last 5 payments in a shadcn `Table`.

**Glass Box feed** — right panel showing `GlassBoxFeed` (updated to use Lucide icons).

**Payment input panel** — `PaymentPanel` component for submitting new payments.

### Payments page (`/dashboard/payments`)

Full history table with columns: Date, Source, Amount, Tax, Collaborator, Take-home, Route (colour-coded badge), Confidence (%). Uses shadcn `Skeleton` for loading state.

### Audit page (`/dashboard/audit`)

Timeline layout. Each row: timestamp, event type badge (PaymentReceived = blue, ArchitectDecision = amber, SplitExecuted = green, PaymentFlagged = red), full description text. Data from `getAuditLog()`.

### Vetting page (`/dashboard/vetting`)

Renders existing `VettingPanel` at top. Session-history table below shows deals vetted during the current browser session (local state — no DB persistence for vetting in v1).

---

## 8. Settings Page

**Files added:**
- `apps/web/src/app/dashboard/settings/page.tsx`
- `apps/web/src/components/dashboard/SettingsClient.tsx`

Four tabs using shadcn `Tabs`:

### Profile tab
Edit `annual_income_estimate`, `tax_rate`, `collaborator_name`, `collaborator_rate`. Save via `updateUserProfile()`. Name and user_type shown read-only (managed by auth provider).

### Appearance tab
- **Preset cards:** Coding Vibe (dark + green), Dark (neutral dark), Light — clickable, applies immediately via `applyTheme()`
- **Color pickers:** `<input type="color">` for primary, background, foreground — live preview panel updates as colours change
- **Custom JSON textarea:** Accepts theme JSON in the format `{ "name": "...", "colors": { ... } }` with validation
- **Save** stores `themeConfig` to `user_profiles.theme_config` via `updateUserProfile()`

### Account tab
- Change password form (stubbed — inputs disabled with "Feature in development" notice)
- **Danger zone** — shadcn `AlertDialog` confirming account deletion. On confirm: calls `deleteAccount()` server action → signs out → redirects to `/`

### Notifications tab
Four `Switch` components for email notification categories — stubbed with "Feature in development" notice. No backend integration in v1.

---

## 9. Theme System

**Files added:**
- `apps/web/src/lib/theme.ts`
- `apps/web/src/components/providers/ThemeProvider.tsx`
- `apps/web/src/app/api/user/theme/route.ts`

### `theme.ts`

```ts
CODING_VIBE_THEME  // default dark + #00FF9C theme JSON
applyTheme(colors) // hex→HSL conversion, injects CSS vars into :root
loadUserTheme()    // fetches /api/user/theme and calls applyTheme()
```

Hex-to-HSL conversion handles all colour tokens so theme colours integrate correctly with Tailwind's HSL CSS variable system.

### `ThemeProvider.tsx`

Client component wrapper. On mount: applies `CODING_VIBE_THEME` immediately (prevents flash of unstyled content), then fetches the user's saved theme from `/api/user/theme` and re-applies if different. Exposes `useTheme()` hook returning `{ currentTheme, setTheme, resetToDefault }`.

### `/api/user/theme`

`GET` handler — uses `auth()` to identify the session user, queries `user_profiles.theme_config`, returns it as JSON. Returns `null` themeConfig if no profile or no saved theme.

---

## 10. Emoji Removal

**Files updated:**
- `apps/web/src/lib/utils.ts`
- `apps/web/src/lib/constants.ts`
- `apps/web/src/components/glass-box/GlassBoxFeed.tsx`
- `apps/web/src/components/vetting/VettingPanel.tsx`

### `utils.ts`

Removed `userEmoji(type): string` which returned emoji characters. Replaced with:
```ts
userIcon(type): "video" | "pen-line" | "briefcase" | "user"
```
Returns a Lucide icon name string. Components use `<Video />`, `<PenLine />`, `<Briefcase />`, `<User />` from `lucide-react`.

### `constants.ts`

`EVENT_ICONS` changed from `Record<string, string>` (emoji) to `Record<string, LucideIcon>` (Lucide component references):

| Event type | Old value | New value |
|------------|-----------|-----------|
| PaymentReceived | Emoji | `ArrowDownToLine` |
| ArchitectDecision | Emoji | `Brain` |
| SplitExecuted | Emoji | `CheckCircle2` |
| PaymentFlagged | Emoji | `AlertTriangle` |

Import block moved to top of file.

### `GlassBoxFeed.tsx`

Updated to render `const Icon = EVENT_ICONS[event.event_type]` as `<Icon className="w-3 h-3" />` instead of a text/emoji span. All colour classes use theme CSS variables (`text-foreground`, `text-muted-foreground`, `border-border`).

### `VettingPanel.tsx`

Added optional `onVetComplete?: (result: DealVetResponse) => void` callback prop so `VettingPageClient` can record session history without modifying core logic.

---

## 11. Server Actions

**File updated:** `apps/web/src/lib/actions.ts`

All actions now get `user_id` from the NextAuth session via `auth()`. A `requireSession()` helper throws `"Unauthenticated"` if no session is present, so no action can be called without a valid user.

| Action | What it does |
|--------|-------------|
| `processPayment()` | Calls engine `/split/`, persists result to `payments` table in Neon |
| `getAuditLog()` | Queries `audit_events` table filtered by session user (falls back to engine API if no session) |
| `vetDeal()` | Calls engine `/vet/` with session `user_id` injected |
| `getUsers()` | Calls engine `/users/` (unchanged) |
| `getPaymentHistory(page, limit)` | Paginates `payments` table for session user, returns typed rows |
| `getUserProfile()` | Fetches `user_profiles` row for session user |
| `updateUserProfile(data)` | Partial update of `user_profiles` — accepts any subset of income/rate/theme fields |
| `deleteAccount()` | Deletes `users` row for session user (cascades to all related tables via FK) |

---

## 12. Python Engine Updates

**Files updated:**
- `services/engine/src/core/config.py`
- `services/engine/src/models/users.py`
- `services/engine/src/routers/split.py`
- `services/engine/src/services/glass_box.py`
- `services/engine/requirements.txt`

### `config.py`

Added `neon_database_url: str = ""` field. When set, the engine queries real user profiles from Neon instead of mock data.

### `users.py`

Replaced the simple synchronous lookup with a two-tier async system:

```python
async def get_user_async(user_id: str) -> Optional[UserProfile]:
    # 1. Try Neon via asyncpg if NEON_DATABASE_URL is set
    profile = await _fetch_profile_from_neon(user_id)
    if profile is not None:
        return profile
    # 2. Fall back to MOCK_USERS for local dev
    return MOCK_USERS.get(user_id)
```

`_fetch_profile_from_neon()` opens an asyncpg connection, queries `users JOIN user_profiles`, and maps the row to a `UserProfile`. Logs a warning and returns `None` on any failure.

`get_user()` synchronous shim retained for backward compatibility.

### `split.py`

Changed `get_user(payment.user_id)` → `await get_user_async(payment.user_id)`. The endpoint was already `async`, so no other changes needed.

### `glass_box.py`

Added `from __future__ import annotations` at the top to make `float | None` and `str | None` union type hints compatible with Python 3.9.

### `requirements.txt`

Added `asyncpg==0.30.0`.

---

## 13. Tests

### Frontend — Vitest

**Files added:**
- `apps/web/vitest.config.ts`
- `apps/web/src/lib/__tests__/utils.test.ts`
- `apps/web/src/components/__tests__/StatCard.test.tsx`

**Added to `package.json` scripts:**
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Installed packages (dev):**
```
vitest
@vitejs/plugin-react
@testing-library/react
@testing-library/user-event
jsdom
```

**`utils.test.ts`** — 14 tests covering:
- `formatINR()` with zero, small amounts, large amounts, negative values
- `scoreColor()` boundary values (0, 59, 60, 79, 80, 100)
- `routeDisplay()` for all three route actions and unknown input

**`StatCard.test.tsx`** — 4 tests covering:
- Renders label correctly
- Renders value correctly
- Applies custom `valueClassName`
- Renders without optional className

**Result: 18/18 passing**

---

### Python — pytest

**Files added:**
- `services/engine/tests/test_vetting.py`
- `services/engine/tests/test_glass_box.py`

**`test_vetting.py`** — 6 tests covering:
- `_estimate_market_range()` returns sensible low < high ranges for creator, freelancer, consultant
- Low is always less than high across all user types
- Range scales proportionally with offered amount
- `run_vetting_agent()` fallback path returns score in 0–100

**`test_glass_box.py`** — 9 tests covering:
- `log_event()` creates a persisted DB record
- `log_event()` without amount stores `None`
- Multiple events for same payment_id all stored
- `get_audit_log()` returns results in descending timestamp order
- `get_audit_log()` filters correctly by `user_id`
- `get_audit_log()` respects `limit` parameter
- `get_audit_log()` returns all users when no filter applied
- Timestamp is formatted as `HH:MM:SS` string

All tests use an in-memory SQLite fixture — no external DB required to run.

**Result: 23/23 passing** (8 pre-existing + 15 new)

---

## 14. Root Layout

**File updated:** `apps/web/src/app/layout.tsx`

- Added `"dark"` class to `<html>` tag so shadcn dark mode activates by default
- Wrapped `{children}` in `<SessionProvider>` (NextAuth v5 client provider)
- Added `<Toaster richColors />` from shadcn Sonner for global toast notifications
- Updated body classes to use theme CSS variables (`bg-background text-foreground`) instead of hardcoded Tailwind colours

---

## 15. ENV Files

### `apps/web/.env.example`
```
ENGINE_URL=http://localhost:8000
DATABASE_URL=your_neon_connection_string_here
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### `services/engine/.env.example`
```
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
LLM_PROVIDER=anthropic
DATABASE_URL=sqlite:///./afe.db
NEON_DATABASE_URL=your_neon_connection_string_here
APP_ENV=development
APP_PORT=8000
```

---

## File Tree — New Files Added

```
apps/web/
├── components.json                                    (new)
├── drizzle.config.ts                                  (new)
├── vitest.config.ts                                   (new)
├── src/
│   ├── app/
│   │   ├── layout.tsx                                 (updated)
│   │   ├── page.tsx                                   (replaced redirect)
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                             (new)
│   │   │   ├── login/page.tsx                         (new)
│   │   │   └── signup/page.tsx                        (new)
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts             (new)
│   │   │   │   └── signup/route.ts                    (new)
│   │   │   └── user/theme/route.ts                    (new)
│   │   └── dashboard/
│   │       ├── layout.tsx                             (new)
│   │       ├── page.tsx                               (replaced)
│   │       ├── onboarding/page.tsx                    (new)
│   │       ├── payments/page.tsx                      (new)
│   │       ├── audit/page.tsx                         (new)
│   │       ├── vetting/page.tsx                       (new)
│   │       └── settings/page.tsx                      (new)
│   ├── components/
│   │   ├── ui/                                        (22 shadcn components, new)
│   │   ├── landing/
│   │   │   └── LandingPage.tsx                        (new)
│   │   ├── providers/
│   │   │   ├── SmoothScroll.tsx                       (new)
│   │   │   └── ThemeProvider.tsx                      (new)
│   │   └── dashboard/
│   │       ├── DashboardLayout.tsx                    (new)
│   │       ├── DashboardOverview.tsx                  (new)
│   │       ├── PaymentsTable.tsx                      (new)
│   │       ├── AuditTimeline.tsx                      (new)
│   │       ├── VettingPageClient.tsx                  (new)
│   │       └── SettingsClient.tsx                     (new)
│   ├── lib/
│   │   ├── auth.ts                                    (new)
│   │   ├── theme.ts                                   (new)
│   │   ├── actions.ts                                 (replaced)
│   │   ├── constants.ts                               (updated — emojis → Lucide)
│   │   ├── utils.ts                                   (updated — userEmoji → userIcon)
│   │   └── db/
│   │       ├── schema.ts                              (new)
│   │       └── index.ts                               (new)
│   ├── types/
│   │   └── next-auth.d.ts                             (new)
│   └── middleware.ts                                  (new)

services/engine/
├── requirements.txt                                   (+ asyncpg)
├── .env.example                                       (+ NEON_DATABASE_URL)
├── src/
│   ├── core/config.py                                 (+ neon_database_url field)
│   ├── models/users.py                                (replaced — async Neon lookup)
│   ├── routers/split.py                               (get_user → get_user_async)
│   └── services/glass_box.py                          (+ __future__ annotations)
└── tests/
    ├── test_vetting.py                                (new — 6 tests)
    └── test_glass_box.py                              (new — 9 tests)
```

---

## Breaking Changes

None. All existing mock users (`aarav`, `priya`, `rohan`) still work when `NEON_DATABASE_URL` is not set. The engine falls back to `MOCK_USERS` automatically.

---

## Known Limitations (v1)

- **Password hashing not wired** — the Credentials provider validates against the DB but the signup route does not hash passwords yet. Password auth should be considered insecure until bcrypt is applied in the signup handler.
- **Vetting history is ephemeral** — vetted deals are stored in local React state only and lost on page refresh. DB persistence planned for v2.
- **Change password UI is stubbed** — the Account settings tab shows the form but does not submit.
- **Notifications tab is stubbed** — toggle switches render but have no backend.
- **Drizzle migrations are not generated** — run `pnpm --filter web drizzle-kit generate` and `drizzle-kit push` before first use against a live Neon database.
