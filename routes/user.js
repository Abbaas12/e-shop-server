const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const { User } = require("../models/user");

router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");

  if (!userList) res.status(400).send("There is no user!");

  res.send(userList);
});

router.get(`/:id`, async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) res.status(400).send("There is no user.");
  res.status(200).send(user);
});

router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) return res.status(400).send("There is no user!");

  return res.status(200).send({ userCount });
});

router.post(`/`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();
  if (!user) res.status(400).send("User cannot be created!");
  res.status(201).send(user);
});

router.post(`/login`, async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const secret = process.env.secret;

  if (!user) {
    return res.status(400).send("The user's not found!");
  }
  if (user && bcrypt.compareSync(req.body.passwordHash, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      secret
    );
    return res.status(200).send({ email: user.email, token: token });
  } else {
    return res.status(400).send("Password is wrong!");
  }
});

router.post(`/register`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();
  if (!user) res.status(400).send("User cannot be created!");
  res.status(201).send(user);
});

router.delete(`/:id`, (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user)
        return res
          .status(200)
          .send({ success: true, message: "Successfully deleted." });
      else return res.status(400).send("The user not found!");
    })
    .catch((err) => res.status(500).send(err));
});

module.exports = router;
