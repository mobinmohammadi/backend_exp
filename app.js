const express = require("express");
const app = express();

require("dotenv").config();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const { dbConnect } = require("./utils/db");

const port = process.env.PORT || 5000;

app.use(
  cors({
    origin:
      process.env.mode === "pro"
        ? [process.env.client_customer_production_url]
        : ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/home", require("./routes/home/homeRoutes"));
app.use("/api", require("./routes/home/customerRoutes"));
app.use("/api", require("./routes/home/cartRoutes"));
app.use("/api", require("./routes/authRoutes"));
app.use("/api", require("./routes/orders/ordersRoutes"));
app.use("/api", require("./routes/dashboard/categoryRoutes"));
app.use("/api", require("./routes/dashboard/productsRoutes"));
app.use("/api", require("./routes/dashboard/sellersRoutes"));
app.use("/api/telegram", require("./routes/telegram/telegramRoutes"));

app.get("/", (req, res) => {
  res.send("سلام من بک توسعه داده شده توسط RC هستم");
});

// 1. اتصال به دیتابیس را در سطح ماژول صدا بزنید (Vercel آن را کش می‌کند)
dbConnect();

// 2. اپلیکیشن را Export کنید (برای Vercel)
module.exports = app;

// 3. فقط در محیط لوکال از listen استفاده کنید
if (process.env.mode !== "production" && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is Running on Port ${port}`);
  });
}