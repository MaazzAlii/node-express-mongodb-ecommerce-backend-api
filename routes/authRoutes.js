const express = require('express');
const { registerUser, loginUser, getUserDetails, logout } = require('../controllers/authController');
const { isAuthenticatedUser } = require('../middleware/auth');

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/me').get(isAuthenticatedUser, getUserDetails);
router.route('/logout').get(isAuthenticatedUser, logout);

module.exports = router;
