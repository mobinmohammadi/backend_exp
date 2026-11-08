const { Schema, model } = require("mongoose");
const customerSechma = new Schema(
  {
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
