const axios = require('axios');
const config = require('./config');
const { User } = require('./db');

const TELEGRAM_API = `https://telegram.org{config.BOT_TOKEN}`;

/**
 * Инициализация Webhook для Render.
 */
async function initWebhook(serverUrl) {
  try {
    const webhookUrl = `${serverUrl}/api/telegram-webhook`;
    await axios.post(`${TELEGRAM_API}/setWebhook`, { url: webhookUrl });
    console.log(`[Bot] Webhook успешно установлен на адрес: ${webhookUrl}`);
  } catch (error) {
    console.error('[Bot] Ошибка установки Webhook:', error.message);
  }
}

/**
 * Обработка входящих сообщений от Telegram (Вебхук)
 */
async function handleWebhookUpdate(update) {
  if (!update.message) return;

  const chatId = update.message.chat.id;
  const userId = String(update.message.from.id);
  const text = update.message.text || '';

  if (text.startsWith('/start')) {
    // 1. Ищем пользователя в базе данных или создаем нового
    let user = await User.findOne({ tg_id: userId });
    
    if (!user) {
      user = new User({
        tg_id: userId,
        stars: config.START_STARS_BALANCE, // 250.00 ⭐ из конфига
        balance: 0.00
      });

      // 2. Обработка реферальной ссылки (например, /start ref_123456)
      const startArgs = text.split(' ')[1];
      if (startArgs && startArgs.startsWith('ref_')) {
        const referrerId = startArgs.replace('ref_', '');

        // Защита: нельзя пригласить самого себя
        if (referrerId !== userId) {
          user.referred_by = referrerId;
          
          // Находим того, кто пригласил, и начисляем ему +0.10 💠
          const referrer = await User.findOne({ tg_id: referrerId });
          if (referrer) {
            referrer.balance += config.REFERRAL_REWARD; // +0.10 💠
            referrer.referrals_count += 1;
            await referrer.save();

            // Отправляем уведомление другу в Telegram
            await sendMessage(referrerId, `🔔 По вашей ссылке зарегистрировался новый друг! Вам начислено +${config.REFERRAL_REWARD} 💠`);
          }
        }
      }
      await user.save();
    }

    // Реферальная ссылка для самого игрока
    const myRefLink = `https://t.me{update.message.via_bot?.username || 'your_bot_username'}?start=ref_${userId}`;

    // 3. Отправляем приветствие с кнопкой запуска C++ Mini App
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: `👋 Добро пожаловать в STARS MINI CASINO!\n\n` +
            `💰 Ваш баланс: ${user.stars.toFixed(2)} ⭐\n` +
            `💠 Реферальный баланс: ${user.balance.toFixed(2)} 💠\n\n` +
            `🔗 Твоя реферальная ссылка (1 друг = +0.10 💠):\n${myRefLink}`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🚀 Играть в Казино", web_app: { url: config.SERVER_URL } }
          ]
        ]
      }
    });
  }
}

/**
 * Проверка подписки на обязательный канал через API Telegram
 */
async function checkSubscription(userId, channelUsername) {
  try {
    const response = await axios.get(`${TELEGRAM_API}/getChatMember`, {
      params: { chat_id: channelUsername, user_id: userId }
    });
    const status = response.data?.result?.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    console.error(`[Bot] Ошибка проверки подписки на ${channelUsername}:`, error.message);
    return false;
  }
}

/**
 * Вспомогательная функция отправки сообщений
 */
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, { chat_id: chatId, text });
  } catch (error) {
    console.error('[Bot] Ошибка отправки сообщения:', error.message);
  }
}

module.exports = {
  initWebhook,
  handleWebhookUpdate,
  checkSubscription
};

                              
