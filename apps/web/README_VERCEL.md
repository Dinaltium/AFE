# Deploy `apps/web` to Vercel

This is the **AFE web dashboard** (Next.js App Router) inside a pnpm monorepo.

## 1) Create the Vercel project

- Import the GitHub repo in Vercel
- Set **Root Directory** to `apps/web`
- Framework preset: **Next.js**

Build settings (defaults usually work):

- **Install Command**: `pnpm install`
- **Build Command**: `pnpm build`
- **Output**: default (Next.js)

## 2) Environment variables (Vercel Project → Settings → Environment Variables)

Required:

- **`ENGINE_URL`**: your deployed engine base URL
  - Example (Hugging Face Space): `https://<your-space>.hf.space`
- **`DATABASE_URL`**: Neon Postgres connection string (used by Drizzle / server actions)
- **`AUTH_SECRET`**: NextAuth secret
- **`NEXTAUTH_URL`**: your Vercel production URL
  - Example: `https://<your-vercel-app>.vercel.app`
- **`GOOGLE_CLIENT_ID`**
- **`GOOGLE_CLIENT_SECRET`**

Notes:

- Ensure your Google OAuth app allows the `NEXTAUTH_URL` as an authorized redirect origin.
- The engine has CORS allowing `https://*.vercel.app` already; if you use a custom domain, add it in `services/engine/src/main.py`.

## 3) Verify

- Visit `/login`
- After auth, confirm dashboard pages load:
  - `/dashboard`
  - `/dashboard/vetting` (calls `ENGINE_URL/vet/`)
  - `/dashboard/payments` (calls `ENGINE_URL/split/`)

