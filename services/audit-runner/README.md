# Recover audit runner

Deploy this isolated Node service with Chrome (Railway/Nixpacks or the supplied Dockerfile). It claims queued jobs from the main API, runs real Lighthouse categories, and sends evidence back over a shared-secret internal route. It never accepts an arbitrary target directly from the public internet.

Required environment: `RECOVER_API_URL`, `AUDIT_RUNNER_SECRET`. Trigger `POST /run` on a schedule or from the queue.
