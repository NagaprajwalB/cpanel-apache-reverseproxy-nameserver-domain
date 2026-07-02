```
Given a full stack website [ frontend and backend ] where frontend is in Nextjs and Backend is in Java, What we have to do is we have to host the backend in Amazon EC2 and frontend cpanel and the ec2 public ip should be reverseproxy should be done and domain name shoud be given, later that domain name and the subdomain name of the frontend should be added as a record in the zone edditor and that cpanel nameserver should redirect to the our personal domain
```

# Deployment Guide: Next.js Frontend (cPanel) + Java Backend (AWS EC2)

This guide documents how to deploy a full-stack application where:

- **Backend** (Java) runs on an **AWS EC2** instance, exposed via an **Nginx reverse proxy** on a domain/subdomain (e.g. `api.yourdomain.com`).
- **Frontend** (Next.js) is hosted on **cPanel** (e.g. `www.yourdomain.com` or `app.yourdomain.com`).
- The **domain's nameservers** point to cPanel, and DNS records for the API subdomain are added via cPanel's **Zone Editor**, pointing to the EC2 public IP.

---

## Architecture Overview

```
User Browser
     │
     ├──> www.yourdomain.com  (cPanel - Next.js frontend)
     │
     └──> api.yourdomain.com  (DNS A record -> EC2 Public IP)
                                        │
                                Nginx (reverse proxy, port 80/443)
                                        │
                                Java backend app (e.g. port 8080)
```

---

## Part 1 — Deploy the Java Backend on EC2

### 1.1 Launch the EC2 instance
1. Launch an EC2 instance (Amazon Linux 2023 / Ubuntu 22.04 recommended).
2. Attach a **Security Group** allowing inbound:
   - `22` (SSH) – restricted to your IP
   - `80` (HTTP)
   - `443` (HTTPS)
   - `8080` (only temporarily, for testing the raw backend — remove/restrict once Nginx is set up)
3. Allocate and associate an **Elastic IP** so the public IP doesn't change on reboot.

### 1.2 Install Java and dependencies
```bash
# Ubuntu example
sudo apt update
sudo apt install -y openjdk-17-jdk
java -version
```

### 1.3 Deploy the backend jar/war
```bash
# Copy your build artifact to the server
scp -i your-key.pem target/backend-app.jar ubuntu@<EC2_PUBLIC_IP>:/home/ubuntu/app/

# SSH in
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Run it as a background service so it survives reboots/logouts. Example using `systemd`:

```ini
# /etc/systemd/system/backend.service
[Unit]
Description=Java Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/app
ExecStart=/usr/bin/java -jar /home/ubuntu/app/backend-app.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable backend
sudo systemctl start backend
sudo systemctl status backend
```

Confirm the app is running locally:
```bash
curl http://localhost:8080/actuator/health   # or whatever your health endpoint is
```

---

## Part 2 — Set Up Nginx as a Reverse Proxy on EC2

### 2.1 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2.2 Configure reverse proxy for the API subdomain
Create a server block:

```nginx
# /etc/nginx/sites-available/api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2.3 Secure it with HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```
Certbot will auto-configure SSL and redirect HTTP → HTTPS. Auto-renewal is set up by default; verify with:
```bash
sudo certbot renew --dry-run
```

> ⚠️ Note: `api.yourdomain.com` must already be resolving to the EC2 IP (see Part 4) **before** running certbot, or domain validation will fail.

---

## Part 3 — Deploy the Next.js Frontend on cPanel

cPanel (shared hosting) does not run Node.js the way EC2 does, but most modern cPanel installs include **"Setup Node.js App"** (via Passenger). Two options:

### Option A — Node.js App on cPanel (SSR / API routes supported)
1. In cPanel → **Setup Node.js App** → create an application.
   - Node version: match your project (e.g. 18.x/20.x)
   - Application root: e.g. `nodeapp/frontend`
   - Application URL: `www.yourdomain.com` (or `app.yourdomain.com`)
   - Startup file: `server.js` (if using a custom server) or use `npm start` after build.
2. Upload your Next.js project files (via File Manager or Git) into the application root.
3. Enter the cPanel Node app's shell (or use the "Run NPM Install" button), then:
   ```bash
   npm install
   npm run build
   ```
4. Set the **Application Startup File** to run `next start` (you may need a small `server.js` wrapper, since Passenger expects an entry file).
5. Set environment variables in the Node.js app UI (e.g. `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`).
6. Restart the application from the cPanel Node.js App interface.

### Option B — Static Export (simplest, if no SSR/API routes needed)
1. In `next.config.js`, set:
   ```js
   module.exports = { output: 'export' };
   ```
2. Build and export:
   ```bash
   npm run build
   ```
   This generates a static `out/` folder.
3. Upload the contents of `out/` to `public_html` (or a subdomain's document root) via cPanel File Manager or FTP.

> Use Option A if your app relies on SSR, middleware, or API routes. Use Option B if it's fully static/client-rendered.

### 3.1 Point the frontend's API calls to the backend
Make sure all frontend API calls use the backend subdomain:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## Part 4 — DNS Configuration

This assumes you want your **domain registrar/nameservers pointed at cPanel**, and you'll manage all DNS (including the EC2 subdomain) from **cPanel's Zone Editor**.

### 4.1 Point domain's nameservers to cPanel
At your domain registrar (e.g. GoDaddy, Namecheap, etc.):
1. Go to the domain's **Nameserver / DNS settings**.
2. Replace the default nameservers with your **cPanel/hosting provider's nameservers**, e.g.:
   ```
   ns1.yourhostingprovider.com
   ns2.yourhostingprovider.com
   ```
   (Get the exact values from your hosting provider — usually shown in cPanel's "General Information" widget.)
3. Save. Nameserver propagation can take a few hours up to 24–48 hours.

### 4.2 Add DNS records in cPanel Zone Editor
Once the domain is active under cPanel, go to **cPanel → Domains → Zone Editor** (or **Advanced Zone Editor**) for `yourdomain.com`:

| Type | Name/Host          | Value/Points to     | TTL  |
|------|---------------------|----------------------|------|
| A    | `api`               | `<EC2_PUBLIC_IP>`    | 3600 |
| A/CNAME | `www` or `app`  | (auto, if hosted on cPanel) | 3600 |

- **`api.yourdomain.com`** → **A record** → EC2 Elastic IP (this is what the reverse proxy listens on).
- **`www.yourdomain.com`** (or your chosen frontend subdomain) → typically already resolves to the cPanel server automatically, or add it as a subdomain in **cPanel → Domains → Subdomains**, pointing to the document root where the Next.js app / static export lives.

### 4.3 Verify DNS propagation
```bash
dig api.yourdomain.com +short
dig www.yourdomain.com +short
```
Or use https://dnschecker.org to confirm global propagation before issuing SSL certificates.

---

## Part 5 — Final Checks

1. **Backend reachable via domain:**
   ```bash
   curl https://api.yourdomain.com/actuator/health
   ```
2. **Frontend reachable via domain:**
   Visit `https://www.yourdomain.com` in the browser.
3. **CORS:** Ensure the Java backend allows requests from the frontend origin (`https://www.yourdomain.com`).
4. **HTTPS everywhere:** Both frontend (cPanel — usually via AutoSSL) and backend (via Certbot on EC2) should be served over HTTPS to avoid mixed-content errors.
5. **Firewall/Security Group:** Once HTTPS/Nginx is confirmed working, restrict EC2 security group to only allow `80`, `443`, and `22` (remove direct `8080` exposure).

---

## Quick Reference

| Component        | Hosted On | Domain                    |
|-------------------|-----------|----------------------------|
| Next.js Frontend  | cPanel    | `www.yourdomain.com`       |
| Java Backend      | AWS EC2   | `api.yourdomain.com`       |
| Nameservers       | cPanel host's NS | set at domain registrar |
| DNS records       | cPanel Zone Editor | `A` record for `api` → EC2 IP |

---

## Troubleshooting

- **SSL cert fails on EC2 (Certbot):** DNS for `api.yourdomain.com` hasn't propagated yet — wait and re-run `certbot --nginx -d api.yourdomain.com`.
- **502 Bad Gateway from Nginx:** Java backend isn't running on the expected port — check `sudo systemctl status backend` and `sudo journalctl -u backend -f`.
- **CORS errors in browser console:** Add the frontend's exact origin to the backend's allowed CORS origins list.
- **Next.js app not starting on cPanel:** Confirm the Node.js version selected in "Setup Node.js App" matches your `package.json` engine requirements, and that `npm run build` completed without errors.