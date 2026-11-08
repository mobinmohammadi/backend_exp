const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const { responseReturn } = require("../../utils/response");
const queryProducts = require("../../utils/queryProducts");

class homeControllers {
  formateProduct = (products) => {
    let productArray = [];
    for (let i = 0; i < products.length; i += 3) {
      let check = products.slice(i, i + 3);
      productArray.push(check);
    }
    return productArray;
  };
  get_category = async (req, res) => {
    try {
      const categorys = await categoryModel.find({});
      const totalCategorys = await categoryModel.find({}).countDocuments();
      responseReturn(res, 200, { categorys, totalCategorys });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  get_products = async (req, res) => {
    try {
      const products = await productModel.find({}).sort({ createdAt: -1 });

      const allProduct1 = await productModel
        .find({})
        .limit(9)
        .sort({ createdAt: -1 });
      const latest_Product = this.formateProduct(allProduct1);

      const allProduct2 = await productModel
        .find({})
        .limit(9)
        .sort({ createdAt: -1 });
      const topRated_Product = this.formateProduct(allProduct2);

      const allProduct3 = await productModel
        .find({})
        .limit(9)
        .sort({ discount: -1 });
      const discount_product = this.formateProduct(allProduct3);

      const totalProducts = await productModel.find({}).countDocuments();

      responseReturn(res, 200, {
        products,
        totalProducts,
        latest_Product,
        topRated_Product,
        discount_product,
      });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  price_range_product = async (req, res) => {
    try {
      const priceRange = {
        low: 0,
        high: 0,
      };

      const products = await productModel.find({}).limit(9).sort({
        createdAt: -1,
      });

      const latest_product = this.formateProduct(products);

      const getForPrice = await productModel.find({}).sort({
        price: 1,
      });

      if (getForPrice.length > 0) {
        priceRange.high = getForPrice[getForPrice.length - 1].price;
        priceRange.low = getForPrice[0].price;
      }
      responseReturn(res, 200, { latest_product, priceRange });
    } catch (error) {
      console.log(error.message);
    }
  };

  query_products = async (req, res) => {
    const parPage = 6;
    const query = {...req.query , parPage}
    req.query.parPage = parPage;
    console.log(query);


    try {
      const products = await productModel.find({}).sort({
        createdAt: -1,
      });
      const totalProduct = new queryProducts(products, query)
        .categoryQuery()
        .ratingQuery()
        .priceQuery()
        .sortPrice()
        .countProducts();

      const result = new queryProducts(products, query)
        .categoryQuery()
        .ratingQuery()
        .priceQuery()
        .sortPrice()
        .skip()
        .limit()
        .getProducts();

      responseReturn(res, 200, { products: result, totalProduct, parPage });
    } catch (error) {
      console.log(error.message);
    }
  };
}

module.exports = new homeControllers();
