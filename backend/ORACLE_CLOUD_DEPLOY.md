# 🏍️ RidersHub — Deploying Spring Boot on Oracle Cloud Free Tier (Forever Free)

> **Goal:** Run your Spring Boot backend on Oracle Cloud's Always Free VM using Docker.
> Database: Supabase ✅ | Cache: Redis Cloud ✅ | Only Spring Boot needs setup here.

---

## 📚 Table of Contents

1. [Understanding Oracle Free Tier](#1-understanding-oracle-free-tier)
2. [What You Actually Get for Free](#2-what-you-actually-get-for-free)
3. [Architecture Overview](#3-architecture-overview)
4. [Phase 1 — Create Your VM Instance](#4-phase-1--create-your-vm-instance)
5. [Phase 2 — Initial Server Setup](#5-phase-2--initial-server-setup)
6. [Phase 3 — Install Docker](#6-phase-3--install-docker)
7. [Phase 4 — Fix Your Dockerfile for Oracle ARM](#7-phase-4--fix-your-dockerfile-for-oracle-arm)
8. [Phase 5 — Environment Variables (The Right Way)](#8-phase-5--environment-variables-the-right-way)
9. [Phase 6 — Build and Run](#9-phase-6--build-and-run)
10. [Phase 7 — Open Firewall Port 8080](#10-phase-7--open-firewall-port-8080)
11. [Phase 8 — Auto-restart on Reboot (systemd)](#11-phase-8--auto-restart-on-reboot-systemd)
12. [Phase 9 — Update / Redeploy Workflow](#12-phase-9--update--redeploy-workflow)
13. [Dos and Don'ts](#13-dos-and-donts)
14. [Troubleshooting](#14-troubleshooting)
15. [Free Tier Survival Tips](#15-free-tier-survival-tips)

---

## 1. Understanding Oracle Free Tier

### What "Always Free" Means

Oracle Cloud has two types of free resources:

| Type | What it means |
|------|--------------|
| **Always Free** | Never expires, never gets charged — even if you do nothing for months |
| **Free Trial (30-day / $300 credit)** | Temporary — resources get **terminated** after the trial ends |

> ⚠️ **Important:** When you first sign up, Oracle gives you $300 in trial credits. Resources you spin up during the trial that are **NOT** "Always Free" eligible will be terminated after the trial ends. You want to only use Always Free shapes.

### How Oracle Protects Your Free Tier

Oracle will **not** silently charge you once the trial ends. You have to manually upgrade to a paid account (called "Pay As You Go"). Even after upgrading, Always Free resources remain free.

The risk is accidentally creating paid resources. We will avoid that.

---

## 2. What You Actually Get for Free

### Compute (VMs)

Oracle gives you **2 choices** under Always Free:

| Option | Shape | CPU | RAM | Best For |
|--------|-------|-----|-----|----------|
| **Option A** ✅ Recommended | `VM.Standard.A1.Flex` (ARM) | Up to **4 OCPU** | Up to **24 GB RAM** | Your Spring Boot app |
| Option B | `VM.Standard.E2.1.Micro` (x86) | 1 OCPU | 1 GB RAM | Very light workloads |

> 🏆 **Always choose Option A (ARM / Ampere A1).** 4 OCPUs and 24 GB RAM for free is extraordinary. This is what we'll use.

### Other Always Free Services (You Won't Need These Now, But Good to Know)

- 2 Block Volumes (200 GB total storage)
- 1 Load Balancer (10 Mbps)
- Outbound data: 10 TB/month
- Object Storage: 20 GB

---

## 3. Architecture Overview

```
Internet
   │
   ▼
Oracle Cloud VM (ARM, Ubuntu 22.04)
   │
   ├── Docker Container: RidersHub Spring Boot :8080
   │       │
   │       ├──► Supabase PostgreSQL (external)
   │       ├──► Redis Cloud (external)
   │       └──► Cloudinary, Mapbox, etc. (external)
   │
   └── systemd service: auto-starts on reboot
```

Your `.env` file lives **only on the server** — never in Git.

---

## 4. Phase 1 — Create Your VM Instance

### Step 1: Log in to Oracle Cloud

Go to [cloud.oracle.com](https://cloud.oracle.com) and sign in.

### Step 2: Navigate to Instances

`Compute` → `Instances` → **Create Instance**

### Step 3: Configure the Instance

Fill in the form carefully:

**Name:** `ridershub-backend` (or whatever you like)

**Image:** Click **Edit** under "Image and shape":
- Image: **Ubuntu 22.04** (Canonical Ubuntu)
- Shape: Click **Change Shape**
  - Shape series: **Ampere** (this is ARM)
  - Shape: `VM.Standard.A1.Flex`
  - OCPU count: **2** (leave 2 spare for the future)
  - Memory: **12 GB** (leave 12 spare)

> 💡 **Why not use all 4 OCPUs/24 GB now?** Oracle's free tier gives you a total pool of 4 OCPU + 24 GB across ALL your A1 instances. If you max out one instance, you can't create another later for experiments. 2 OCPU + 12 GB is plenty for Spring Boot.

**Networking:** Leave defaults (it creates a VCN automatically if you don't have one).

**SSH Keys:**
- Select **Generate a key pair for me**
- Download BOTH files: `ssh-key-XXXX.key` (private) and `ssh-key-XXXX.key.pub` (public)
- **Store the private key safely.** If you lose it, you lose access to your VM forever.

### Step 4: Click "Create"

The VM takes 1-2 minutes to boot. When the status turns green (Running), note the **Public IP address**.

---

## 5. Phase 2 — Initial Server Setup

### Connect via SSH

**On Windows (PowerShell or Git Bash):**

```bash
# Replace with your actual key path and IP
ssh -i "C:\Users\leyan\Downloads\ssh-key-XXXX.key" ubuntu@<YOUR_PUBLIC_IP>
```

If you get a permissions error on Windows:

```powershell
# In PowerShell, fix key permissions
icacls "C:\Users\leyan\Downloads\ssh-key-XXXX.key" /inheritance:r
icacls "C:\Users\leyan\Downloads\ssh-key-XXXX.key" /grant:r "$($env:USERNAME):(R)"
```

### Update the System

Once connected, always update first:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip
```

### Create a Non-Root User for Running Your App

**Why?** Running Docker as root is a security risk. Good practice is to have a dedicated user.

```bash
# Create a user called 'ridershub'
sudo adduser ridershub
# Give it sudo privileges (needed for Docker)
sudo usermod -aG sudo ridershub
# Switch to that user
sudo su - ridershub
```

> 🔐 **Security principle:** The principle of least privilege. Your app shouldn't run as root. If it gets compromised, the attacker has limited access.

---

## 6. Phase 3 — Install Docker

```bash
# Install Docker using the official convenience script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group (so you don't need sudo every time)
sudo usermod -aG docker $USER

# IMPORTANT: Log out and back in for group change to take effect
exit
# SSH back in as ridershub, then verify:
docker --version
```

You should see something like `Docker version 25.x.x`.

---

## 7. Phase 4 — Fix Your Dockerfile for Oracle ARM

Your current Dockerfile targets `eclipse-temurin:17-jdk`. This works, but we need to make sure it works on ARM64 (which Oracle's A1 is).

The good news: `eclipse-temurin` images are **multi-arch** — they automatically pull the ARM64 version when you build on an ARM machine. Your Dockerfile is already good.

However, your current JVM memory settings (`-Xms128m -Xmx400m`) were tuned for Render's 512 MB free tier. **Oracle gives you 12 GB — we can be more generous.**

### Updated Dockerfile (save this as `backend/Dockerfile`)

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper first — dependency download layer is cached
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Build the JAR — skip tests (we trust them locally)
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Runtime ────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN mkdir -p logs
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Oracle A1 with 12 GB RAM — give Spring Boot breathing room
# -Xms256m   = start with 256 MB heap (faster cold start)
# -Xmx1g     = allow up to 1 GB heap (leave plenty for OS + Redis connections)
# -XX:+UseContainerSupport = respect Docker memory limits (already default in JDK 17)
ENTRYPOINT ["java", \
  "-Xms256m", \
  "-Xmx1g", \
  "-XX:+UseContainerSupport", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
```

> 💡 **What is `-Djava.security.egd=file:/dev/./urandom`?**
> Java's `SecureRandom` (used by JWT, SSL) sometimes blocks waiting for entropy from `/dev/random`. On cloud VMs this can cause slow startup. This flag makes it use `/dev/urandom` instead — still secure, but never blocks.

---

## 8. Phase 5 — Environment Variables (The Right Way)

### The Golden Rule

> **Never put secrets in your Docker image or Git repository.**

Your `.env` file at `backend/.env` has all your secrets. Here's how we handle it on the server:

### Create the App Directory on the Server

```bash
mkdir -p ~/ridershub
```

### Copy Your .env to the Server

On **your local machine** (Windows PowerShell or Git Bash):

```bash
scp -i "C:\Users\leyan\Downloads\ssh-key-XXXX.key" \
  "C:\Users\leyan\IdeaProjects\laagan\backend\.env" \
  ridershub@<YOUR_PUBLIC_IP>:~/ridershub/.env
```

### Lock Down the .env File Permissions

Back on the server:

```bash
chmod 600 ~/ridershub/.env
```

> 🔐 `chmod 600` means only the owner can read/write. Nobody else can see it.

### How the .env Gets Into Docker

We'll use `--env-file` when running the container — Docker reads the file and injects each line as an environment variable. Spring Boot then reads them via `${VARIABLE_NAME}` in `application.properties`.

Your `application.properties` already does this correctly (e.g., `${POSTGRES_DB_URL}`).

> ⚠️ **One thing to update in your .env for production:**
> ```bash
> tokenBaseUrl=http://<YOUR_PUBLIC_IP>:8080
> VERIFICATION_FRONTEND_URL=http://<YOUR_FRONTEND_URL>
> ```
> The current value `http://192.168.1.51:8080` is your local IP — it won't work from the internet.

---

## 9. Phase 6 — Build and Run

### Option A: Build on the Server (Simpler, Recommended to Start)

This means you clone your repo on the server and build there.

```bash
cd ~/ridershub

# Clone your repo (only the backend folder if monorepo)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git repo
cd repo/backend

# Build the Docker image
docker build -t ridershub:latest .

# Run the container
docker run -d \
  --name ridershub \
  --restart unless-stopped \
  --env-file ~/ridershub/.env \
  -p 8080:8080 \
  -v ~/ridershub/logs:/app/logs \
  ridershub:latest
```

**Breaking down the `docker run` flags:**

| Flag | What it does |
|------|-------------|
| `-d` | Detached mode — runs in background |
| `--name ridershub` | Gives the container a name so you can reference it |
| `--restart unless-stopped` | Auto-restarts if the container crashes, but not if you manually stop it |
| `--env-file ~/ridershub/.env` | Injects your secrets as environment variables |
| `-p 8080:8080` | Maps port 8080 on the host to port 8080 in the container |
| `-v ~/ridershub/logs:/app/logs` | Mounts a volume so logs persist outside the container |

### Check It's Running

```bash
docker ps
docker logs ridershub --tail 50 -f
```

The `-f` flag follows logs in real time. Press `Ctrl+C` to stop following.

---

## 10. Phase 7 — Open Firewall Port 8080

Oracle Cloud has **two layers** of firewall. You must open both.

### Layer 1: Oracle Cloud Security List (VCN)

1. Go to Oracle Cloud Console
2. `Networking` → `Virtual Cloud Networks` → your VCN → `Security Lists`
3. Click the default security list → **Add Ingress Rules**
4. Fill in:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `8080`
5. Save

### Layer 2: Ubuntu's Built-in Firewall (iptables)

Oracle Ubuntu images block ports at the OS level too. Run:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
sudo netfilter-persistent save
```

If `netfilter-persistent` is not installed:

```bash
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

### Test It

From your local browser or terminal:

```bash
curl http://<YOUR_PUBLIC_IP>:8080/actuator/health
# Or just open http://<YOUR_PUBLIC_IP>:8080 in your browser
```

---

## 11. Phase 8 — Auto-restart on Reboot (systemd)

`--restart unless-stopped` handles container crashes. But what if the **VM itself reboots** (e.g., Oracle does maintenance)? We need Docker to start automatically.

### Enable Docker on Boot

```bash
sudo systemctl enable docker
```

This is usually already done by the Docker installer, but double-check.

### Create a systemd Service (Optional but Recommended)

This gives you clean start/stop/status commands:

```bash
sudo nano /etc/systemd/system/ridershub.service
```

Paste this:

```ini
[Unit]
Description=RidersHub Spring Boot
After=docker.service
Requires=docker.service

[Service]
User=ridershub
Restart=always
RestartSec=10
ExecStart=/usr/bin/docker start -a ridershub
ExecStop=/usr/bin/docker stop ridershub

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ridershub
sudo systemctl start ridershub
sudo systemctl status ridershub
```

---

## 12. Phase 9 — Update / Redeploy Workflow

Every time you push new code and want to redeploy:

```bash
# On the server
cd ~/ridershub/repo/backend

# Pull latest code
git pull origin main

# Rebuild image
docker build -t ridershub:latest .

# Stop and remove the old container
docker stop ridershub
docker rm ridershub

# Start the new container
docker run -d \
  --name ridershub \
  --restart unless-stopped \
  --env-file ~/ridershub/.env \
  -p 8080:8080 \
  -v ~/ridershub/logs:/app/logs \
  ridershub:latest

# Clean up old/dangling images to save disk space
docker image prune -f
```

> 💡 **Tip:** Save this as a shell script `~/ridershub/deploy.sh` so you only run one command.

```bash
# Create the script
cat > ~/ridershub/deploy.sh << 'EOF'
#!/bin/bash
set -e
echo "🚀 Deploying RidersHub..."

cd ~/ridershub/repo/backend
git pull origin main

docker build -t ridershub:latest .

docker stop ridershub || true
docker rm ridershub || true

docker run -d \
  --name ridershub \
  --restart unless-stopped \
  --env-file ~/ridershub/.env \
  -p 8080:8080 \
  -v ~/ridershub/logs:/app/logs \
  ridershub:latest

docker image prune -f
echo "✅ Deployed! Logs: docker logs ridershub -f"
EOF

chmod +x ~/ridershub/deploy.sh
```

Now deploy with just: `~/ridershub/deploy.sh`

---

## 13. Dos and Don'ts

### ✅ DO

- **Do** keep your `.env` file only on the server, never in Git
- **Do** use `chmod 600` on your `.env` — even on the server
- **Do** regularly run `docker image prune -f` to free disk space
- **Do** check `docker stats` occasionally to watch memory/CPU usage
- **Do** keep your VM updated: `sudo apt update && sudo apt upgrade -y` monthly
- **Do** use `--restart unless-stopped` so the container survives crashes
- **Do** mount a log volume (`-v ~/ridershub/logs:/app/logs`) so logs outlive container restarts
- **Do** set `spring.jpa.hibernate.ddl-auto=validate` in production (you already do ✅) — never `create` or `create-drop` in prod

### ❌ DON'T

- **Don't** put your `.env` in Git — ever. Double-check your `.gitignore` has `.env`
- **Don't** use `--restart always` — use `unless-stopped`. "Always" restarts even when you manually stop it for maintenance
- **Don't** create more than 4 total OCPU worth of A1 instances — you'll exceed the free tier pool
- **Don't** leave `spring.jpa.show-sql=true` in production — it floods logs
- **Don't** run builds on the VM repeatedly without cleaning images — disk fills up fast
- **Don't** expose your SSH private key — if you suspect it's compromised, rotate it immediately in Oracle Console
- **Don't** open all ports (`0.0.0.0/0` for all traffic) — only open what you need (8080 for now)
- **Don't** rely on the VM's public IP if you plan to share the app — IPs can change. Use a domain name pointing to it instead
- **Don't** leave `server.error.include-stacktrace=never` changed — you already have it correct ✅

---

## 14. Troubleshooting

### Container Won't Start

```bash
docker logs ridershub
```

Common causes:
- **Missing env variable:** Spring Boot will throw `Could not resolve placeholder '${SOME_VAR}'`. Check your `.env` has all keys from `.env.example`.
- **Flyway migration failed:** Check logs for `FlywayException`. Usually means the DB schema changed without a migration file.
- **Port already in use:** Run `sudo lsof -i :8080` to see what's using it.

### Can't Connect from the Internet

Check in order:
1. Is the container running? `docker ps`
2. Is it listening? `curl localhost:8080` (from inside the VM)
3. Oracle Security List — did you add port 8080?
4. Ubuntu firewall — did you run the `iptables` command?

### High Memory Usage

```bash
docker stats ridershub
```

If heap is near `-Xmx1g`, consider whether your Hikari pool is too large. Your current `maximum-pool-size=10` is fine for free tier. Don't increase it.

### Logs Are Too Big

Your log config writes to `./logs/app.log`. Add log rotation in `application.properties`:

```properties
logging.logback.rollingpolicy.max-file-size=10MB
logging.logback.rollingpolicy.max-history=7
logging.logback.rollingpolicy.total-size-cap=50MB
```

---

## 15. Free Tier Survival Tips

### The #1 Rule: Don't Let Oracle Reclaim Your VM

Oracle has been known to reclaim idle Always Free instances if they detect "no activity." This is controversial but it has happened. To prevent it:

- Make sure your app is actually running and receiving some traffic
- Alternatively, set up a simple cron health-check ping:

```bash
# Edit cron jobs
crontab -e

# Add this line — pings your own app every 20 minutes
*/20 * * * * curl -s http://localhost:8080/actuator/health > /dev/null
```

### Watch Your Disk

Oracle free tier gives you 50 GB boot volume. Docker images are big. Check periodically:

```bash
df -h              # overall disk usage
docker system df   # docker-specific usage
docker image prune -f   # clean dangling images
```

### Your Current Config is Well-Tuned for Free Tier ✅

Looking at your `application.properties`, you already have good practices:
- `maximum-pool-size=10` — not excessive
- `spring.jpa.show-sql=false` — won't flood logs
- `server.error.include-stacktrace=never` — secure
- `app.registration.max-users=50` — smart rate limiting for early stage
- Redis with SSL and connection pool — proper cloud Redis usage

### One Thing to Add for Production

Your `tokenBaseUrl` and `VERIFICATION_FRONTEND_URL` in `.env.example` still point to `http://192.168.1.51:8080`. Update your server's `.env`:

```bash
nano ~/ridershub/.env
# Change:
# tokenBaseUrl=http://<YOUR_ORACLE_PUBLIC_IP>:8080
# VERIFICATION_FRONTEND_URL=http://<YOUR_FRONTEND_URL>
```

---

## Quick Reference: Essential Commands

```bash
# View running containers
docker ps

# Watch live logs
docker logs ridershub -f

# Restart the container
docker restart ridershub

# Stop the container
docker stop ridershub

# Check memory/CPU
docker stats ridershub

# SSH to the server
ssh -i ~/path/to/key.pem ubuntu@<YOUR_IP>

# Full redeploy
~/ridershub/deploy.sh

# Check disk
df -h && docker system df
```

---

*Generated for RidersHub monorepo — Spring Boot 3.3.2 / Java 17 / Oracle Cloud Always Free A1 ARM*
