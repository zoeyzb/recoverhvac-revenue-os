FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir .
COPY recover_voice ./recover_voice
RUN useradd --create-home --uid 10001 appuser
USER appuser
CMD ["python", "-m", "recover_voice.agent", "start"]
