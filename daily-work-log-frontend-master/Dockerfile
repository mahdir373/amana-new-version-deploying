# שלב 1: Build – נבנה את האפליקציה
FROM node:18-alpine AS build

# תקיית העבודה בתוך הקונטיינר
WORKDIR /app

# רק קבצי ה- package כדי לנצל cache
COPY package*.json ./

# התקנת חבילות
RUN npm install

# העתקת שאר קבצי הפרויקט
COPY . .

# בניית גרסה ל-production
RUN npm run build

# שלב 2: Serve – נגיש את הקבצים דרך NGINX
FROM nginx:alpine

# מחיקת קובץ ברירת המחדל של nginx
RUN rm -rf /usr/share/nginx/html/*

# העתקת ה-build ל-nginx
COPY --from=build /app/build /usr/share/nginx/html

# 🔹 לגרום ל-Nginx להקשיב על פורט 8080 (מה ש-Cloud Run מצפה לו)
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

# פתיחת פורט 8080 (Cloud Run משתמש ב-PORT=8080)
EXPOSE 8080

# הרצת nginx
CMD ["nginx", "-g", "daemon off;"]
