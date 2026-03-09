# استخدام Node.js 18 كصورة أساسية
FROM node:18-alpine as build

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت المتطلبات
RUN npm ci --only=production

# نسخ باقي الملفات
COPY . .

# بناء المشروع
RUN npm run build

# المرحلة الثانية: خادم Nginx خفيف لتقديم الملفات
FROM nginx:alpine

# نسخ ملفات البناء من المرحلة الأولى
COPY --from=build /app/dist /usr/share/nginx/html

# نسخ إعدادات Nginx المخصصة
COPY nginx.conf /etc/nginx/conf.d/default.conf

# فتح البورت 80
EXPOSE 80

# تشغيل Nginx
CMD ["nginx", "-g", "daemon off;"]
