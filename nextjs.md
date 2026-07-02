Step 1: Update system & install Node.js

sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

Verify:

node -v
npm -v

Step 2: Get your Next.js app onto the server
Pick a location outside public_html (Node apps shouldn't sit in the web-served folder):

mkdir -p /home/$(whoami)/apps
cd /home/$(whoami)/apps
git clone <your-repo-url> myapp
cd myapp

Step 3: Install dependencies & build

npm install
npm run build

Test it runs:
npm start

Step 4: Install PM2 (keeps app alive, restarts on crash/reboot)

sudo npm install -g pm2
pm2 start npm --name "myapp" -- start
pm2 save
pm2 startup

pm2 startup will print a command starting with sudo env PATH=... — copy and run that exact command it gives you. This makes PM2 auto-start your app on server reboot.

Check status anytime with:
pm2 status
pm2 logs myapp

Step 5: Enable Apache proxy modules

sudo a2enmod proxy proxy_http
sudo systemctl restart apache2

Step 6: Point Apache to your Node app
