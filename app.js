const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { dbConnect } = require("./utils/db");
const port = process.env.PORT;

app.use(
  cors({
    origin:
      process.env.mode == "pro"
        ? [process.env.client_customer_production_url]
        : ["http://localhost:5173"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/home", require("./routes/home/homeRoutes"));
app.use("/api", require("./routes/home/customerRoutes"));
app.use("/api", require("./routes/home/cartRoutes"));
app.use("/api", require("./routes/authRoutes"));
app.use("/api", require("./routes/dashboard/categoryRoutes"));
app.use("/api", require("./routes/dashboard/productsRoutes"));
app.use("/api", require("./routes/dashboard/sellersRoutes"));
app.get("/", (req, res) => res.send("سللام من بک توسعه داده شده توسط RC هستم"));
dbConnect();
app.listen(port, () => console.log(`Server is Running on Port ${port} 🤙`));
