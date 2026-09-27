# Scalbl Campaign Launcher

**Scalbl Launch Runner** is a single-page app that walks you through a full Meta campaign build for a client, from onboarding to launch.

## Run it

Open `index.html` in a browser. There's no build step and nothing to install.

To host it, import this repo into Vercel (or turn on GitHub Pages). It deploys as a static site with `index.html` at the root.

## Storage

Runs are saved to the Neon Postgres database (`neon-carmine-envelope`) connected to the Vercel project. The data goes through the serverless function at `api/runs.js`, which creates the `launch_runs` table the first time it runs.

- The function reads the connection string from `DATABASE_URL` (or `POSTGRES_URL`). The Vercel Neon integration sets this for you.
- The browser also keeps a copy in `localStorage`, so the app still works offline or when you open `index.html` directly. The status in the header shows whether runs are saving to the cloud or only on this device.
- Optional: set an `APP_KEY` environment variable in Vercel to require a shared team password. The app asks for it once and remembers it in that browser.
- If two people edit the same run at the same time, the last save wins.

## Notes

- Image previews are stored only for images under about 350 KB. For larger files, only the file name is kept.
- Use **Copy as text** on the summary screen to export a finished launch document.
