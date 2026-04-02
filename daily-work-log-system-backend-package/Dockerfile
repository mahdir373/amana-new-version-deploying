FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# ❗ מתקינים הכל כדי למנוע קריסות
RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]