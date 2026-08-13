const express = require('express');
const cors = require('cors');

const errorMiddleware = require('./middleware/error');
const connectDatabase = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB on each request in serverless environments (Vercel),
// and once at boot in traditional server environments.
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce API is running',
    routes: {
      auth: '/api/v1 (register, login, me, logout)',
      products: '/api/v1/products, /api/v1/product/:id, /api/v1/admin/product/...',
      cart: '/api/v1/cart',
      orders: '/api/v1/order/new, /api/v1/orders/me, /api/v1/admin/orders',
    },
  });
});

app.use('/api/v1', authRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', orderRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}` });
});

// Centralized error handler (must be last)
app.use(errorMiddleware);

module.exports = app;
