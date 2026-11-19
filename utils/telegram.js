
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const escapeHTML = (text) => {
  return String(text ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const statusNames = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل داده شده",
  cancelled: "لغو شده",
};

const sendMessage = async (message, keyboard) => {
  if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is not defined");
  }

  if (!TELEGRAM_CHAT_ID) {
    throw new Error("TELEGRAM_CHAT_ID is not defined");
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const response = await axios.post(url, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "HTML",
    reply_markup: keyboard,
  });

  if (!response.data?.ok) {
    throw new Error(
      response.data?.description || "Telegram send failed"
    );
  }

  return response.data;
};

const notifyNewOrder = async (order) => {
  if (!order) {
    throw new Error("Order not found");
  }

  const shipping =
    order.shippingInfo &&
    typeof order.shippingInfo === "object"
      ? order.shippingInfo
      : {};

  const customerName =
    shipping.name ||
    shipping.fullName ||
    shipping.receiverName ||
    "-";

  const phone =
    shipping.phone ||
    shipping.mobile ||
    shipping.phoneNumber ||
    "-";

  const address =
    shipping.address ||
    shipping.fullAddress ||
    "-";

      const shopName =
    shipping.shippingInfo.name ||
    "-";

  const products = (order.products || [])
    .map((p, index) => {
      const name =
        p.name || p.title || p.productName || "محصول";

      const qty = p.quantity || 1;

      return `${index + 1}. ${escapeHTML(name)} × ${escapeHTML(qty)}`;
    })
    .join("\n");

  const price = Number(order.price || 0).toLocaleString("fa-IR");

  const paymentStatus = order.payment_status || "-";

  const deliveryStatus =
    statusNames[order.delivery_status] ||
    order.delivery_status ||
    "-";

  const message = `
🛒 <b>سفارش جدید ثبت شد!</b>

👤 مشتری: ${escapeHTML(customerName)}
📱 تلفن: ${escapeHTML(phone)}
📱 از فروشگاه: ${escapeHTML(shopName)}
📍 آدرس: ${escapeHTML(address)}

🛍 <b>محصولات:</b>
${products || "محصولی ثبت نشده"}

💰 مبلغ: <b>${price} تومان</b>
💳 پرداخت: ${escapeHTML(paymentStatus)}
📦 وضعیت: ${escapeHTML(deliveryStatus)}

🧾 شناسه سفارش:
<code>${escapeHTML(String(order._id))}</code>
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

  await sendMessage(message, keyboard);

  console.log("Telegram order notification sent successfully");

  return true;
};

module.exports = {
  notifyNewOrder,
};
