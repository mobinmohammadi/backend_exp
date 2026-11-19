
const axios = require("axios");
const customerOrder = require("../models/customerOrder");

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const escapeHTML = (text) =>
  String(text ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const statusNames = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل داده شده",
  cancelled: "لغو شده",
};

const sendMessage = async (chatId, text, keyboard) => {
  const response = await axios.post(`${API}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: keyboard,
  });

  if (!response.data.ok) {
    throw new Error(response.data.description);
  }

  return response.data;
};

// ==================================
// New Order Notification
// ==================================

const notifyNewOrder = async (order) => {
  if (!BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Telegram configuration is missing");
  }

  if (!order) {
    throw new Error("Order not found");
  }

  const shipping = order.shippingInfo || {};

  const products = (order.products || [])
    .map((p, index) => {
      const name = p.name || p.title || p.productName || "محصول";

      return `${index + 1}. ${escapeHTML(name)} × ${p.quantity || 1}`;
    })
    .join("\n");

  const message = `
🛒 <b>سفارش جدید ثبت شد!</b>

👤 مشتری: ${escapeHTML(shipping.name || shipping.fullName || "-")}
📱 تلفن: ${escapeHTML(shipping.phone || shipping.mobile || "-")}
📍 آدرس: ${escapeHTML(shipping.address || shipping.fullAddress || "-")}

🛍 <b>محصولات:</b>
${products || "محصولی ثبت نشده"}

💰 مبلغ: <b>${Number(order.price || 0).toLocaleString("fa-IR")} تومان</b>

💳 پرداخت: ${escapeHTML(order.payment_status)}
📦 وضعیت: ${escapeHTML(statusNames[order.delivery_status] || order.delivery_status)}

🧾 شماره سفارش:
<code>${escapeHTML(order._id)}</code>
`.trim();

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "👁 مشاهده جزئیات",
          callback_data: `ord:view:${order._id}`,
        },
      ],
    ],
  };

  await sendMessage(TELEGRAM_CHAT_ID, message, keyboard);

  console.log("Telegram order notification sent successfully");

  return true;
};

// ==================================
// Show Order Details
// ==================================

const showOrderDetails = async (query) => {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;

  try {
    const orderId = query.data.split(":")[2];

    // Find order in database
    const order = await customerOrder.findById(orderId);

    if (!order) {
      await axios.post(`${API}/answerCallbackQuery`, {
        callback_query_id: query.id,
        text: "سفارش پیدا نشد!",
        show_alert: true,
      });

      return;
    }

    const shipping = order.shippingInfo || {};

    const products = (order.products || [])
      .map((p, index) => {
        const name = p.name || p.title || p.productName || "محصول";

        const quantity = p.quantity || 1;

        const price = Number(
          p.price || p.productPrice || 0
        ).toLocaleString("fa-IR");

        return `
${index + 1}. <b>${escapeHTML(name)}</b>
   تعداد: ${escapeHTML(quantity)}
   قیمت واحد: ${price} تومان
`;
      })
      .join("\n");

    const detailMessage = `
📋 <b>جزئیات کامل سفارش</b>

🧾 شناسه سفارش:
<code>${escapeHTML(order._id)}</code>

━━━━━━━━━━━━━━

👤 <b>اطلاعات مشتری</b>

نام: ${escapeHTML(shipping.name || shipping.fullName || "-")}
تلفن: ${escapeHTML(shipping.phone || shipping.mobile || "-")}

📍 آدرس:
${escapeHTML(shipping.address || shipping.fullAddress || "-")}

━━━━━━━━━━━━━━

🛍 <b>محصولات سفارش</b>

${products || "محصولی ثبت نشده"}

━━━━━━━━━━━━━━

💰 مبلغ کل:
<b>${Number(order.price || 0).toLocaleString("fa-IR")} تومان</b>

💳 وضعیت پرداخت:
${escapeHTML(order.payment_status)}

📦 وضعیت ارسال:
${escapeHTML(statusNames[order.delivery_status] || order.delivery_status)}

📅 تاریخ سفارش:
${escapeHTML(order.date || "-")}
`.trim();

    await axios.post(`${API}/answerCallbackQuery`, {
      callback_query_id: query.id,
      text: "جزئیات سفارش دریافت شد ✅",
    });

    // Send details as a new Telegram message
    await sendMessage(chatId, detailMessage);

  } catch (error) {
    console.error("Show Order Details Error:", error.message);

    await axios.post(`${API}/answerCallbackQuery`, {
      callback_query_id: query.id,
      text: "خطا در دریافت اطلاعات سفارش",
      show_alert: true,
    }).catch(() => {});
  }
};

// ==================================
// Handle Telegram Updates
// ==================================

const handleUpdate = async (update) => {
  if (!update) return;

  if (update.callback_query) {
    const query = update.callback_query;

    if (query.data?.startsWith("ord:view:")) {
      await showOrderDetails(query);
    }
  }
};

module.exports = {
  notifyNewOrder,
  handleUpdate,
};
