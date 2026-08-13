// Wraps async controller functions so rejected promises are forwarded to next(),
// removing the need for try/catch in every controller.
module.exports = (theFunc) => (req, res, next) => {
  Promise.resolve(theFunc(req, res, next)).catch(next);
};
