const { Schema, model } = require("mongoose");

const cardSechma = new Schema(
  {
    userId: {
      type: Schema.ObjectId,
      required: true,
    },
    quantity: {
      type:  Number,
      required: true,

    },
    productId: {
      type:  Schema.ObjectId,
      required: true,
    },
   
  },

  { timestamps: true },
);

module.exports = model("carts", cardSechma);
