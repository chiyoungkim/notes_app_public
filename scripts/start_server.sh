source /home/ec2-user/.bash_profile

# Start the Node.js server
cd /var/www/html/

pm2 start --name 'notes-app' server.js