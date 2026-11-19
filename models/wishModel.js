const { Schema, model } = require("mongoose");

const wishsSechma = new Schema(
  {
    userId: {
      type: Schema.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },

    productId: {
      type: Schema.ObjectId,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default : 0
    },
  },

  { timestamps: true },
);

module.exports = model("wishs", wishsSechma);
