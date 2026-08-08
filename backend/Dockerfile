# استفاده از ایمیج Node.js با Bullseye
FROM node:23-bullseye

# تنظیم پوشه کاری در کانتینر
WORKDIR /app

# نصب پایتون و ابزارهای ساخت
RUN apt-get update && apt-get install -y python3 build-essential

# کپی کردن فایل‌های package و نصب وابستگی‌ها
COPY package*.json ./
RUN npm install

# کپی کردن تمام کدها به کانتینر
COPY . .

# تنظیم متغیر محیطی برای پورت
ENV GATEWAY_PORT=3000

# باز کردن پورت 3000 برای دسترسی
EXPOSE 3000

# اجرای اپلیکیشن
CMD ["npm", "start"]
