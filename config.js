/**
 * Глобальный конфигурационный файл сервера Казино
 */
module.exports = {
  // Настройки сервера
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'CasinoDefaultFallbackSecretKey2026',

  // Настройки Telegram Bot API
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8776461968:AAEhCwA3X49BMDEWeWCoC3tQkdf5dQ66PmY',
  REQUIRED_CHANNEL: '@RelaxSquadV2', // Канал для обязательной подписки (как на скриншоте)

  // База данных
  MONGODB_URI: process.env.MONGODB_URI,

  // Игровые настройки баланса (константы из интерфейса)
  REFERRAL_REWARD: 0.10,      // Начисление +0.10 внутренних звёзд 💠 за друга
  START_STARS_BALANCE: 250.00 // Стартовый баланс TG Stars ⭐ у нового игрока
};
