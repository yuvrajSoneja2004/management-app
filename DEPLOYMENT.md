# Deployment Guide - Azure Ubuntu VM

This guide provides step-by-step instructions for deploying the Jello backend to an Azure Ubuntu VM using Docker.

## Prerequisites

- Azure Ubuntu VM with SSH access
- Docker and Docker Compose installed
- Domain configured (apiJello.yuvrajsoneja.in)
- Git installed

## Step 1: Install Docker on Azure VM

SSH into your VM and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in
exit
```

## Step 2: Clone Repository

```bash
git clone https://github.com/yuvrajSoneja2004/management-app.git
cd management-app
```

## Step 3: Create Environment File

Create `.env` file with your production values:

```bash
nano .env
```

Paste your production environment variables (use `.env.production.example` as template).

## Step 4: Build and Run

```bash
# Build and start containers
docker-compose up -d --build

# Check status
docker ps

# View logs
docker logs jello-backend
docker logs jello-email-worker
```

## Step 5: Set Up Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/jello
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name apiJello.yuvrajsoneja.in;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and start:

```bash
sudo ln -s /etc/nginx/sites-available/jello /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: Set Up SSL

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d apiJello.yuvrajsoneja.in
```

## Management Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update deployment
git pull
docker-compose up -d --build
```

## Troubleshooting

### Check container status
```bash
docker ps
docker stats
```

### View logs
```bash
docker logs jello-backend --tail 100
```

### Test Redis connection
```bash
docker exec -it jello-backend node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.ping().then(console.log)"
```

### Restart specific service
```bash
docker-compose restart backend
```
