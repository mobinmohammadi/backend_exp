const adminModel = require("../models/adminModel");
const SellerCustomerModel = require("../models/chat/SellerCustomerModel");
const sellerModel = require("../models/sellerModel");
const { responseReturn } = require("../utils/response");
const bcrypt = require("bcrypt");
const { createToken } = require("../utils/createToken");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
const { default: mongoose } = require("mongoose");
const userModel = require("../models/customerModel");
const customerModel = require("../models/customerModel");
class authControllers {
  admin_login = async (req, res) => {
    const { email, password } = req.body;

    try {
      const admin = await adminModel.findOne({ email }).select("+password");

      if (admin) {
        const match = await bcrypt.compare(password, admin.password);
        if (match) {
          const token = await createToken({
            id: admin.id,
            role: admin.role,
          });
          res.cookie("accessToken", token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          responseReturn(res, 200, { token, message: "login is successfuly" });
        } else {
          responseReturn(res, 401, { message: "Password Is Wrong" });
        }
      } else {
        responseReturn(res, 404, { error: "Admin Is Not Found" });
      }
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  seller_register = async (req, res) => {
    const { email, name, password } = req.body;

    try {
      const getUser = await sellerModel.findOne({ email });
      if (getUser) {
        console.log(getUser);

        responseReturn(res, 404, { error: "Email Already Exist" });
      } else {
        const seller = await sellerModel.create({
          sellerId: new mongoose.Types.ObjectId(),
          name,
          email,
          password: await bcrypt.hash(password, 10),
          image: "",
          method: "manualy",
          shopInfo: {},
        });
        console.log(seller);
        await SellerCustomerModel.create({
          myId: seller.id,
        });
        const token = await createToken({ id: seller.id, role: seller.role });
        res.cookie("accessToken", token, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        responseReturn(res, 201, { token, message: "Register SuccessFully" });
      }
    } catch (error) {
      responseReturn(res, 500, { erorr: error.message });
    }
  };

  seller_login = async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    try {
      const seller = await sellerModel.findOne({ email }).select("+password");
      if (seller) {
        const match = await bcrypt.compare(password, seller.password);
        if (match) {
          const token = await createToken({
            id: seller.id,
            role: seller.role,
          });
          res.cookie("accessToken", token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          responseReturn(res, 200, { token, message: "login is successfuly" });
        } else {
          responseReturn(res, 401, { message: "Password Is Wrong" });
        }
      } else {
        responseReturn(res, 404, { message: "User Is Not Found" });
      }
    } catch (error) {
      console.error("seller_login error:", error);
      return responseReturn(res, 500, { error: "Internal server error" });
    }
  };

  getUser = async (req, res) => {
    const { id, role } = req;
    try {
      if (role === "admin") {
        const admin = await adminModel.findById(id);
        console.log("admin", admin);

        responseReturn(res, 200, { userInfo: admin });
      }
      if (role === "seller") {
        const seller = await sellerModel.findById(id);
        responseReturn(res, 200, { userInfo: seller });
      }
      if (role === "user") {
        const user = await customerModel.findById(id);
        responseReturn(res, 200, { userInfo: user });
      }
    } catch (error) {
      responseReturn(res, 500, { erorr: "Internal Server Error 😣 " });
    }
  };

  update_profail_seller = async (req, res) => {
    const form = formidable();

    form.parse(req, async (err, field, files) => {
      const sellerId = req.id;

      const { image } = files;
      // console.log(sellerId);

      try {
        if (image) {
          cloudinary.config({
            cloud_name: process.env.cloud_name,
            api_key: process.env.api_key,
            api_secret: process.env.api_secret,
            secure: true,
          });

          const result = await cloudinary.uploader.upload(image.filepath, {
            folder: "profail-seller",
          });
          console.log(result.url);

          if (result) {
            // const { image } = await sellerModel.findById(sellerId);

            await sellerModel.findByIdAndUpdate(sellerId, {
              image: result.url,
              new: true,
            });
            const userInfo = await sellerModel.findById(sellerId);
            responseReturn(res, 201, {
              userInfo,
              message: "succussfuly image update 😎",
            });
          } else {
            responseReturn(res, 404, { message: "upload Image filed 😥" });
          }
        }
      } catch (error) {
        responseReturn(res, 500, { message: "internall Server Errorrrr 😭" });
      }
    });
  };

  update_shop_seller = async (req, res) => {
    console.log(req.body);
    const { division, district, shopname, sub_district } = req.body;
    const sellerId = req.id;
    try {
      await sellerModel.findByIdAndUpdate(sellerId, {
        shopInfo: {
          division,
          district,
          shopname,
          sub_district,
        },
        new: true,
      });

      const userInfo = await sellerModel.findById(sellerId);

      responseReturn(res, 200, {
        userInfo,
        message: "succussfully update details shop 😎",
      });
    } catch (error) {
      responseReturn(res, 500, { message: "internall Server Errorrrr 😭" });
    }
  };


}
module.exports = new authControllers();
