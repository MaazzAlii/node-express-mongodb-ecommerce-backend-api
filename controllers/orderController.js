const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// @desc    Create a new order. Uses orderItems from the body if provided,
//          otherwise builds the order from the user's current cart and clears it.
// @route   POST /api/v1/order/new
// @access  Private
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const { shippingInfo, taxPrice = 0, shippingPrice = 0 } = req.body;
  let { orderItems } = req.body;

  if (!shippingInfo) {
    return next(new ErrorHandler('shippingInfo is required', 400));
  }

  if (!orderItems || orderItems.length === 0) {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart || cart.items.length === 0) {
      return next(new ErrorHandler('Cart is empty and no orderItems were provided', 400));
    }
    orderItems = cart.items.map((item) => ({
      product: item.product,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));
  }

  const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPrice = itemsPrice + Number(taxPrice) + Number(shippingPrice);

  const order = await Order.create({
    shippingInfo,
    orderItems,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    user: req.user.id,
  });

  // Clear the cart once the order has been placed from it
  await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });

  res.status(201).json({ success: true, order });
});

// @desc    Get a single order by ID (owner or admin only)
// @route   GET /api/v1/order/:id
// @access  Private
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    return next(new ErrorHandler('Order not found', 404));
  }

  const isOwner = order.user._id.toString() === req.user.id;
  if (!isOwner && req.user.role !== 'admin') {
    return next(new ErrorHandler('Not authorized to view this order', 403));
  }

  res.status(200).json({ success: true, order });
});

// @desc    Get the logged-in user's orders
// @route   GET /api/v1/orders/me
// @access  Private
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @desc    Get all orders
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  const totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  res.status(200).json({ success: true, count: orders.length, totalAmount, orders });
});

// @desc    Update order status
// @route   PUT /api/v1/admin/order/:id
// @access  Private/Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler('Order not found', 404));
  }

  if (req.body.orderStatus) {
    order.orderStatus = req.body.orderStatus;
    if (req.body.orderStatus === 'Delivered') {
      order.deliveredAt = Date.now();
    }
  }

  await order.save();
  res.status(200).json({ success: true, order });
});

// @desc    Delete an order
// @route   DELETE /api/v1/admin/order/:id
// @access  Private/Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler('Order not found', 404));
  }

  await order.deleteOne();
  res.status(200).json({ success: true, message: 'Order deleted successfully' });
});
