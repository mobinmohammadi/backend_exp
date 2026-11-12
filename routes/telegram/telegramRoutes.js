
const express = require("express");
const router = express.Router();

const { handleUpdate } = require("../../services/telegramAdmin");
const { dbConnect } = require("../../utils/db");

router.post("/webhook", async (req, res) => {
  const secret = req.headers["x-telegram-bot-api-secret-token"];

  if (
    !process.env.TELEGRAM_WEBHOOK_SECRET ||
    secret !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await dbConnect();
    await handleUpdate(req.body);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    return res.status(500).json({
      error: "Webhook processing failed"
    });
  }
});

module.exports = router;
