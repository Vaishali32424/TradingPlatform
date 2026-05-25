# Render — fix “No open ports detected”

Copy these **exact** values into Render → your Web Service → **Settings**:

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `node dist/index.js` |

Do **not** use `npm run dev`.

## Environment variables

| Key | Required |
|-----|----------|
| `MONGODB_URI` | Yes — Atlas connection string |
| `JWT_SECRET` | Yes |
| `CLIENT_URL` | Yes — your Netlify URL |

## After saving

1. **Manual Deploy** → Deploy latest commit  
2. Logs must show: `API listening on 0.0.0.0:XXXX`  
3. Open `https://YOUR-SERVICE.onrender.com/api/health`

## Still failing?

- **Root Directory empty?** Render runs from repo root → `npm start` does nothing → no port. Set `backend`.
- **Build failed?** Check build logs for `tsc: not found` → use build command with `--include=dev`.
- **Wrong branch?** Deploy `main` from GitHub `Vaishali32424/TradingPlatform`.
