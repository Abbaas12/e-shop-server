const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { OrderItem } = require("../models/orderItem");
const { Order } = require("../models/order");

router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 });
  if (!orderList) res.status(404).send("There is no order!");
  res.send(orderList);
});

router.get(`/get/userOrders/:userId`, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userId }).populate({
    path: "orderItems",
    populate: { path: "product", populate: "category" },
  });
  if (!userOrderList) res.status(400).send("You have no order!");
  res.status(200).send(userOrderList);
});

router.get(`/get/count`, async (req, res) => {
  const orderCount = await Order.countDocuments();
  if (orderCount) res.status(200).send({ orderCount });
  else res.status(404).send("There is no order!");
});

router.get(`/totalSales`, async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
  ]);
  if (!totalSales) res.status(404).send("The orders cannot be generated!");
  res.status(200).send({ totalSales: totalSales.pop().totalSales });
});

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });
  if (!order) return res.status(404).send("The order is not found!");
  return res.status(200).send(order);
});

router.post("/", async (req, res) => {
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        product: orderItem.product,
        quantity: orderItem.quantity,
      });
      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );

  const resultOrderItemsIds = await orderItemsIds;

  const totalPrices = await Promise.all(
    resultOrderItemsIds.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: resultOrderItemsIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
    dateOrdered: req.body.dateOrdered,
  });

  order = await order.save();

  if (!order) return res.status(500).send("Order is not availble!");
  return res.status(200).send(order);
});

router.put(`/:id`, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    res.status(500).send("Invalid order's Id!");
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );
  if (!order) res.status(400).send("The order cannot be updated!");
  res.status(200).send(order);
});

router.delete(`/:id`, (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndRemove(orderItem);
        });
        return res.status(200).send("The order's successfully deleted.");
      } else return res.status(404).send("Not found!");
    })
    .catch((err) => res.status(500).send(err));
});

module.exports = router;
