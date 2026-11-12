
const axios = require("axios");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

const telegramRequest = async (method, data = {}) => {
  const response = await axios.post(
    `${BASE_URL}/${method}`,
    data,
    { timeout: 15000 }
  );

  if (!response.data.ok) {
    throw new Error(response.data.description || "Telegram API error");
  }

  return response.data.result;
};

const escapeHTML = (value = "-") =>
  String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const sendMessage = (chatId, text, keyboard = null) => {
  const data = {
    chat_id: chatId,
    text,
    parse_mode: "HTML"
  };

  if (keyboard) {
    data.reply_markup = keyboard;
  }

  return telegramRequest("sendMessage", data);
};

const editMessage = (chatId, messageId, text, keyboard = null) => {
  const data = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML"
  };

  if (keyboard) {
    data.reply_markup = keyboard;
  }

  return telegramRequest("editMessageText", data);
};

const answerCallback = (callbackId, text = "") => {
  return telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackId,
    text
  });
};

const sendNewOrderNotification = (order) => {
  const products = (order.products || []).map((p, i) => {
    const name = p.name || p.title || p.productName || "محصول";

    return `${i + 1}. ${escapeHTML(name)} × ${escapeHTML(p.quantity || 1)}`;
  }).join("\n");

  const message = `
🔔 <b>سفارش جدید!</b>

🧾 شماره سفارش:
<code>${escapeHTML(order._id)}</code>

💰 مبلغ: ${escapeHTML(order.price)} تومان

💳 پرداخت: ${escapeHTML(order.payment_status)}

📦 ارسال: ${escapeHTML(order.delivery_status)}

🛍 محصولات:
${products || "بدون محصول"}
`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "👁 مشاهده سفارش",
          callback_data: `ord:view:${order._id}`
        }
      ]
    ]
  };

  return sendMessage(
    process.env.TELEGRAM_CHAT_ID,
    message,
    keyboard
  );
};

module.exports = {
  telegramRequest,
  sendMessage,
  editMessage,
  answerCallback,
  escapeHTML,
  sendNewOrderNotification
};
