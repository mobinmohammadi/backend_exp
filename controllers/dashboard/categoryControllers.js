const formidable = require("formidable");
const { responseReturn } = require("../../utils/response");
const categoryModel = require("../../models/categoryModel");
const cloudinary = require("cloudinary").v2;

class categoryControllers {
  category_add = async (req, res) => {
    const form = formidable();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        responseReturn(res, 404, { error: "something went error 😥" });
      } else {
        let { name } = fields;
        let { image } = files;
        name = name.trim();
        const slug = name.split(" ").join("/");

        cloudinary.config({
          cloud_name: process.env.cloud_name,
          api_key: process.env.api_key,
          api_secret: process.env.api_secret,
          secure: true,
        });

        try {
          const result = await cloudinary.uploader.upload(image.filepath, {
            folder: "categorys",
          });

          if (result) {
            const category = await categoryModel.create({
              name,
              slug,
              image: result.url,
            });

            responseReturn(res, 201, {
              category,
              message: "category added succussfully",
            });
          } else {
            responseReturn(res, 404, { error: "image upload erorr" });
          }
        } catch (error) {
          responseReturn(res, 500, { error: error.message });
        }
      }
    });
  };

  category_get = async (req, res) => {
    console.log(req.query);
    const { page, searchValue, parPage } = req.query;

    try {
      let skipPage = "";
      if (parPage && page) {
        skipPage = parseInt(parPage) * (parseInt(page) - 1);
      }
      if (searchValue) {
        const category = await categoryModel
          .find({
            $text: { $search: searchValue },
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel
          .find({
            $text: { $search: searchValue },
          })
          .countDocuments();

        responseReturn(res, 200, { category, totalCategory });
      } else if (searchValue && parPage && page) {
        const category = await categoryModel
          .find({})
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { category, totalCategory });
      } else if (searchValue === "" && parPage && page) {
        const category = await categoryModel
          .find({})
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { category, totalCategory });
      } else {
        const category = await categoryModel
          .find({})
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { category, totalCategory });
      }
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };
}

module.exports = new categoryControllers();
