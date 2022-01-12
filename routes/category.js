const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { Category } = require("../models/category");

router.get(`/`, async (req, res) => {
  const categories = await Category.find();
  if (!categories) return res.status(500).send("There is no category.");
  res.status(200).send(categories);
});

router.get(`/:id`, async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(500).send("There is no category.");
  res.status(200).send(category);
});

router.post(`/`, async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });

  category = await category.save();
  if (!category)
    return res
      .status(400)
      .json({ success: false, message: "Category cannot be created!" });
  res.send(category);
});

router.put(`/:id`, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    res.status(500).send("Invalid category id!");
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true }
  );

  if (!category) return res.status(500).send("There is no category!");
  res.status(200).send(category);
});

router.delete(`/:id`, (req, res) => {
  Category.findByIdAndRemove(req.params.id)
    .then((category) => {
      if (category)
        return res
          .status(200)
          .json({ success: true, message: "This category is deleted." });
      else
        return res
          .status(400)
          .json({ success: false, message: "Category is not found." });
    })
    .catch((error) => res.status(404).json({ error }));
});

module.exports = router;
