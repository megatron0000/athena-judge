# install Node.js and NPM
sudo apt-get update
sudo apt-get install npm -y
sudo npm install -g n
sudo n latest

# install NPM package dependecies
cd backend
npm install
cd ../frontend
npm install
cd ../runner
npm install
cd ..

# install PostgreSQL
sudo apt-get install postgresql postgresql-contrib -y

# create user 'athena' with password 'athena'
sudo -u postgres psql -c "CREATE USER athena WITH PASSWORD 'athena'"

# create database 'athena' with owner 'athena'
sudo -u postgres psql -c "CREATE DATABASE athena WITH OWNER='athena'"

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
