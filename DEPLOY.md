# Deployment & CI/CD

This guide deploys **TradeVault** (React frontend + Node API + MongoDB) with Docker and automates future releases via GitHub Actions.

## What gets deployed

| Service | Role |
|---------|------|
| **web** | Nginx serves the React app and proxies `/api` to the API |
| **api** | Express API; seeds super admin on first start |
| **mongodb** | MongoDB 7 with persistent volume (local stack only) |

Two compose files:

- `docker-compose.yml` — full stack (app + **local MongoDB**)
- `docker-compose.atlas.yml` — app only; uses your **MongoDB Atlas** URI

---

## Option A — Deploy on your PC (Docker Desktop)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. From the project root:

```powershell
copy .env.example .env
# Edit .env: set JWT_SECRET, MONGO_ROOT_PASSWORD, SUPERADMIN_PASSWORD

.\scripts\deploy.ps1
```

Open **http://localhost** (port 80).

**Using MongoDB Atlas instead of local DB:**

```powershell
# In .env set MONGODB_URI=your-atlas-connection-string
.\scripts\deploy.ps1 -Atlas
```

---

## Option B — Deploy on a VPS (Ubuntu)

### 1. Server setup

```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Log out and back in
```

### 2. Clone and configure

```bash
sudo mkdir -p /opt/trading && sudo chown $USER:$USER /opt/trading
cd /opt/trading
git clone https://github.com/YOUR_USER/trading.git .
cp .env.example .env
nano .env   # JWT_SECRET, CLIENT_URL=https://your-domain.com, passwords
```

### 3. Start

```bash
# Full stack with local MongoDB
docker compose up -d --build

# OR with Atlas
docker compose -f docker-compose.atlas.yml up -d --build
```

Point your domain to the server IP. Open firewall port 80:

```bash
sudo ufw allow 80
```

---

## CI/CD (GitHub Actions)

### 1. Push code to GitHub

```powershell
cd C:\Users\VaishaliParmar\Desktop\trading
git init
git add .
git commit -m "Add Docker deployment and CI/CD"
git branch -M main
git remote add origin https://github.com/YOUR_USER/trading.git
git push -u origin main
```

### 2. Workflows

| Workflow | When | What it does |
|----------|------|----------------|
| **CI/CD** (`ci-cd.yml`) | Every push/PR to `main` | Builds API + web; on `main`, pushes Docker images to GitHub Container Registry |
| **Deploy** (`deploy.yml`) | Manual (Actions → Deploy → Run workflow) | SSH to your VPS and runs `docker compose up -d --build` |

### 3. GitHub secrets (for auto-deploy to VPS)

In the repo: **Settings → Secrets and variables → Actions**:

| Secret | Example |
|--------|---------|
| `DEPLOY_HOST` | `123.45.67.89` |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_SSH_KEY` | Private key (full PEM) |
| `DEPLOY_PATH` | `/opt/trading` (optional) |
| `DEPLOY_PORT` | `22` (optional) |

Then: **Actions → Deploy → Run workflow**.

### 4. Enable GHCR images (optional)

After the first CI run, images are at:

`ghcr.io/YOUR_USER/trading/api:latest`  
`ghcr.io/YOUR_USER/trading/web:latest`

Make the package **public** under GitHub **Packages** if you pull images on a server without auth.

---

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | Yes | Long random string |
| `CLIENT_URL` | Yes | Public app URL (CORS), e.g. `https://trade.example.com` |
| `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` | Local DB | Used by `docker-compose.yml` |
| `MONGODB_URI` | Atlas / custom | Required for `docker-compose.atlas.yml` |
| `SUPERADMIN_*` | No | Defaults in `.env.example`; seed runs once |
| `APP_PORT` | No | Default `80` |

---

## Useful commands

```bash
docker compose ps
docker compose logs -f api
docker compose down
docker compose down -v   # also removes DB volume (local mongo)
```

---

## Default login after deploy

| Field | Value |
|-------|-------|
| Login ID | `superadmin` |
| Password | Value of `SUPERADMIN_PASSWORD` in `.env` |

Change credentials in `.env` **before** first deploy, or update the user in MongoDB after.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `JWT_SECRET is not set` | Create `.env` from `.env.example` |
| API cannot connect to Mongo | Wait for mongo healthcheck; API retries 30× |
| CORS errors | Set `CLIENT_URL` to your real browser URL |
| Port 80 in use | Set `APP_PORT=8080` in `.env` |
| Docker not found on Windows | Install Docker Desktop and restart |
