const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { isAuthenticatedUser } = require('../middleware/auth');

const router = express.Router();

router
  .route('/cart')
  .get(isAuthenticatedUser, getCart)
  .post(isAuthenticatedUser, addToCart)
  .delete(isAuthenticatedUser, clearCart);

router
  .route('/cart/:productId')
  .put(isAuthenticatedUser, updateCartItem)
  .delete(isAuthenticatedUser, removeFromCart);

module.exports = router;
