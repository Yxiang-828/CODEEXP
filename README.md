# Kampung Kaki — Section 2 (CODEEXP)

A live, role-aware map of Singapore for citizens, responders, and ops.
One map. Three views. Real OneMap basemap. Real NEA data. Shared truth
store so an action by one role appears for the others in the same tick.

## Setup

1. **Install Ollama** — https://ollama.com/download — then sign in once
   (the AI model is a cloud model that runs under your account):

   ```
   ollama signin
   ```

2. **Install Docker Desktop** — https://docker.com/products/docker-desktop — and start it.

3. **Clone and start everything:**

   ```bash
   git clone https://github.com/Yxiang-828/CODEEXP.git
   cd CODEEXP

   ./start.sh      # Mac / Linux
   .\start.ps1     # Windows (PowerShell)
   ```

   First run takes a few minutes (pulls images, builds). After that it's seconds.

4. **(Optional) live weather/PSI/traffic layers** — get free gov-data keys and fill
   `DATAMALL_ACCOUNT_KEY` / `ONEMAP_API_KEY` in `.env.local` (created on first run
   from `.env.example`), then restart. The app runs fine without them.

5. **Open http://localhost:3000**. Stop with `Ctrl-C`, `./start.sh down`,
   or `.\start.ps1 down`.

## Demos

| Demo | URL |
|---|---|
| Quick showcase | http://localhost:3000/?demo=quick&autostart=1 |
| Live demo | http://localhost:3000/?demo=director&autostart=1 |
| Live demo, captions only | http://localhost:3000/?demo=director&autostart=1&silent=1 |

More detail (services, ports, demo voices, re-rendering): see `START-HERE.md`.
Full product blueprint: see `../BLUEPRINT.md`.

## License

Internal R&D. Not for production deployment until partner agreements
land (Section 8). See `../BLUEPRINT.md` § 13 for the non-negotiables.
