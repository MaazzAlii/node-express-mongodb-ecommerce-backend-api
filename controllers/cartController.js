const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// @desc    Get the logged-in user's cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = catchAsyncErrors(async (req, res, next) => {
  const cart = await getOrCreateCart(req.user.id);
  res.status(200).json({ success: true, cart });
});

// @desc    Add a product to the cart (or increase quantity if already present)
// @route   POST /api/v1/cart
// @access  Private
exports.addToCart = catchAsyncErrors(async (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId) {
    return next(new ErrorHandler('productId is required', 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  const qty = Number(quantity) > 0 ? Number(quantity) : 1;
  const cart = await getOrCreateCart(req.user.id);

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    cart.items.push({ product: product._id, name: product.name, price: product.price, quantity: qty });
  }

  await cart.save();
  res.status(200).json({ success: true, cart });
});

// @desc    Update quantity of a cart item
// @route   PUT /api/v1/cart/:productId
// @access  Private
exports.updateCartItem = catchAsyncErrors(async (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || Number(quantity) < 1) {
    return next(new ErrorHandler('quantity must be at least 1', 400));
  }

  const cart = await getOrCreateCart(req.user.id);
  const item = cart.items.find((i) => i.product.toString() === req.params.productId);

  if (!item) {
    return next(new ErrorHandler('Item not found in cart', 404));
  }

  item.quantity = Number(quantity);
  await cart.save();
  res.status(200).json({ success: true, cart });
});

// @desc    Remove an item from the cart
// @route   DELETE /api/v1/cart/:productId
// @access  Private
exports.removeFromCart = catchAsyncErrors(async (req, res, next) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  res.status(200).json({ success: true, cart });
});

// @desc    Clear the entire cart
// @route   DELETE /api/v1/cart
// @access  Private
exports.clearCart = catchAsyncErrors(async (req, res, next) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.items = [];
  await cart.save();
  res.status(200).json({ success: true, cart });
});
