const cartModel = require("../../models/cartModel");
const { responseReturn } = require("../../utils/response");
const moment = require("moment/moment");
const { sendNewOrderNotification } = require("../../utils/telegram");

const customerOrder = require("../../models/customerOrder");
const authOrderModel = require("../../models/authOrder");

const sendTelegramMessage = require("../../utils/telegram");

class oredrsControllers {
  paymentCheck = async (id) => {
    try {
      const order = await customerOrder.findById(id);

      if (!order) return false;

      if (order.payment_status === "unpaid") {
        await customerOrder.findByIdAndUpdate(id, {
          delivery_status: "cancelled",
        });

        await authOrderModel.updateMany(
          {
            orderId: id,
          },
          {
            delivery_status: "cancelled",
          },
        );
      }

      return true;
    } catch (error) {
      console.log("Payment Check Error:", error.message);
      return false;
    }
  };

  place_order = async (req, res) => {
    const { price, products, shipping_fee, shippingInfo, userId } = req.body;

    let authorOrderData = [];
    let cardId = [];

    const tempDate = moment(Date.now()).format("LLL");

    let customerOrderProduct = [];

    for (let i = 0; i < products.length; i++) {
      const pro = products[i].products;

      for (let j = 0; j < pro.length; j++) {
        const tempCusPro = {
          ...pro[j].productInfo,
          quantity: pro[j].quantity,
        };

        customerOrderProduct.push(tempCusPro);

        if (pro[j]._id) {
          cardId.push(pro[j]._id);
        }
      }
    }

    try {
      // Create Main Order
      const order = await customerOrder.create({
        customerId: userId,

        shippingInfo,

        products: customerOrderProduct,

        price: price + shipping_fee,

        payment_status: "unpaid",

        delivery_status: "pending",

        date: tempDate,
      });

      // Create Seller Orders
      for (let i = 0; i < products.length; i++) {
        const pro = products[i].products;

        const pri = products[i].price;

        const sellerId = products[i].sellerId;

        let storePor = [];

        for (let j = 0; j < pro.length; j++) {
          const tempPro = {
            ...pro[j].productInfo,
            quantity: pro[j].quantity,
          };

          storePor.push(tempPro);
        }

        authorOrderData.push({
          orderId: order.id,

          sellerId,

          products: storePor,

          price: pri,

          payment_status: "unpaid",

          shippingInfo: "Easy Main Warehouse",

          delivery_status: "pending",

          date: tempDate,
        });
      }

      await authOrderModel.insertMany(authorOrderData);

      // Send Telegram Notification
      try {
        await sendNewOrderNotification(order);

        console.log("Telegram order notification sent");
      } catch (error) {
        console.error("Telegram notification error:", error.message);
      }

      // Delete Cart Products
      for (let k = 0; k < cardId.length; k++) {
        await cartModel.findByIdAndDelete(cardId[k]);
      }

      // Check Payment After 15 Seconds
      setTimeout(() => {
        this.paymentCheck(order.id);
      }, 15000);

      // Response
      return responseReturn(res, 200, {
        message: "Order Placed Success",

        orderId: order.id,
      });
    } catch (error) {
      console.log("Order Error:", error.message);

      return responseReturn(res, 500, {
        message: "Order Failed",
      });
    }
  };
}

module.exports = new oredrsControllers();
