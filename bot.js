require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Импортируем логику нашего бота и базу данных из src/bot.js
const { initWebhook, handleWebhookUpdate, checkSubscription, usersDB } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;
// Берем URL сервера из Render или используем локальный адрес
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

// Ограничение запросов для защиты казино от накруток и DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, 
  message: { error: 'Слишком много запросов от игры!' }
});
app.use('/api/', limiter);

// Настройка безопасности под WebAssembly и WebGL для C++ игры
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false 
}));

app.use(cors());
app.use(express.json());
app.use(compression()); // Сжимает тяжелый .wasm движок при загрузке

// Правильный Content-Type для WebAssembly, чтобы браузер внутри Telegram запустил C++ код
express.static.mime.define({ 'application/wasm': ['wasm'] });

// Раздача файлов игры (index.html, game.js, game.wasm) из папки public
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '7d', 
  immutable: true
}));

/* ========================================================
   1. TELEGRAM WEBHOOK МАРШРУТ (Принимает сообщения бота)
   ======================================================== */
app.post('/api/telegram-webhook', async (req, res) => {
  try {
    await handleWebhookUpdate(req.body);
    res.sendStatus(200); // Всегда отвечаем Telegram 200 OK
  } catch (error) {
    console.error('Ошибка в обработчике вебхука:', error.message);
    res.sendStatus(500);
  }
});

/* ========================================================
   2. API МАРШРУТЫ ДЛЯ С++ КЛИЕНТА (ИГРЫ)
   ======================================================== */

// Получить данные игрока (Баланс, звезды, рефералы)
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  
  // Если игрока почему-то нет в БД, создаем стартовый баланс
  if (!usersDB[userId]) {
    usersDB[userId] = { balance: 0.00, stars: 250.00, referrals: 0 };
  }
  
  res.json({ success: true, data: usersDB[userId] });
});

// Проверить подписки на ресурсы (канал и бот, как на вашем скриншоте)
app.post('/api/verify-subscriptions', async (req, res) => {
  const { tg_id } = req.body;
  
  // ID вашего канала или юзернейм (например, '@RelaxSquadV2' или его цифровой ID '-100xxxxxx')
  // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ ЮЗЕРНЕЙМ ВАШЕГО КАНАЛА:
  const REQUIRED_CHANNEL = '@RelaxSquadV2'; 

  const isSubscribedToChannel = await checkSubscription(tg_id, REQUIRED_CHANNEL);

  if (isSubscribedToChannel) {
    res.json({ 
      is_subscribed: true, 
      message: "Доступ разблокирован! 🔓" 
    });
  } else {
    res.json({ 
      is_subscribed: false, 
      message: "Требуется выполнение подписок ресурсов." 
    });
  }
});

// Запрос из C++ игры на бросок (баскетбол, кубики, кегли)
app.post('/api/play-game', (req, res) => {
  const { tg_id, bet_amount, bet_type } = req.body; // bet_type: 'even' (четное) или 'odd' (нечетное)
  
  const user = usersDB[tg_id];
  if (!user || user.balance < bet_amount) {
    return res.status(400).json({ success: false, error: 'Недостаточно внутренних звезд 💠' });
  }

  // Списываем ставку
  user.balance -= bet_amount;

  // Логика игры (например, для кубика или баскетбола генерируем результат от 1 до 6)
  const score = Math.floor(Math.random() * 6) + 1;
  const isEven = score % 2 === 0;
  
  let win = false;
  if ((bet_type === 'even' && isEven) || (bet_type === 'odd' && !isEven)) {
    win = true;
    // В случае выигрыша возвращаем ставку х2 (как в казино)
    user.balance += bet_amount * 2;
  }

  res.json({ 
    success: true, 
    score: score, // Результат броска для C++ анимации
    win: win, 
    new_balance: user.balance 
  });
});

/* ========================================================
   ЗАПУСК СЕРВЕРА
   ======================================================== */
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n=========================================`);
  console.log(` СЕРВЕР КАЗИНО (C++ BACKEND) СВЯЗАН С БОТОМ `);
  console.log(` Сервер работает на порту: ${PORT}`);
  console.log(`=========================================\n`);

  // Автоматически регистрируем наш сервер в Telegram API при старте на Render
  if (process.env.SERVER_URL) {
    await initWebhook(SERVER_URL);
  }
});
                              
