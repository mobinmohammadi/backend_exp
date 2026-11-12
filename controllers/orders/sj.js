// ─────────────────────────────────────────────────────────────
// 📦 Import مدل‌ها و ابزارهای مورد نیاز
// ─────────────────────────────────────────────────────────────

// مدل سبد خرید (Cart) — برای پاک کردن آیتم‌های خریداری‌شده بعد از ثبت سفارش
const cartModel = require("../../models/cartModel");

// مدل محصولات (Product) — برای کم کردن موجودی، چک قیمت واقعی، یا populate
const productModel = require("../../models/productModel");

// تابع کمکی برای برگردوندن پاسخ استاندارد به کلاینت (ساختار یکسان برای همه پاسخ‌ها)
const { responseReturn } = require("../../utils/response");

// کتابخانه تاریخ/زمان — برای گرفتن تاریخ ثبت سفارش به فرمت خوانا
const moment = require("moment");


// ─────────────────────────────────────────────────────────────
// 🏛️ تعریف کلاس کنترلر سفارش‌ها
// ─────────────────────────────────────────────────────────────
class ordersController {


  place_order = async (req, res) => {

    console.log("🔥 place_order HIT");

    console.log("body:", JSON.stringify(req.body, null, 2));


    const { price, products, shipping_fee, shippingInfo, userId } = req.body;


    try {

      // آرایه سفارش‌های نهایی — به ازای هر فروشنده یک آبجکت سفارش داخلش push می‌شود
      const authorOrderData = [];

      // آرایه آیدی محصولات خریداری‌شده — بعداً از سبد خرید پاک می‌شوند
      const cartIds = [];

      // ─────────────────────────────────────────────
      // 🔁 حلقه بیرونی: روی هر گروه فروشنده iterate می‌کند
      // هر sellerGroup = { sellerId, shopName, price, products: [...] }
      // ─────────────────────────────────────────────
      for (const sellerGroup of products) {

        // لاگ دیباگ: اسم و آیدی فروشنده فعلی
        // "🏪 seller:" → شناسه بصری در ترمینال
        console.log("🏪 seller:", sellerGroup.shopName, sellerGroup.sellerId);

        // آرایه موقت برای محصولات همین فروشنده — بعداً داخل سفارش این فروشنده قرار می‌گیرد
        const orderProducts = [];

        // ─────────────────────────────────────────────
        // 🔁 حلقه داخلی: روی محصولات همین فروشنده iterate می‌کند
        // دقت: sellerGroup.products (نه sellerGroup!) — چون sellerGroup یک آبجکت است نه آرایه
        // ─────────────────────────────────────────────
        for (const item of sellerGroup.products) {

          // لاگ دیباگ: هر محصول با دو فاصله قبلش (نشان‌دهنده تودرتویی)
          console.log("  📦 item:", item);

          // فقط اطلاعات لازم برای سفارش را از محصول برمی‌داریم:
          // productId → آیدی محصول در دیتابیس (snapshot از قیمت را نگه می‌داریم)
          // quantity  → تعداد خریداری‌شده
          // price     → قیمت واحد در لحظه خرید (اگر بعداً تغییر کند، سفارش دست‌نخورده می‌ماند)
          orderProducts.push({
            productId: item._id,
            quantity: item.quantity,
            price: item.price,
          });

          // آیدی محصول را در cartIds جمع می‌کنیم
          // بعد از ثبت موفق سفارش، این آیتم‌ها باید از سبد کاربر پاک شوند
          // ⚠️ اگر مدل cart شما _id جداگانه برای هر آیتم سبد دارد، item.cartId را push کن نه item._id
          cartIds.push(item._id); // یا cartId اگر داری
        }

        // ─────────────────────────────────────────────
        // 🧾 ساخت آبجکت سفارش برای این فروشنده و اضافه کردن به لیست نهایی
        // ─────────────────────────────────────────────
        authorOrderData.push({

          // آیدی فروشنده — برای اینکه پنل فروشنده بتواند سفارش‌های خودش را ببیند
          sellerId: sellerGroup.sellerId,

          // اسم فروشگاه — برای نمایش در تاریخچه سفارش کاربر (بدون نیاز به join)
          shopName: sellerGroup.shopName,

          // آرایه محصولات این فروشنده (که بالا ساختیم)
          products: orderProducts,

          // مبلغ کل محصولات این فروشنده (بدون ارسال)
          // ⚠️ بهتر است در بک‌اند دوباره محاسبه شود تا کاربر نتواند قیمت را دستکاری کند:
          // price: orderProducts.reduce((s, p) => s + p.price * p.quantity, 0)
          price: sellerGroup.price,

          // هزینه ارسال — shorthand برای shipping_fee: shipping_fee
          shipping_fee,

          // آدرس کامل تحویل — shorthand برای shippingInfo: shippingInfo
          shippingInfo,

          // فقط id کاربر را ذخیره می‌کنیم، نه کل آبجکت JWT
          // چون iat/exp بعد از انقضا بی‌معنی می‌شوند و name/email ممکن است تغییر کنند
          userId: userId.id, // ← از توکن، فقط id

          // تاریخ ثبت سفارش به فرمت خوانا (مثلاً: "November 12, 2026 3:41 PM")
          // Date.now() → میلی‌ثانیه فعلی | moment(...) → آبجکت تاریخ | .format("LLL") → رشته خوانا
          date: moment(Date.now()).format("LLL"),
        });
      }
      // پایان حلقه بیرونی (روی فروشنده‌ها)

      // لاگ آرایه نهایی سفارش‌ها — باید به تعداد فروشنده‌های متفاوت در سبد، آبجکت داشته باشد
      console.log("✅ authorOrderData:", authorOrderData);

      // لاگ آیدی محصولات خریداری‌شده — برای پاک کردن از سبد
      console.log("🛒 cartIds:", cartIds);

      // ─────────────────────────────────────────────
      // 💾 TODO: عملیات دیتابیس (باید فعال شود)
      // ─────────────────────────────────────────────

      // درج همه سفارش‌ها یک‌جا در collection orders
      // insertMany سریع‌تر از حلقه create است (یک round-trip به دیتابیس)
      // await orderModel.insertMany(authorOrderData);

      // پاک کردن آیتم‌های خریداری‌شده از سبد خرید کاربر
      // $in یعنی «هر آیتمی که _idاش در این آرایه باشد»
      // await cartModel.deleteMany({ _id: { $in: cartIds } });

      // ⚠️ این دو باید در یک transaction باشند تا اگر یکی شکست خورد، دیگری rollback شود
      // ⚠️ همچنین باید موجودی محصولات کم شود (productModel.updateOne با $inc: { stock: -quantity })
      //    و اگر موجودی کافی نبود، خطا برگردد — این بخش در کد نیست

      // ─────────────────────────────────────────────
      // ✅ پاسخ موفق به کلاینت
      // ─────────────────────────────────────────────
      return responseReturn(res, 201, {
        // 201 = Created (استاندارد HTTP برای ساخت منبع جدید، نه 200 که OK عمومی است)
        // message → پیام موفقیت
        // orders  → سفارش‌های ساخته‌شده تا فرانت‌اند آیدی‌ها را بگیرد
        message: "Order placed successfully",
        orders: authorOrderData,
      });

    } catch (error) {
      // ─────────────────────────────────────────────
      // ❌ مدیریت خطا — اگر هر جای try خطا رخ داد (مثلاً products undefined بود)
      // ─────────────────────────────────────────────

      // لاگ کامل خطا در ترمینال سرور — برای دیباگ حیاتی است
      // بدون این خط، فقط کلاینت خطا می‌بیند و تو نمی‌فهمی چرا
      console.log("❌ error:", error);

      // پاسخ خطا به کلاینت
      // 500 = Internal Server Error (خطای سمت سرور)
      // ⚠️ در production نباید error.message خام فرستاده شود
      //    چون ممکن است اطلاعات حساس (نام collection، ساختار DB) لو بدهد
      //    در production پیام عمومی مثل "Something went wrong" بفرست و جزئیات را فقط لاگ کن
      return responseReturn(res, 500, { error: error.message });
    }
  };
}

// ─────────────────────────────────────────────────────────────
// 📤 Export یک instance از کلاس (نه خود کلاس)
// دلیل: در router می‌توانی مستقیم ordersController.place_order را پاس بدهی بدون new
// این الگوی رایج در Express است
// ─────────────────────────────────────────────────────────────
module.exports = new ordersController();