FROM node:23-bullseye
WORKDIR /app
RUN apt-get update && apt-get install -y python3 build-essential
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]

# ENV NODE_ENV=production
# ENV DATABASE_URL="postgresql://postgres:123@localhost:5432/course"
# ENV JWT_SECRET_KEY='secretpass'
# ENV HASH_SECRET_KEY=10
# WORKDIR /usr/src/app
# COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# RUN npm install --production --silent && mv node_modules ../
# COPY . .
# EXPOSE 3000
# RUN chown -R node /usr/src/app
# USER node
# CMD ["node", "index.js"]
