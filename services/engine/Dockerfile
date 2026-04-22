FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (kept minimal; psycopg2-binary ships wheels)
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY src /app/src

# Hugging Face Spaces sets PORT; default to 7860 there.
ENV PORT=7860
EXPOSE 7860

CMD ["bash", "-lc", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT}"]
