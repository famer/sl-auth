// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const redis = require('../redis');

/*
// Аутентификация пользователя
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Поиск пользователя по email
    const user = await db('Users').where({ email }).first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Сравнение пароля с хэшем
    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
*/
const SECRET_KEY = 'your_secret_key'; // Замените на свой секретный ключ
const ACCESS_TOKEN_EXPIRY = '15m'; // Время жизни access token
const REFRESH_TOKEN_EXPIRY = '7d'; // Время жизни refresh token

// Аутентификация пользователя
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const host = process.env.PROFILES_URL || 'http://sl_profiles:3000';
    const url = `${host}/api/users/login`;
    const options = {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    }
    const response = await fetch(url, options);
    console.log(response);
    if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const user = await response.json();
    console.log(user);
    // Создание токенов
    const accessToken = jwt.sign({ user_id: user.user_id }, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ user_id: user.user_id }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });

    // Сохранение токенов в Redis
    await redis.set(`access_token:${accessToken}`, user.user_id, 'EX', 15 * 60); // Access token на 15 минут
    await redis.set(`refresh_token:${refreshToken}`, user.user_id, 'EX', 7 * 24 * 60 * 60); // Refresh token на 7 дней

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновление access token с использованием refresh token
// routes/authRoutes.js
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
  
    try {
      const user_id = await redis.get(`refresh_token:${refreshToken}`);
  
      if (!user_id) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
  
      jwt.verify(refreshToken, SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).json({ error: 'Invalid refresh token' });
        }
  
        const newAccessToken = jwt.sign({ user_id: decoded.user_id }, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const newRefreshToken = jwt.sign({ user_id: decoded.user_id }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
  
        redis.set(`access_token:${newAccessToken}`, user_id, 'EX', 15 * 60);
        redis.set(`refresh_token:${newRefreshToken}`, user_id, 'EX', 7 * 24 * 60 * 60);
  
        // Optionally remove the old refresh token
        redis.del(`refresh_token:${refreshToken}`);
  
        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});
  

// Логаут: удаление токенов из Redis
router.post('/logout', async (req, res) => {
  const { accessToken, refreshToken } = req.body;

  if (!accessToken && !refreshToken) {
    return res.status(400).json({ error: 'Access token or refresh token is required' });
  }

  try {
    if (accessToken) {
      await redis.del(`access_token:${accessToken}`);
    }
    if (refreshToken) {
      await redis.del(`refresh_token:${refreshToken}`);
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
