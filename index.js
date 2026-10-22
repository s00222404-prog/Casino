require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const { connectDB, User } = require('./db');
const { initWebhook, handleWebhookUpdate, checkSubscription } = require('./bot');

const app = express();

// Подключаем облачную базу данных MongoDB перед запуском сервера
connectDB();

// Защита и лимиты запросов для безопасной игры
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Слишком много запросов от игры!' }
});
app.use('/api/', limiter);

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false // Важно для загрузки WebAssembly (C++) в браузере
}));

app.use(cors());
app.use(express.json());
app.use(compression()); // Сжимает тяжелые бинарники игры на лету

// Настройка правильного MIME-типа для Wasm файлов
express.static.mime.define({ 'application/wasm': ['wasm'] });

// Раздача скомпилированной C++ игры из папки public
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '7d',
  immutable: true
}));

/* ========================================================
   1. МАРШРУТ ДЛЯ ТЕЛЕГРАМ ВЕБХУКА
   ======================================================== */
app.post('/api/telegram-webhook', async (req, res) => {
  try {
    await handleWebhookUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Ошибка в вебхуке:', error.message);
    res.sendStatus(500);
  }
});

/* ========================================================
   2. API МАРШРУТЫ ДЛЯ С++ КЛИЕНТА (ИГРЫ)
   ======================================================== */

// Получить актуальный баланс игрока из базы данных
app.get('/api/user/:id', async (req, res) => {
  try {
    let user = await User.findOne({ tg_id: req.params.id });
    if (!user) {
      user = new User({ tg_id: req.params.id, stars: config.START_STARS_BALANCE });
      await user.save();
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Проверить подписки на каналы (как на вашем скриншоте для снятия замка 🔒)
app.post('/api/verify-subscriptions', async (req, res) => {
  try {
    const { tg_id } = req.body;
    
    // Проверяем подписку на канал из нашего конфига (@RelaxSquadV2)
    const isSubscribed = await checkSubscription(tg_id, config.REQUIRED_CHANNEL);
    
    // Обновляем статус верификации пользователя в базе данных
    await User.findOneAndUpdate({ tg_id: String(tg_id) }, { is_verified: isSubscribed });

    if (isSubscribed) {
      res.json({ is_subscribed: true, message: "Доступ разблокирован! 🔓" });
    } else {
      res.json({ is_subscribed: false, message: "Требуется выполнение подписок ресурсов." });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Списание баланса и расчет игры (Баскетбол / Кубики)
app.post('/api/play-game', async (req, res) => {
  try {
    const { tg_id, bet_amount, bet_type } = req.body; // bet_type: 'even' или 'odd'
    
    const user = await User.findOne({ tg_id: String(tg_id) });
    if (!user || user.balance < bet_amount) {
      return res.status(400).json({ success: false, error: 'Недостаточно внутренних звезд 💠' });
    }

    // Списываем ставку с реферального баланса
    user.balance -= bet_amount;

    // Имитируем логику кубика/мяча (результат броска от 1 до 6)
    const score = Math.floor(Math.random() * 6) + 1;
    const isEven = score % 2 === 0;
    
    let win = false;
    if ((bet_type === 'even' && isEven) || (bet_type === 'odd' && !isEven)) {
      win = true;
      user.balance += bet_amount * 2; // Выигрыш 2х
    }

    await user.save();

    res.json({ 
      success: true, 
      score: score, // Это значение C++ игра использует для анимации броска
      win: win, 
      new_balance: user.balance 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ========================================================
   ЗАПУСК СЕРВЕРА
   ======================================================== */
app.listen(config.PORT, '0.0.0.0', async () => {
  console.log(`\n=========================================`);
  console.log(` PRODUCTION БЭКЕНД КАЗИНО УСПЕШНО ЗАПУЩЕН `);
  console.log(` Порт: ${config.PORT}`);
  console.log(`=========================================\n`);

  if (process.env.SERVER_URL) {
    await initWebhook(config.SERVER_URL);
  }
});

