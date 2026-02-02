# בסיס: Node.js קליל
FROM node:18-alpine

# תקיית העבודה בתוך הקונטיינר
WORKDIR /app

# מעתיקים קודם רק את ה-package*.json בשביל cache טוב יותר
COPY package*.json ./

# התקנת חבילות לפרודקשן
RUN npm install --production

# עכשיו מעתיקים את שאר קבצי הפרויקט
COPY . .

# משתני סביבה בסיסיים
ENV NODE_ENV=production

# הפורט שבו השרת מקשיב בתוך הקונטיינר
# אם ב-code שלך אתה משתמש ב-PORT אחר – לשנות כאן
EXPOSE 5000

# איך מריצים את השרת
# אם ב-package.json הסקריפט שלך הוא "start": "node server.js"
# זה יעבוד. אם יש "dev" עם nodemon – זה לפרודקשן לא.
CMD ["npm", "start"]
