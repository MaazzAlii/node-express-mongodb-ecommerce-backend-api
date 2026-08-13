# E-commerce API

A production-style Node.js e-commerce backend covering the first 4 hours of scope: **user authentication, product management, shopping cart, and orders** — built with Express and MongoDB/Mongoose, JWT auth, and a clean MVC architecture.

## Acceptance Criteria

- ✅ Auth middleware (`isAuthenticatedUser`) protecting all private routes, with role-based `authorizeRoles('admin')` for admin-only actions
- ✅ Product CRUD (public reads, admin-only writes) and Order CRUD (create/read for users, full management for admins)
- ✅ Clean MVC folder structure — models, controllers, routes, middleware, config, utils cleanly separated
- ✅ Environment variables (`.env`) used for all secrets: DB connection string, JWT secret

## Tech Stack

Express 4, Mongoose 8, jsonwebtoken, bcryptjs, cors, dotenv.

## Project Structure

```
ecommerce-api/
├── api/index.js            # Vercel serverless entry point
├── app.js                  # Express app instance (middleware, routes) — exported, not started here
├── server.js                # Entry point: connects DB, starts the listener, handles process-level errors
├── config/
│   └── db.js                # MongoDB connection (cached for serverless reuse)
├── models/
│   ├── User.js               # name, email, hashed password, role; JWT + password-compare methods
│   ├── Product.js            # name, description, price, category, stock, images, reviews, ratings
│   ├── Cart.js               # one cart per user, embedded items array
│   └── Order.js               # shippingInfo, orderItems, pricing breakdown, orderStatus
├── middleware/
│   ├── auth.js                # isAuthenticatedUser (JWT check) + authorizeRoles (role check)
│   ├── catchAsyncErrors.js    # wraps async controllers so errors reach the error handler
│   └── error.js               # centralized error-handling middleware
├── controllers/                # business logic per resource
├── routes/                     # Express routers per resource
└── utils/
    └── ErrorHandler.js         # custom Error subclass carrying an HTTP status code
```

## Setup

```bash
git clone <your-repo-url>
cd ecommerce-api
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev              # or: npm start
```

Server runs on `http://localhost:4000` by default.

## Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Local port (default 4000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret used to sign JWTs |
| `JWT_EXPIRE` | Token lifetime, e.g. `5d` |
| `NODE_ENV` | `development` or `production` |

## Routes

All routes are prefixed with `/api/v1`.

### Auth

| Method | Route | Access | Body |
|---|---|---|---|
| POST | `/register` | Public | `{ name, email, password }` |
| POST | `/login` | Public | `{ email, password }` |
| GET | `/me` | Private | — (Bearer token) |
| GET | `/logout` | Private | — |

Register/login return `{ success, user, token }`. Send the token as `Authorization: Bearer <token>` on every subsequent private request.

### Products

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/products` | Public | List all products. Supports `?keyword=` (name search) and `?category=` filters |
| GET | `/product/:id` | Public | Single product |
| GET | `/admin/products` | Admin | Unfiltered admin listing |
| POST | `/admin/product/new` | Admin | Create — `{ name, description, price, category, stock, images? }` |
| PUT | `/admin/product/:id` | Admin | Update (partial) |
| DELETE | `/admin/product/:id` | Admin | Delete |

### Cart (all private)

| Method | Route | Description |
|---|---|---|
| GET | `/cart` | Get the logged-in user's cart |
| POST | `/cart` | Add item — `{ productId, quantity? }` (increments quantity if already in cart) |
| PUT | `/cart/:productId` | Update quantity — `{ quantity }` |
| DELETE | `/cart/:productId` | Remove one item |
| DELETE | `/cart` | Clear the whole cart |

### Orders (all private)

| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/order/new` | User | `{ shippingInfo, orderItems?, taxPrice?, shippingPrice? }` — if `orderItems` is omitted, the order is built from the user's current cart, which is then cleared |
| GET | `/order/:id` | Owner or Admin | Single order |
| GET | `/orders/me` | User | Logged-in user's own orders |
| GET | `/admin/orders` | Admin | All orders + total revenue |
| PUT | `/admin/order/:id` | Admin | Update `orderStatus` (`Processing`/`Shipped`/`Delivered`/`Cancelled`) |
| DELETE | `/admin/order/:id` | Admin | Delete an order |

## How Auth Works

1. `POST /api/v1/register` or `/login` returns a JWT.
2. Every private route runs `isAuthenticatedUser`: reads `Authorization: Bearer <token>`, verifies it, loads the user, and attaches it as `req.user`.
3. Admin-only routes additionally run `authorizeRoles('admin')`, which checks `req.user.role`.
4. To test admin routes, manually set a user's `role` to `"admin"` in MongoDB Atlas (Data Explorer) after registering, since there's no public admin-signup endpoint by design.

## Error Handling

- `ErrorHandler` (in `utils/`) is a custom `Error` subclass carrying an HTTP status code.
- `catchAsyncErrors` wraps every async controller so thrown/rejected errors are forwarded to Express's error pipeline instead of needing `try/catch` everywhere.
- The centralized `error.js` middleware normalizes Mongoose `CastError`, `ValidationError`, duplicate-key errors, and JWT errors into consistent `{ success: false, message }` JSON responses.

## Quick Test with curl

```bash
# Register
curl -X POST http://localhost:4000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Maaz","email":"maaz@example.com","password":"secret123"}'

# Login (copy the returned token)
curl -X POST http://localhost:4000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maaz@example.com","password":"secret123"}'

# Add to cart (replace TOKEN and a real product _id)
curl -X POST http://localhost:4000/api/v1/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"productId":"<product_id>","quantity":2}'

# Place an order from the cart
curl -X POST http://localhost:4000/api/v1/order/new \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"shippingInfo":{"address":"123 Main St","city":"Rawalpindi","postalCode":"46000","country":"Pakistan","phoneNo":"03001234567"}}'
```

## Deployment (Vercel)

Pre-configured with `vercel.json` + `api/index.js`.

1. Push to GitHub.
2. Vercel → New Project → import the repo.
3. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `NODE_ENV=production`.
4. Deploy.

You'll need a MongoDB Atlas cluster (free tier is fine) — create a database user, allow network access from anywhere (`0.0.0.0/0`), and use that connection string as `MONGO_URI`.
