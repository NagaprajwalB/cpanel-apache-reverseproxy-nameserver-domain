# Deploying a Next.js App on a Linux Server

## Step 1: Update the system and install Node.js

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify the installation:

```bash
node -v
npm -v
```

## Step 2: Get your Next.js app onto the server

Choose a location outside `public_html`, since Node apps should not sit in the web-served folder.

```bash
mkdir -p /home/$(whoami)/apps
cd /home/$(whoami)/apps
git clone <your-repo-url> myapp
cd myapp
```

## Step 3: Install dependencies and build

```bash
npm install
npm run build
```

Test the app locally:

```bash
npm start
```

## Step 4: Install PM2

PM2 keeps the app alive and restarts it on crash or reboot.

```bash
sudo npm install -g pm2
pm2 start npm --name "myapp" -- start
pm2 save
pm2 startup
```

The `pm2 startup` command will print a line beginning with `sudo env PATH=...`. Copy and run that exact command to enable auto-start on server reboot.

Check status anytime with:

```bash
pm2 status
pm2 logs myapp
```

## Step 5: Enable Apache proxy modules

```bash
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2
```

## Step 6: Point Apache to your Node app

Configure Apache to proxy requests to your Next.js app. Use the appropriate `ProxyPass` and `ProxyPassReverse` settings in your Apache site configuration.

