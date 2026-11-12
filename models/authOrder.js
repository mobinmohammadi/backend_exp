const mongoose = require("mongoose");
const { Schema } = mongoose;

const authOrdersSechma = new Schema(
  {
    orderId: {
      type: Schema.ObjectId,
      required: true,
    },
    sellerId: {
      type: Schema.ObjectId,
      required: true,
    },
    products: {
      type: Array,
      required: true,
    },
    price: {
      type: Array,
      required: true,
    },
      payment_status: {
  type: String,
  enum: ["unpaid", "paid", "failed"],
  default: "unpaid"
},
    shippingInfo: {
      type: Object,
      required: true,
    },
    delivery_status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      required: true,
    },
    productId: {
      type: Schema.ObjectId,
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const authOrderModel =
  mongoose.models.authorOrders ||
  mongoose.model("authorOrders", authOrdersSechma);

module.exports = authOrderModel;
