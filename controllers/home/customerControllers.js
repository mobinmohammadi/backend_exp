const userModel = require("../../models/customerModel");
const bcrypt = require("bcrypt");
const formidable = require("formidable");
const { default: mongoose } = require("mongoose");
const { createToken } = require("../../utils/createToken");
const { responseReturn } = require("../../utils/response");
const SellerCustomerModel = require("../../models/chat/SellerCustomerModel");
const customerModel = require("../../models/customerModel");

class customerControllers {
  user_register = async (req, res) => {
    const { name, email, password } = req.body;

    const getuser = await userModel.findOne({ email });

    try {
      if (getuser) {
        responseReturn(res, 400, { error: "user is registred" });
      } else {
        const userInfo = await userModel.create({
          name,
          email,
          method: "manualy",
          password: await bcrypt.hash(password, 10),
        });

        await SellerCustomerModel.create({
          myId: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          method: userInfo.method,
        });

        const token = await createToken({
          id: userInfo.id,
          role: userInfo.role,
        });
        res.cookie("accessToken", token, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        responseReturn(res, 201, {
          token,
          userInfo,
          message: "Register Succussfully,welcom",
        });
      }
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  user_login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await customerModel.findOne({ email }).select("+password");

      if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          const token = await createToken({
            id: user.id,
            name: user.name,
            email: user.email,
            method: user.method,
          });

          res.cookie("accessToken", token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });

          responseReturn(res, 201, {
            token,
            userInfo: user,
            message: "Login SuccussFully",
          });
        } else {
          responseReturn(res, 400, { error: "password wrang" });
        }
      }
      responseReturn(res, 404, { error: "user not found" });
    } catch (error) {
      responseReturn(res, 404, { error: "user not found" });
    }
  };

  get_user = async (req, res) => {};
}
module.exports = new customerControllers();
