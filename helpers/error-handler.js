function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ message: "The user is not authenticated!" });
  }
  return res.status(500).send(err);
}

module.exports = errorHandler;
