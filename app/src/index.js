// app.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const userRoutes = require('./routes/authRoutes'); // Импортируйте маршрутизатор

// Настройка middleware
app.use(bodyParser.json()); // Для обработки JSON-запросов

// Использование маршрутизатора
app.use('/api', userRoutes); // Все маршруты из userRoutes будут начинаться с /api

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Запуск сервера
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
