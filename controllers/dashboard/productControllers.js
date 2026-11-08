const productModel = require("../../models/productModel");
const ProductModel = require("../../models/productModel");
const { responseReturn } = require("../../utils/response");
const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;

class productControllers {
  add_product = async (req, res) => {
    const form = formidable({ multiples: true });
    const { id } = req;

    form.parse(req, async (err, field, files) => {
      if (err) responseReturn(res, 404, { message: err });
      else {
        let {
          description,
          price,
          stock,
          discount,
          brand,
          shopName,
          name,
          category,
        } = field;

        const { images } = files;
        name = name.trim();
        const slug = name.split(" ").join("-");

        cloudinary.config({
          cloud_name: process.env.cloud_name,
          api_key: process.env.api_key,
          api_secret: process.env.api_secret,
          secure: true,
        });
        try {
          let allImageUrl = [];
          for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.uploader.upload(
              images[i].filepath,
              {
                folder: "products",
              },
            );
            allImageUrl = [...allImageUrl, result.url];
          }
          const product = await productModel.create({
            sellerId: id,
            name,
            shopName,
            slug,
            brand: brand.trim(),
            images: allImageUrl,
            category: category.trim(),
            stock: parseInt(stock),
            price: parseInt(price),
            discount: parseInt(discount),
            description: description.trim(),
          });
          responseReturn(res, 201, {
            product,
            message: "Product Adedd SuccussFully",
          });
        } catch (error) {
          responseReturn(res, 500, { error: error.message });
        }
      }
    });
  };

  get_products = async (req, res) => {
    const { page, searchValue, parPage } = req.query;
    const { id } = req;
    const skipPage = parseInt(parPage) * (parseInt(page) - 1);

    try {
      if (searchValue) {
        const products = await productModel
          .find({
            $text: { $search: searchValue },
            sellerId: id,
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalProducts = await productModel
          .find({
            $text: { $search: searchValue },
            sellerId: id,
          })
          .countDocuments();

        responseReturn(res, 200, { products, totalProducts });
      } else {
        const products = await productModel
          .find({ sellerId: id })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalProducts = await productModel
          .find({ sellerId: id })
          .countDocuments();
        responseReturn(res, 200, { products, totalProducts });
      }
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  // End -----------------------------------

  get_product = async (req, res) => {
    const { productId } = req.params;

    console.log("productId ===> ", productId);

    try {
      const product = await productModel.findById(productId);
      responseReturn(res, 200, { product });
      console.log(product);
    } catch (error) {
      console.log(error.message);
    }
  };  

  // End -----------------------------------

  update_product = async (req, res) => {
    console.log(req.body);
    const { name, description, discount, price, brand, stock, productId } =
      req.body;

    try {
      await productModel.findByIdAndUpdate(productId, {
        name,
        description,
        discount,
        price,
        brand,
        stock,
        productId,
      });
      const product = await productModel.findById(productId);
      responseReturn(res, 200, {
        product,
        message: "updatedd Product successfully",
      });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  // End -----------------------------------

  update_product_image = async (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, field, files) => {
      const { oldImage, productId } = field;
      const { newImg } = files;

      if (err) {
        responseReturn(res, 404, { err: err.message });
      } else {
        try {
          cloudinary.config({
            cloud_name: process.env.cloud_name,
            api_key: process.env.api_key,
            api_secret: process.env.api_secret,
            secure: true,
          });

          const result = await cloudinary.uploader.upload(newImg.filepath, {
            folder: "products",
          });

          if (result) {
            const { images } = await productModel.findById(productId);
            const index = images.findIndex((img) => img === oldImage);
            images[index] = result.url;

            await productModel.findByIdAndUpdate(productId, { images });

            const product = await productModel.findById(productId);

            responseReturn(res, 200, {
              product,
              message: "Updated Product Succussfully",
            });
          } else {
            responseReturn(res, 404, { message: "Image Upload Failed" });
          }
        } catch (error) {
          responseReturn(res, 404, { error: error.message });
        }
      }
    });
  };
}

module.exports = new productControllers();
