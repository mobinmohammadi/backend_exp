const { Schema, model } = require("mongoose");
const customerSechma = new Schema(
  {

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "customers",
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: true,
    },
    method: {
      type: String,
      required: true,
    },
  },

  { timestamps: true },
);

customerSechma.index({
  name: "text",
});

module.exports = model("customers", customerSechma);
