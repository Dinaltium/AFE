# Deploy `services/engine` to Hugging Face (Docker Space)

This guide deploys the **AFE Engine** (FastAPI) as a **Hugging Face Space** using Docker.

## 1) Create the Space

- In Hugging Face, create a new **Space**
- **Space SDK**: `Docker`
- **Visibility**: public or private (your choice)
- **Repository content**: push this folder (`services/engine/`) to the Space repo

Your Space will be reachable at:

- `https://<your-space>.hf.space`

## 2) Required environment variables (HF “Secrets”)

In the Space settings, add these as **Secrets** (recommended) or Variables:

- **`LLM_PROVIDER`**: `groq` | `nvidia` | `together`
- **`GROQ_API_KEY`**: if using Groq
- **`NVIDIA_API_KEY`**: if using NVIDIA NIM
- **`TOGETHER_API_KEY`**: if using Together
- **`DATABASE_URL`**: recommended for production (Postgres). Example: Neon connection string

Optional:

- **`APP_ENV`**: `production`

Notes:

- The app reads env vars from the process environment in Spaces; local `.env` is only for local dev.
- If you don’t set any provider API key(s), `/vet/` and any LLM-backed routes will likely error.

## 3) Dockerfile behavior

This repo includes `services/engine/Dockerfile` which:

- installs `requirements.txt`
- runs:
  - `uvicorn src.main:app --host 0.0.0.0 --port $PORT`

Hugging Face sets `PORT` automatically.

## 4) Verify after deploy

- **Health**: `GET /health`
  - `https://<your-space>.hf.space/health`
- **Docs**: `GET /docs`
  - `https://<your-space>.hf.space/docs`
- **Split**: `POST /split/`
- **Vetting**: `POST /vet/`

If `/vet/` returns 500:

- Check Space logs for missing provider keys or provider outages.
- Verify `LLM_PROVIDER` matches the key you provided.

## 5) Connect the Vercel frontend

In Vercel (for `apps/web`), set:

- **`ENGINE_URL`** = `https://<your-space>.hf.space`

The web app calls the engine via `ENGINE_URL` (server actions).

## Local run (same code)

```bash
cd services/engine
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload --port 8000
```

