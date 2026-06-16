FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Bundle app source
COPY . .

# Run as non-root for defense-in-depth
RUN addgroup -S titanbot && adduser -S titanbot -G titanbot \
    && chown -R titanbot:titanbot /usr/src/app
USER titanbot

# Expose the health check port from src/app.js
EXPOSE 3000

# Start the bot
CMD [ "npm", "start" ]
