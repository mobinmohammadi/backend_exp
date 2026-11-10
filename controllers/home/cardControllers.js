const { response } = require("express");
const cartModel = require("../../models/cartModel");
const productModel = require("../../models/productModel");
const { responseReturn } = require("../../utils/response");

class cardControllers {
  add_to_cart = async (req, res) => {
    console.log(req.body);

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
        console.log(product);

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

  get_cart_products = async(req,res) => {
    


    console.log("hellow");
    
    

  }
}

module.exports = new cardControllers();
