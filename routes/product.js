const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const { Category } = require("../models/category");
const { Product } = require("../models/product");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("Invalid image type!");
    if (isValid) uploadError = null;
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.replace(" ", "_");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOption = multer({ storage });

router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories)
    filter = { category: req.query.categories.split(",") };

  const productList = await Product.find(filter).populate("category");
  if (!productList) return res.status(400).send("There is no product!");
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) return res.status(400).send("There is no product!");
  res.status(200).send(product);
});

router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) res.status(500).send("There is no product!");
  res.status(200).send({
    productCount,
  });
});

router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const featuredProduct = await Product.find({ isFeatured: true }).limit(
    +count
  );

  if (!featuredProduct) res.status(500).send("There is no featured product!");
  res.status(200).send(featuredProduct);
});

router.post(`/`, uploadOption.single("image"), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid category!");

  const file = req.file;
  if (!file) res.status(400).send("No image is requested!");

  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReview: req.body.numReview,
    isFeatured: req.body.isFeatured,
    dateCreated: req.body.dateCreated,
  });

  product = await product.save();
  if (!product) return res.status(400).send("Product cannot be created!");
  res.status(200).send(product);
});

router.put(`/:id`, uploadOption.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    res.status(500).send("Invalid product id!");
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid category!");

  const product = await Product.findById(req.params.id);
  if (!product) res.status(404).send("Invalid product!");

  const file = req.file;
  let imagePath;
  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    imagePath = `${basePath}${fileName}`;
  } else {
    imagePath = product.image;
  }

  const updateProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagePath,
      brand: req.body.brand,
      price: parseInt(req.body.price),
      category: req.body.category,
      countInStock: parseInt(req.body.countInStock),
      rating: req.body.rating,
      numReview: req.body.numReview,
      isFeatured: req.body.isFeatured,
      dateCreated: req.body.dateCreated,
    },
    { new: true }
  );

  if (!updateProduct) return res.status(500).send("Product cannot be updated!");
  res.status(200).send(updateProduct);
});

router.put(
  `/gallery/:id`,
  uploadOption.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      res.status(500).send("Invalid product id!");

    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!product) res.status(400).send("Product cannot be updated!");
    res.status(200).send(product);
  }
);

router.delete(`/:id`, (req, res) => {
  Product.findByIdAndDelete(req.params.id)
    .then((product) => {
      if (!product) res.status(500).send("There is no product!");
      res
        .status(200)
        .send({ success: true, message: "Product has been deleted." });
    })
    .catch((err) => res.status(400).json({ error: err }));
});

module.exports = router;
