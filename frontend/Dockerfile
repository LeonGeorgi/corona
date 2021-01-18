FROM node:14.15.4

# Create app directory
WORKDIR /app/frontend
COPY package*.json ./
RUN npm install --production
RUN npm install -g serve
COPY . .
RUN npm run build
CMD serve -s build -l 3000