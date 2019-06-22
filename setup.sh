# Log every command
set -x

# install Node.js and NPM
sudo apt-get update
sudo apt-get install npm -y
sudo npm install -g n
sudo n 8.11.2

# install 'screen' for running detached commands 
sudo apt-get install screen -y

# install fuser for finding processes listening on ports
sudo apt-get install psmisc -y

# install ts for logging with timestamps
sudo apt-get install moreutils -y

# create /var/athena-judge for permanent information (i.e. log files)
(sudo mkdir -m777 /usr/local/lib/athena-judge || exit 0)

# install NPM package dependecies
cd google-interface/
npm install
cd ../backend
npm install
cd ../frontend
npm install
cd ../runner
npm install
cd ../listener
npm install
cd ../manage
npm install
cd ..

############# PostgreSQL no longer used (since Google deals with all database needs)
# # install PostgreSQL
# sudo apt-get install postgresql postgresql-contrib -y

# # create user 'athena' with password 'athena'
# sudo -u postgres psql -c "CREATE USER athena WITH PASSWORD 'athena'"

# # create database 'athena' with owner 'athena'
# sudo -u postgres psql -c "CREATE DATABASE athena WITH OWNER='athena'"

# install Docker
sudo apt-get install curl -y
curl -fsSL get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# allow docker to run without sudo
sudo usermod -aG docker $USER
newgrp docker <<EONG

# build docker image
cd runner/docker && npm run build
echo "Now you have to log out and log in again before running the application"

EONG
rm get-docker.sh
