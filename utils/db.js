const mongoose = require("mongoose");

module.exports.dbConnect = async () => {
  const isProd = process.env.mode === "pro";
  const uri = isProd ? process.env.DB_PRO_URL : process.env.DB_LOCAL_URL;

  if (!uri) {
    throw new Error(
      `Database URI is not defined (mode: ${isProd ? "production" : "local"})`
    );
  }

  try {
    await mongoose.connect(uri);
    console.log(
      isProd
        ? "✅ Production Database connected"
        : "✅ Local Database connected"
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};