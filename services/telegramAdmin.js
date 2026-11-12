
const mongoose = require("mongoose");

const Order = require("../models/customerOrder");
const SellerOrder = require("../models/authOrder");

// نام و مسیر این مدل را با مدل واقعی محصولت هماهنگ کن
const Product = require("../models/productModel");

const {
  sendMessage,
  editMessage,
  answerCallback,
  escapeHTML
} = require("../utils/telegram");

const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

const LOW_STOCK_LIMIT = Number(process.env.LOW_STOCK_LIMIT || 5);

const isAdmin = (userId) => ADMIN_IDS.includes(String(userId));

const mainMenu = {
  inline_keyboard: [
    [
      { text: "🛒 سفارش‌های جدید", callback_data: "ord:list:0" }
    ],
    [
      { text: "📦 آخرین سفارش‌ها", callback_data: "ord:recent" }
    ],
    [
      { text: "📊 گزارش فروش امروز", callback_data: "sales:today" }
    ],
    [
      { text: "📉 موجودی کم", callback_data: "stock:low" }
    ],
    [
      { text: "ℹ️ راهنمای ربات", callback_data: "help" }
    ]
  ]
};

const statusNames = {
  pending: "در انتظار بررسی",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال شده",
  delivered: "تحویل داده شده",
  cancelled: "لغو شده"
};

// نمایش منوی اصلی
const showMenu = async (chatId) => {
  return sendMessage(
    chatId,
    "🏪 <b>پنل مدیریت فروشگاه</b>\n\nیکی از گزینه‌های زیر را انتخاب کن:",
    mainMenu
  );
};

// لیست سفارش‌ها
const showOrders = async (chatId, page = 0) => {
  const limit = 5;

  const orders = await Order.find({})
    .sort({ _id: -1 })
    .skip(page * limit)
    .limit(limit)
    .lean();

  if (!orders.length) {
    return sendMessage(chatId, "📭 سفارشی پیدا نشد.");
  }

  const keyboard = orders.map(order => [{
    text: `🧾 ${String(order._id).slice(-8)} | ${Number(order.price || 0).toLocaleString("fa-IR")} تومان`,
    callback_data: `ord:view:${order._id}`
  }]);

  const navigation = [];

  if (page > 0) {
    navigation.push({
      text: "⬅️ قبلی",
      callback_data: `ord:list:${page - 1}`
    });
  }

  if (orders.length === limit) {
    navigation.push({
      text: "بعدی ➡️",
      callback_data: `ord:list:${page + 1}`
    });
  }

  if (navigation.length) keyboard.push(navigation);

  keyboard.push([
    { text: "🏠 منوی اصلی", callback_data: "menu" }
  ]);

  return sendMessage(
    chatId,
    `🛒 <b>سفارش‌ها - صفحه ${page + 1}</b>\n\nتعداد نمایش: ${orders.length}`,
    { inline_keyboard: keyboard }
  );
};

// آخرین سفارش‌ها
const showRecentOrders = async (chatId) => {
  return showOrders(chatId, 0);
};

// جزئیات سفارش
const showOrderDetails = async (chatId, messageId, orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    return sendMessage(chatId, "شناسه سفارش نامعتبر است.");
  }

  const order = await Order.findById(orderId).lean();

  if (!order) {
    return sendMessage(chatId, "❌ سفارش پیدا نشد.");
  }

  const products = (order.products || []).map((p, index) => {
    const name = p.name || p.title || p.productName || "محصول";

    return `${index + 1}. ${escapeHTML(name)}
تعداد: ${escapeHTML(p.quantity || 1)}`;
  }).join("\n\n");

  const shipping = typeof order.shippingInfo === "object"
    ? order.shippingInfo
    : {};

  const customerName =
    shipping.name || shipping.fullName || shipping.receiverName || "-";

  const phone =
    shipping.phone || shipping.mobile || shipping.phoneNumber || "-";

  const address =
    shipping.address || shipping.fullAddress || "-";

  const status = statusNames[order.delivery_status]
    || order.delivery_status
    || "-";

  const message = `
🧾 <b>جزئیات سفارش</b>

شناسه:
<code>${escapeHTML(order._id)}</code>

👤 مشتری: ${escapeHTML(customerName)}

📱 تلفن: ${escapeHTML(phone)}

📍 آدرس: ${escapeHTML(address)}

🛍 <b>محصولات:</b>

${products || "محصولی ثبت نشده"}

💰 مبلغ: ${escapeHTML(order.price)} تومان

💳 پرداخت: ${escapeHTML(order.payment_status)}

📦 وضعیت: ${escapeHTML(status)}

📅 تاریخ: ${escapeHTML(order.date)}
`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "🔄 در حال آماده‌سازی",
          callback_data: `ord:processing:${order._id}`
        }
      ],
      [
        {
          text: "🚚 ارسال سفارش",
          callback_data: `ord:shipped:${order._id}`
        }
      ],
      [
        {
          text: "✅ تحویل داده شد",
          callback_data: `ord:delivered:${order._id}`
        }
      ],
      [
        {
          text: "❌ لغو سفارش",
          callback_data: `ord:cancel:${order._id}`
        }
      ],
      [
        {
          text: "⬅️ بازگشت",
          callback_data: "ord:list:0"
        },
        {
          text: "🏠 منو",
          callback_data: "menu"
        }
      ]
    ]
  };

  if (messageId) {
    return editMessage(chatId, messageId, message, keyboard);
  }

  return sendMessage(chatId, message, keyboard);
};

// تغییر وضعیت سفارش
const updateOrderStatus = async (chatId, orderId, status) => {
  if (!mongoose.isValidObjectId(orderId)) {
    return sendMessage(chatId, "شناسه سفارش نامعتبر است.");
  }

  const allowedStatuses = [
    "processing",
    "shipped",
    "delivered",
    "cancelled"
  ];

  if (!allowedStatuses.includes(status)) {
    return sendMessage(chatId, "وضعیت نامعتبر است.");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return sendMessage(chatId, "سفارش پیدا نشد.");
  }

  if (order.delivery_status === "cancelled") {
    return sendMessage(chatId, "این سفارش قبلاً لغو شده است.");
  }

  if (
    order.delivery_status === "delivered" ||
    order.delivery_status === "shipped"
  ) {
    if (status === "processing" || status === "cancelled") {
      return sendMessage(
        chatId,
        "این تغییر وضعیت برای سفارش ارسال‌شده یا تحویل‌شده مجاز نیست."
      );
    }
  }

  if (status === "cancelled" && order.payment_status === "paid") {
    return sendMessage(
      chatId,
      "⚠️ این سفارش پرداخت شده است. قبل از لغو، وضعیت بازپرداخت را بررسی کن."
    );
  }

  order.delivery_status = status;
  await order.save();

  await SellerOrder.updateMany(
    { orderId: order._id },
    { $set: { delivery_status: status } }
  );

  const labels = {
    processing: "در حال آماده‌سازی",
    shipped: "ارسال شده",
    delivered: "تحویل داده شده",
    cancelled: "لغو شده"
  };

  return sendMessage(
    chatId,
    `✅ وضعیت سفارش <code>${order._id}</code> به <b>${labels[status]}</b> تغییر کرد.`
  );
};

// تأیید لغو سفارش
const confirmCancel = async (chatId, orderId) => {
  return sendMessage(
    chatId,
    "⚠️ آیا از لغو این سفارش مطمئن هستی؟",
    {
      inline_keyboard: [
        [
          {
            text: "بله، لغو شود",
            callback_data: `ord:cancelconfirm:${orderId}`
          }
        ],
        [
          {
            text: "بازگشت",
            callback_data: `ord:view:${orderId}`
          }
        ]
      ]
    }
  );
};

// گزارش فروش روزانه
// مبنا: زمان ساخت ObjectId سفارش، با روز تقویمی تهران
const getTehranDayRange = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    values[part.type] = Number(part.value);
  }

  // تهران UTC+03:30
  const start = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    -3,
    -30
  );

  const end = start + 24 * 60 * 60 * 1000;

  return {
    startId: mongoose.Types.ObjectId.createFromTime(
      Math.floor(start / 1000)
    ),
    endId: mongoose.Types.ObjectId.createFromTime(
      Math.floor(end / 1000)
    )
  };
};

const dailySales = async (chatId) => {
  const { startId, endId } = getTehranDayRange();

  const result = await Order.aggregate([
    {
      $match: {
        _id: {
          $gte: startId,
          $lt: endId
        }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },

        paidOrders: {
          $sum: {
            $cond: [
              { $eq: ["$payment_status", "paid"] },
              1,
              0
            ]
          }
        },

        unpaidOrders: {
          $sum: {
            $cond: [
              { $eq: ["$payment_status", "unpaid"] },
              1,
              0
            ]
          }
        },

        paidRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$payment_status", "paid"] },
              { $ifNull: ["$price", 0] },
              0
            ]
          }
        }
      }
    }
  ]);

  const stats = result[0] || {
    totalOrders: 0,
    paidOrders: 0,
    unpaidOrders: 0,
    paidRevenue: 0
  };

  const message = `
📊 <b>گزارش فروش امروز</b>

🛒 تعداد کل سفارش‌ها: ${stats.totalOrders}

✅ پرداخت موفق: ${stats.paidOrders}

⏳ پرداخت‌نشده: ${stats.unpaidOrders}

💰 مجموع مبلغ پرداخت‌شده:
<b>${Number(stats.paidRevenue).toLocaleString("fa-IR")} تومان</b>

📅 تاریخ: ${new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "full"
  }).format(new Date())}
`;

  return sendMessage(chatId, message, {
    inline_keyboard: [
      [{ text: "🏠 منوی اصلی", callback_data: "menu" }]
    ]
  });
};

// موجودی کم
const lowStock = async (chatId) => {
  const products = await Product.find({
    stock: { $lte: LOW_STOCK_LIMIT }
  })
    .select("_id name stock")
    .limit(20)
    .lean();

  if (!products.length) {
    return sendMessage(
      chatId,
      "✅ محصولی با موجودی کمتر از حد تعیین‌شده پیدا نشد."
    );
  }

  const list = products.map((p, i) => {
    return `${i + 1}. ${escapeHTML(p.name || "محصول")}
شناسه: <code>${p._id}</code>
موجودی: ${p.stock}`;
  }).join("\n\n");

  return sendMessage(
    chatId,
    `📦 <b>محصولات با موجودی کم</b>\n\n${list}\n\nبرای تغییر موجودی از دستور زیر استفاده کن:\n<code>/setstock PRODUCT_ID 20</code>`
  );
};

// تغییر موجودی
const setStock = async (chatId, args) => {
  const [productId, quantityText] = args;

  const quantity = Number(quantityText);

  if (
    !mongoose.isValidObjectId(productId) ||
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    return sendMessage(
      chatId,
      "❌ فرمت دستور اشتباه است.\n\nمثال:\n<code>/setstock 65abc123456789012345678 20</code>"
    );
  }

  const product = await Product.findByIdAndUpdate(
    productId,
    { $set: { stock: quantity } },
    { new: true }
  );

  if (!product) {
    return sendMessage(chatId, "محصول پیدا نشد.");
  }

  return sendMessage(
    chatId,
    `✅ موجودی محصول <b>${escapeHTML(product.name || product._id)}</b> به ${quantity} تغییر کرد.`
  );
};

// راهنمای دستورات
const showHelp = (chatId) => {
  return sendMessage(
    chatId,
    `
ℹ️ <b>راهنمای ربات</b>

 /start - منوی اصلی

 /orders - سفارش‌ها

 /sales - گزارش فروش امروز

 /lowstock - محصولات با موجودی کم

 /setstock ID NUMBER - تغییر موجودی

مثال:
/setstock 65abc123456789012345678 20
`
  );
};

// دریافت دستورات متنی
const handleMessage = async (message) => {
  if (!message || !message.from || !message.chat) return;

  const chatId = message.chat.id;
  const userId = message.from.id;

  if (!isAdmin(userId)) {
    return sendMessage(chatId, "⛔ شما اجازه دسترسی به پنل مدیریت را ندارید.");
  }

  const text = (message.text || "").trim();

  if (text === "/start" || text === "/menu") {
    return showMenu(chatId);
  }

  if (text === "/orders") {
    return showOrders(chatId, 0);
  }

  if (text === "/sales") {
    return dailySales(chatId);
  }

  if (text === "/lowstock") {
    return lowStock(chatId);
  }

  if (text.startsWith("/setstock")) {
    const args = text.split(/\s+/).slice(1);
    return setStock(chatId, args);
  }

  if (text === "/help") {
    return showHelp(chatId);
  }

  return sendMessage(chatId, "دستور نامعتبر است. /start را بزن.");
};

// دریافت دکمه‌ها
const handleCallback = async (query) => {
  const userId = query.from.id;
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;

  if (!isAdmin(userId) || !chatId) {
    return answerCallback(query.id, "دسترسی غیرمجاز");
  }

  const data = (query.data || "").split(":");

  await answerCallback(query.id);

  if (data[0] === "menu") {
    return showMenu(chatId);
  }

  if (data[0] === "help") {
    return showHelp(chatId);
  }

  if (data[0] === "ord" && data[1] === "list") {
    return showOrders(chatId, Math.max(0, Number(data[2]) || 0));
  }

  if (data[0] === "ord" && data[1] === "recent") {
    return showRecentOrders(chatId);
  }

  if (data[0] === "ord" && data[1] === "view") {
    return showOrderDetails(chatId, messageId, data[2]);
  }

  if (data[0] === "ord" && data[1] === "cancel") {
    return confirmCancel(chatId, data[2]);
  }

  if (data[0] === "ord" && data[1] === "cancelconfirm") {
    return updateOrderStatus(chatId, data[2], "cancelled");
  }

  if (
    data[0] === "ord" &&
    ["processing", "shipped", "delivered"].includes(data[1])
  ) {
    return updateOrderStatus(chatId, data[2], data[1]);
  }

  if (data[0] === "sales" && data[1] === "today") {
    return dailySales(chatId);
  }

  if (data[0] === "stock" && data[1] === "low") {
    return lowStock(chatId);
  }
};

const handleUpdate = async (update) => {
  if (update.message) {
    return handleMessage(update.message);
  }

  if (update.callback_query) {
    return handleCallback(update.callback_query);
  }
};

module.exports = {
  handleUpdate,
  isAdmin
};
