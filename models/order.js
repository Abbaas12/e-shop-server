const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
  shippingAddress1: {
    type: String,
    required: true,
  },
  shippingAddress2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  zip: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
  },
  totalPrice: {
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dateOrdered: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

orderSchema.set("toJSON", {
  virtuals: true,
});

exports.Order = mongoose.model("Order", orderSchema);

// {
//   "orderItems":[{
//     "product": "61b2bc4f7e963e746932fc74",
//     "quantity": 3
//   },{
//     "product": "61b2bcb32f69d0edd07aabeb",
//     "quantity": 5
//   }],
//   "shippingAddress1": "street1,No.2,",
//   "shippingAddress2":"",
//   "city": "yangon",
//   "zip":"001121",
//   "country": "myanmar",
//   "phone": 883927494,
//   "status": "",
//   "totalPrice": 1000,
//   "user":"61b40d76dbbfd0b122bf0afd",

// }
