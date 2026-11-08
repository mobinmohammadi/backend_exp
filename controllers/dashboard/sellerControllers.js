const formidable = require("formidable");
const { responseReturn } = require("../../utils/response");
const sellerModel = require("../../models/sellerModel");
const cloudinary = require("cloudinary").v2;

class sellersControllers {
  get_sellers = async (req, res) => {
    const { page, searchValue, parPage } = req.query;

    try {
      let skipPage = "";
      if (parPage && page) {
        skipPage = parseInt(parPage) * (parseInt(page) - 1);
      }

      if (searchValue) {
        const sellers = await sellerModel
          .find({
            $text: { $search: searchValue },
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalSellers = await sellerModel
          .find({
            $text: { $search: searchValue },
          })
          .countDocuments();
        responseReturn(res, 200, { sellers, totalSellers });
      } else if (searchValue && parPage && page) {
        const sellers = await sellerModel
          .find({})
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalSellers = await sellerModel.find({}).countDocuments();
        responseReturn(res, 200, { sellers, totalSellers });
      } else if (searchValue === "" && parPage && page) {
        const sellers = await sellerModel
          .find({})
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalSellers = await sellerModel.find({}).countDocuments();
        responseReturn(res, 200, { sellers, totalSellers });
      } else {
        const sellers = await sellerModel
          .find({})
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalSellers = await sellerModel.find({}).countDocuments();
        responseReturn(res, 200, { sellers, totalSellers });
        console.log("seller ==> ", sellers);
      }
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  get_sellers_requsts = async (req, res) => {
    const { page, searchValue, parPage } = req.query;
    const skipPage = parseInt(parPage) * (parseInt(page) - 1);

    try {
      if (searchValue) {
        const sellers = await sellerModel
          .find({
            status: "pending",
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalSellers = await sellerModel
          .find({
            status: "pending",
          })
          .countDocuments();

        responseReturn(res, 200, { sellers, totalSellers });
      } else {
        const sellers = await sellerModel
          .find({
            status: "pending",
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalSellers = await sellerModel
          .find({
            status: "pending",
          })
          .countDocuments();

        responseReturn(res, 200, { sellers, totalSellers });
      }
    } catch (error) {
      responseReturn(res, 404, { message: error.message });
    }
  };
  get_seller_details = async (req, res) => {
    console.log(req);
    const { sellerId } = req.params;
    console.log(sellerId);

    try {
      const sellerInfo = await sellerModel.findById(sellerId);

      responseReturn(res, 200, { sellerInfo });
      console.log("seller Info ==>", sellerInfo);
    } catch (error) {
      responseReturn(res, 404, { message: error.message });
    }
  };

  change_status_seller = async (req, res) => {
    const { sellerId, status } = req.body;
    console.log(req);

    try {
      await sellerModel.findByIdAndUpdate(sellerId, {
        status,
      });
      const sellerInfo = await sellerModel.findById(sellerId);
      console.log("sellerInfo ==> ", sellerInfo);

      responseReturn(res, 200, { sellerInfo });
    } catch (error) {
      responseReturn(res, 500, { message: error.message });
    }
  };
}

module.exports = new sellersControllers();
