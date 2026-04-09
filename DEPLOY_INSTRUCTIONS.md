# HRMS Deployment Guide for YouStable Dedicated Server

## Prerequisites
- Node.js 18+ installed on server
- PM2 installed globally: `npm install -g pm2`
- Nginx installed: `sudo apt install nginx`
- Access to AWS RDS PostgreSQL database

## Step 1: Upload Files
Upload all files from this zip to your server directory:
```
/home/yourusername/hrms/
```

## Step 2: Set Environment Variables
```bash
cp .env.example .env
nano .env
```
Fill in your actual database URL, SMTP credentials, and session secret.

## Step 3: Create Logs Directory
```bash
mkdir -p logs
```

## Step 4: Start with PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Step 5: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/hrms`:
```nginx
server {
    listen 80;
    server_name aai-nextgen.in www.aai-nextgen.in;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d aai-nextgen.in -d www.aai-nextgen.in
```

## PM2 Common Commands
```bash
pm2 status            # Check app status
pm2 logs hrms         # View live logs
pm2 restart hrms      # Restart app
pm2 stop hrms         # Stop app
pm2 monit             # Monitor CPU/Memory
```

## Alternative: Start Without PM2
```bash
bash start.sh
```

## Folder Structure
```
hrms/
├── dist/                  # Production build
│   ├── index.cjs          # Node.js server bundle
│   └── public/            # Frontend (HTML, CSS, JS, images)
├── node_modules/          # Dependencies
├── client/                # Frontend source code
├── server/                # Backend source code
├── shared/                # Shared schemas and types
├── migrations/            # Database migrations
├── ecosystem.config.cjs   # PM2 configuration
├── .env                   # Environment variables
├── start.sh               # Manual startup script
└── package.json           # Project config
```
