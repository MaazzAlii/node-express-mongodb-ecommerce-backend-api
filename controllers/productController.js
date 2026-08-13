const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');
const Product = require('../models/Product');

// @desc    Get all products (supports ?keyword= search and ?category= filter)
// @route   GET /api/v1/products
// @access  Public
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const filter = {};

  if (req.query.keyword) {
    filter.name = { $regex: req.query.keyword, $options: 'i' };
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: products.length, products });
});

// @desc    Get a single product
// @route   GET /api/v1/product/:id
// @access  Public
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  res.status(200).json({ success: true, product });
});

// @desc    Create a new product
// @route   POST /api/v1/admin/product/new
// @access  Private/Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  req.body.user = req.user.id;
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// @desc    Update a product
// @route   PUT /api/v1/admin/product/:id
// @access  Private/Admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, product });
});

// @desc    Delete a product
// @route   DELETE /api/v1/admin/product/:id
// @access  Private/Admin
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  await product.deleteOne();
  res.status(200).json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Get all products (admin listing, no filters)
// @route   GET /api/v1/admin/products
// @access  Private/Admin
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: products.length, products });
});
