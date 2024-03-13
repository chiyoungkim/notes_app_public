source /home/ec2-user/.bash_profile

# Install Node.js
sudo yum install -y nodejs

# Create the deployment directory if it doesn't exist
sudo mkdir -p /var/www/html/

# Install project dependencies
cd /var/www/html/
npm install