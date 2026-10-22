require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ограничение запросов для защиты казино от читеров и DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Увеличили лимит, так как C++ игра может слать больше технических запросов
  message: { error: 'Слишком много запросов от игры!' }
});
app.use('/api/', limiter);

// Настройка безопасности под WebAssembly и WebGL
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false // Позволяет браузеру загружать Wasm-модули
}));

app.use(cors());
app.use(express.json());
app.use(compression()); // Сжимает тяжелый бинарник .wasm при первой загрузке у игрока

// Настройка раздачи статических файлов (Wasm-сборка игры и графика)
// Устанавливаем правильный Content-Type для WebAssembly, иначе браузер заблокирует игру
express.static.mime.define({ 'application/wasm': ['wasm'] });

app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '7d', // Кэшируем движок игры на 7 дней в памяти телефона
  immutable: true
}));

// --- API МАРШРУТЫ ДЛЯ С++ КЛИЕНТА ---

// 1. Проверить статус сервера
app.get('/api/status', (req, res) => {
  res.json({ status: 'Casino API is ready for C++ Client' });
});

// 2. Имитация проверки подписок (как на вашем скриншоте)
app.post('/api/verify-subscriptions', async (req, res) => {
  const { tg_id } = req.body;
  
  // ТУТ БУДЕТ КОД ПРОВЕРКИ ЧЕРЕЗ TELEGRAM API
  // Пока отдаем заглушку, что всё заблокировано
  res.json({ 
    is_subscribed: false, 
    message: "Требуется выполнение подписок ресурсов." 
  });
});

// 3. Запрос на запуск игры (Баскетбол/Кубики)
app.post('/api/play', (req, res) => {
  const { tg_id, bet_amount, game_type } = req.body;
  // Логика списания внутренних звезд и просчет результата игры на бэкенде
  res.json({ success: true, balance: 250.00 });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=========================================`);
  console.log(` СЕРВЕР КАЗИНО (C++ BACKEND) ГОТОВ `);
  console.log(` Порт: ${PORT}`);
  console.log(`=========================================\n`);
});
  
