const { Schema, model } = require("mongoose");

const customerOrderSechma = new Schema(
  {
    customerOrder: {
      type: Schema.ObjectId,
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
      default: "unpaid",
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

module.exports = model("customerOrder", customerOrderSechma);
