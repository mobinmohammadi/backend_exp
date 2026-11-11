const { response } = require("express");
const cartModel = require("../../models/cartModel");
const productModel = require("../../models/productModel");
const { responseReturn } = require("../../utils/response");

const {
  mongo: { ObjectId },
} = require("mongoose");

class cardControllers {
  add_to_cart = async (req, res) => {

    const { userId, quantity, productId } = req.body;
    try {
      const product = await cartModel.findOne({
        $and: [
          {
            productId: { $eq: productId },
            userId: { $eq: userId },
          },
        ],
      });

      if (product) {

        responseReturn(res, 404, { error: "The Product Allready exist" });
      } else {
        const product = await cartModel.create({
          userId,
          quantity,
          productId,
        });
        responseReturn(res, 201, {
          product,
          message: "The Addedd Product The basket",
        });
      }
    } catch (error) {
      responseReturn(res, 500, { error: "Internall server Error" });
    }
  };

  get_cart_products = async (req, res) => {
    const { userId } = req.params;
    const co = 5;

    try {
      // ✅ اعتبارسنجی userId
      if (!userId || !ObjectId.isValid(userId)) {
        return responseReturn(res, 400, { error: "Invalid userId" });
      }

      const cart_products = await cartModel.aggregate([
        { $match: { userId: new ObjectId(userId) } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "products",
          },
        },
        // ✅ حذف آیتم‌هایی که محصولشان پیدا نشد
        {
          $match: {
            products: { $elemMatch: { _id: { $exists: true } } },
          },
        },
      ]);

      console.log("aggregate result:", JSON.stringify(cart_products, null, 2));

      // ✅ فیلتر ایمن (products همیشه آرایه غیرخالی است، اما محض احتیاط)
      const hasProduct = (p) =>
        Array.isArray(p.products) && p.products.length > 0 && p.products[0];

      const outOfStockProduct = cart_products.filter(
        (p) => !hasProduct(p) || p.products[0].stock < p.quantity,
      );

      const stockProduct = cart_products.filter(
        (p) => hasProduct(p) && p.products[0].stock >= p.quantity,
      );

      let buy_product_item = 0;
      let calculatePrice = 0;
      let cart_product_count = 0;

      for (const item of outOfStockProduct) {
        cart_product_count += item.quantity;
      }

      for (const item of stockProduct) {
        const { quantity } = item;
        cart_product_count += quantity;
        buy_product_item += quantity;

        const { price, discount } = item.products[0];
        const unitPrice =
          discount && discount !== 0
            ? price - Math.floor((price * discount) / 100)
            : price;
        calculatePrice += quantity * unitPrice;
      }

      const grouped = {};
      for (const item of stockProduct) {
        const tp = item.products[0];
        if (!tp || !tp.sellerId) continue;

        const sellerId = tp.sellerId.toString();
        const basePrice =
          tp.discount && tp.discount !== 0
            ? tp.price - Math.floor((tp.price * tp.discount) / 100)
            : tp.price;
        const finalPrice = basePrice - Math.floor((basePrice * co) / 100);

        if (!grouped[sellerId]) {
          grouped[sellerId] = {
            sellerId,
            shopName: tp.shopName,
            price: 0,
            products: [],
          };
        }
        grouped[sellerId].price += finalPrice * item.quantity;
        grouped[sellerId].products.push({
          _id: item._id,
          quantity: item.quantity,
          productInfo: tp,
        });
      }

      const p = Object.values(grouped);

      return responseReturn(res, 200, {
        cart_products: p,
        price: calculatePrice,
        cart_product_count,
        shipping_fee: 20 * p.length,
        outOfStockProduct,
        buy_product_item,
      });
    } catch (error) {
      console.log("get_cart_products error:", error.message);
      return responseReturn(res, 500, { error: error.message });
    }
  };

  delete_cart_product = async (req, res) => {
    
    const { productId } = req.params;
    console.log(req.params);
    


    try {
      await cartModel.findByIdAndDelete(productId);

      responseReturn(res, 200, { message: "The Product Delete Succussfully" });
    } catch (error) {
      console.log("error ==>", error.message);
    }
  };
}
module.exports = new cardControllers();
