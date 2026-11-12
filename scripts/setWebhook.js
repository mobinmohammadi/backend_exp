
require("dotenv").config();

const axios = require("axios");

async function setWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const baseUrl = process.env.PUBLIC_BASE_URL;

  if (!token || !secret || !baseUrl) {
    throw new Error("Missing Telegram webhook configuration");
  }

  const url =
    `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  const response = await axios.post(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      url,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"]
    }
  );

  console.log(response.data);
}

setWebhook().catch(error => {
  console.error(
    "Webhook Error:",
    error.response?.data || error.message
  );
});
