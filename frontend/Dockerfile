FROM node:14.15.4

# Create app directory
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .