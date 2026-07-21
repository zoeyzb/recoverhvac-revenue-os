# Run RecoverHVAC Revenue OS on macOS

## Prerequisites

- Git
- Node.js 20 or newer
- Python 3.12 or newer
- Docker Desktop (recommended for the supporting services)

## Web application and backend worker

```bash
git clone https://github.com/zoeyzb/recoverhvac-revenue-os.git
cd recoverhvac-revenue-os
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

The Next.js application contains the operator website and API routes. The `worker/` directory contains the durable automation and provider-event backend. Configure the values documented in `.env.example` before enabling live actions.

## Lighthouse audit runner

In a second Terminal window:

```bash
cd recoverhvac-revenue-os/services/audit-runner
npm install
npm start
```

## LiveKit voice agent

In a third Terminal window:

```bash
cd recoverhvac-revenue-os/services/voice-agent
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python -m recover_voice.agent dev
```

## Database

Create a Supabase project and apply the SQL files in `supabase/migrations/` in numeric order. Then add the Supabase URL and keys to `.env.local`. Never commit `.env.local` or provider credentials.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Run the voice tests from `services/voice-agent`:

```bash
python -m unittest discover -s tests
```
