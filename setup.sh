# install Node.js and NPM
sudo apt-get install nodejs npm -y

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
curl -fsSL get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# allow docker to run without sudo
sudo usermod -aG docker $USER
newgrp docker

# build docker image
cd runner/docker && npm run build
