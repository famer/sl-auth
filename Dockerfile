# Указываем базовый образ Node.js
FROM node:22-alpine

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY app/package.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы проекта
COPY app .

# Указываем порт, который будет слушать приложение
EXPOSE 3000

# Указываем команду для запуска приложения
CMD ["node", "src/index.js"]