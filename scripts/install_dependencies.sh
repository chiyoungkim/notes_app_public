source /home/ec2-user/.bash_profile

# Install Node.js
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install project dependencies
cd /var/www/html/
npm install