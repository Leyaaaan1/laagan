# RidersHub — Deploy to Render (Free, No Credit Card)

> Spring Boot 3.3 · Java 17 · Supabase · Redis Cloud · No card required

---

## What Is Render?

Render is a cloud platform that runs Docker containers for you. Unlike a raw VPS (Oracle Cloud), Render manages the server — you give it a Dockerfile, set your environment variables, and it handles the rest.

| Feature | Render Free Tier |
|---|---|
| Cost | $0 — no credit card |
| RAM | 512 MB |
| Sleep after inactivity | Yes — after 15 min of no requests |
| Cold start on wake | ~50 seconds |
| Auto-deploy | Yes — on every Git push |
| HTTPS / SSL | Free, automatic |
| Custom domain | Free (bring your own) |

> ⚠️ **The 15-minute sleep is the only real downside.** For a portfolio app this is fine. Chapter 5 fixes it for free with an uptime monitor.

---

## Chapter 1 — Prepare Your Project

### 1.1 What Render Needs

These files must be committed to your GitHub repo:

| File | Required? |
|---|---|
| `Dockerfile` | ✅ Yes |
| `.mvn/` | ✅ Yes |
| `mvnw` | ✅ Yes (must be executable) |
| `pom.xml` | ✅ Yes |
| `src/` | ✅ Yes |
| `.env` | ❌ Never — contains secrets |

### 1.2 Verify Your .gitignore

Make sure these lines exist so secrets never end up on GitHub:

```gitignore
.env
*.env
.env.*
!.env.example

target/
*.jar

logs/
*.log
```

### 1.3 Create the Dockerfile

Create this at your project root (same folder as `pom.xml`):

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper first — dependency download layer is cached
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Build the JAR
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN mkdir -p logs
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# -Xms128m  start small — Render free tier has only 512 MB total
# -Xmx400m  cap heap at 400 MB, leaving ~100 MB for OS + JVM overhead
ENTRYPOINT ["java", "-Xms128m", "-Xmx400m", "-jar", "app.jar"]
```

> ⚠️ **`-Xmx400m` is non-negotiable.** If you set it higher, the JVM exceeds Render's 512 MB limit and your container gets killed silently with exit code 137.

### 1.4 Fix mvnw Executable Permission

Render runs on Linux. The `mvnw` file must be executable or the build fails with "Permission denied":

```bash
# Run this in your project root on your local machine
chmod +x mvnw

# Commit the permission change
git add mvnw
git commit -m "Make mvnw executable for Linux builds"
git push
```

### 1.5 Enable PostGIS on Supabase

Do this **before** first deploy or Flyway will fail on startup.

1. Supabase → your project → **Database → Extensions**
2. Search `postgis` → **Enable**
3. Also enable `postgis_topology` if it appears

---

## Chapter 2 — Create Your Render Account

1. Go to [render.com](https://render.com) → **Get Started for Free**
2. Sign up with **GitHub** — easiest since Render needs repo access anyway
3. Authorize Render to access your GitHub account
4. You are now in the Render dashboard — **no credit card was asked**

---

## Chapter 3 — Create a Web Service

### 3.1 New Web Service

1. Render dashboard → **New + → Web Service**
2. **Connect a repository** → select your RidersHub backend repo
3. If your repo is not listed → click **Configure account** and grant access

### 3.2 Configure the Service

| Setting | Value | Why |
|---|---|---|
| Name | `ridershub-backend` | Display name in dashboard |
| Region | Singapore (Southeast Asia) | Closest to Philippines |
| Branch | `main` | Deploy from main |
| Runtime | Docker | Render auto-detects your Dockerfile |
| Instance Type | **Free** | $0, no card |

> 📝 Render auto-detects your Dockerfile. You do not need to set a build command or start command.

### 3.3 Add Environment Variables

Scroll down to **Environment Variables** and add each one below.

---

#### Database — Supabase

> ⚠️ Use the **direct connection string (port 5432)**, NOT the pooler (port 6543). Flyway breaks on the pooler.
> Find it in: Supabase → Project Settings → Database → Connection string → URI mode.

```env
POSTGRES_DB_URL      = jdbc:postgresql://db.xxxxxxxxxxxx.supabase.co:5432/postgres
POSTGRES_DB_USERNAME = postgres
POSTGRES_DB_PASSWORD = your_supabase_db_password
```

#### JWT

> 💡 Generate a strong secret: `openssl rand -base64 64`

```env
JWT_SECRET             = your_very_long_random_string_at_least_64_chars
JWT_EXPIRATION         = 3600000
JWT_REFRESH_EXPIRATION = 604800000
```

#### Redis Cloud

> ⚠️ `REDIS_SSL=true` is critical. Your `application.properties` defaults to `false` if this is missing — Redis Cloud enforces TLS so the connection will fail.

```env
REDIS_HOST     = redis-xxxxx.c1.asia-southeast1-1.gce.redns.redis-cloud.com
REDIS_PORT     = 12345
REDIS_PASSWORD = your_redis_cloud_password
REDIS_SSL      = true
```

#### Cloudinary

> 📝 Your `.env.example` uses `cloudinary_cloud_name` (lowercase) but `application.properties` reads `CLOUDINARY_CLOUD_NAME` (uppercase). Use **uppercase** here or Cloudinary won't work.

```env
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY    = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

#### OAuth2

```env
FACEBOOK_CLIENT_ID    = your_facebook_app_id
FACEBOOK_APP_SECRET   = your_facebook_app_secret
FACEBOOK_REDIRECT_URI = https://ridershub-backend.onrender.com/login/oauth2/code/facebook
google_client_id      = your_google_client_id
```

#### Maps & Routing

```env
ORS_TOKEN             = your_openrouteservice_key
GRASS_HOPPER_KEY      = your_graphhopper_key
mb_token              = your_mapbox_token
MAPBOX_STATIC_MAP_URL = https://api.mapbox.com/styles/v1/mapbox/streets-v12/static
NOMINATIM_API_BASE    = https://nominatim.openstreetmap.org
WIKIMEDIA_API_BASE    = https://commons.wikimedia.org/w/api.php
ORS_REFERER           = https://ridershub-backend.onrender.com
AGENT                 = RidersHub/1.0
```

#### Email — Gmail SMTP

> 💡 Use a **Gmail App Password**, not your real password. Google Account → Security → 2-Step Verification → App Passwords → Generate.

```env
MAIL_USERNAME             = your_gmail@gmail.com
MAIL_PASSWORD             = your_16_char_app_password
VERIFICATION_FRONTEND_URL = exp://your-expo-deep-link
```

#### App Base URL

```env
tokenBaseUrl = https://ridershub-backend.onrender.com
```

### 3.4 Create the Service

1. Scroll to the bottom → click **Create Web Service**
2. Render starts building your Docker image — **first build takes 5–10 minutes**
3. Watch the build logs in the **Events** tab
4. Your service URL:

```
https://ridershub-backend.onrender.com
```

---

## Chapter 4 — Verify the Deployment

### 4.1 Watch the Build Logs

Go to your service → latest deploy → logs. Look for:

| Log Line | Meaning |
|---|---|
| `RUN ./mvnw package -DskipTests -q` | Maven building your JAR — normal |
| `Successfully built xxxxxxxxxxxx` | Docker image built |
| `Successfully applied X migrations` | Flyway ran against Supabase |
| `Tomcat started on port(s): 8080` | Spring Boot listening |
| `Started RidersHubApplication in X seconds` | ✅ Deploy succeeded |
| `Application run failed` | ❌ Read the error below it |

### 4.2 Test the Health Endpoint

```bash
curl https://ridershub-backend.onrender.com/actuator/health

# Expected:
# {"status":"UP"}
```

### 4.3 Update OAuth Redirect URIs

Now that you have a live URL, update these in the external services.

**Facebook Developer Console:**
1. developers.facebook.com → your app → Facebook Login → Settings
2. Add to **Valid OAuth Redirect URIs**:
```
https://ridershub-backend.onrender.com/login/oauth2/code/facebook
```

**Google Cloud Console:**
1. console.cloud.google.com → APIs & Services → Credentials → your OAuth client
2. Add to **Authorized redirect URIs**:
```
https://ridershub-backend.onrender.com/login/oauth2/code/google
```

**Update Render env vars:**

Go to Render → your service → **Environment** → update:
```env
FACEBOOK_REDIRECT_URI = https://ridershub-backend.onrender.com/login/oauth2/code/facebook
tokenBaseUrl          = https://ridershub-backend.onrender.com
```

Click **Save Changes** — Render auto-redeploys.

---

## Chapter 5 — Fix the Cold Start (Free)

### 5.1 The Problem

Render's free tier spins down after 15 minutes of no requests. The next request wakes it up — but Spring Boot needs ~50 seconds to start. During that time the user sees a long delay.

### 5.2 Set Up UptimeRobot

UptimeRobot pings your app every 5 minutes, keeping it awake permanently. Free, no card.

1. Go to [uptimerobot.com](https://uptimerobot.com) → create a free account
2. Click **Add New Monitor**

| Setting | Value |
|---|---|
| Monitor Type | HTTP(s) |
| Friendly Name | RidersHub Keep-Alive |
| URL | `https://ridershub-backend.onrender.com/actuator/health` |
| Monitoring Interval | 5 minutes |

3. Click **Create Monitor**

Your app now stays awake. UptimeRobot also emails you if it ever goes down.

> 📝 Your `/actuator/health` endpoint already works correctly — you have `management.health.redis.enabled=false` in `application.properties` which means it won't fail just because of a Redis hiccup.

---

## Chapter 6 — Auto-Deploy (CI/CD)

Render has built-in auto-deploy — **no GitHub Actions needed.**

Every push to `main` triggers a full rebuild and redeploy automatically:

```
You push to main
       ↓
Render detects push via GitHub webhook
       ↓
Render builds your Docker image
       ↓
New container starts, health check passes
       ↓
Old container replaced — zero downtime
```

### Manual Redeploy

If you update an environment variable and need to force a redeploy without pushing code:

Render dashboard → your service → top right → **Manual Deploy → Deploy latest commit**

---

## Chapter 7 — Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Build fails: `Permission denied — mvnw` | `mvnw` not executable in Git | `chmod +x mvnw && git add mvnw && git commit && git push` |
| Build fails: compilation error | Code error or missing dep | Fix locally first: `./mvnw package -DskipTests` |
| App crashes: `DataSource connection failed` | Wrong Supabase URL or pooler port | Use direct URL (port 5432) not pooler (port 6543) |
| App crashes with exit code 137 | Heap too large for 512 MB | Make sure Dockerfile uses `-Xmx400m` |
| Redis SSL error | `REDIS_SSL` not set | Add `REDIS_SSL=true` in Render Environment tab |
| `CLOUDINARY_CLOUD_NAME` not found | Env var name mismatch | Use `CLOUDINARY_CLOUD_NAME` uppercase (not lowercase from `.env.example`) |
| OAuth `redirect_uri_mismatch` | Facebook/Google not updated | Update redirect URIs in both developer consoles |
| First request takes 50+ seconds | Service was asleep | Set up UptimeRobot (Chapter 5) |

---

## Chapter 8 — Connect React Native

Update your API base URL in the React Native app:

```typescript
// Before (local dev)
const API_BASE_URL = 'http://192.168.1.x:8080';

// After (production)
const API_BASE_URL = 'https://ridershub-backend.onrender.com';
```

> 💡 With Expo, use `app.config.js` with `process.env.EXPO_PUBLIC_API_URL` so you can switch between dev and prod without changing code.

Render gives you HTTPS automatically — React Native's Android cleartext traffic policy is not an issue since you're already on `https://`.

---

## Final Checklist

- [ ] PostGIS enabled on Supabase (Database → Extensions)
- [ ] `Dockerfile` created with `-Xmx400m`
- [ ] `mvnw` is executable (`chmod +x mvnw` committed to Git)
- [ ] `.env` is in `.gitignore` — never committed
- [ ] Render account created with GitHub (no card)
- [ ] Web Service created, region = Singapore
- [ ] All environment variables added in Render dashboard
- [ ] `REDIS_SSL=true` is set
- [ ] `POSTGRES_DB_URL` uses direct connection (port 5432)
- [ ] `CLOUDINARY_CLOUD_NAME` is uppercase
- [ ] First deploy succeeded — logs show `Started RidersHubApplication`
- [ ] `curl .../actuator/health` returns `{"status":"UP"}`
- [ ] `FACEBOOK_REDIRECT_URI` updated to Render URL
- [ ] `tokenBaseUrl` updated to Render URL
- [ ] Facebook Developer Console updated with Render redirect URI
- [ ] Google Cloud Console updated with Render redirect URI
- [ ] UptimeRobot monitor created (pings health every 5 min)
- [ ] React Native app updated with new API base URL
- [ ] Pushed a test commit — Render auto-deployed successfully

---

## Your Full Free Stack

| Service | Purpose | Cost |
|---|---|---|
| Render | Spring Boot hosting | $0 |
| Supabase | Postgres + PostGIS + Flyway | $0 |
| Redis Cloud | Cache + JWT blacklist | $0 |
| Cloudinary | Image storage | $0 |
| Mapbox / GraphHopper / Nominatim | Maps & routing | $0 |
| UptimeRobot | Keep-alive monitor | $0 |
| **Total** | | **$0/month, no card ever** |
