# XLICON — Frontend

This folder contains the pairing UI (`pair.html`).

## How it works

The backend (`index.js`) serves this file at `/` and `/pair.html`.
All API calls (`/api/status`, `/pair`) are relative by default, so they
hit the same server with zero configuration.

## Deploying frontend separately (optional)

If you want to host the frontend on Netlify, Vercel, GitHub Pages, etc.:

1. Edit `pair.html` and set the `<meta name="api-base">` content to your
   backend URL:
   ```html
   <meta name="api-base" content="https://your-backend.onrender.com">
   ```
2. Deploy this `frontend/` folder to your static host.
3. Make sure your backend has CORS enabled (it already does — `Access-Control-Allow-Origin: *`).

## Same-server deploy (default / recommended)

Just run the backend as normal:
```
node index.js
```
Visit `http://localhost:3000` — the backend serves `frontend/pair.html` automatically.
