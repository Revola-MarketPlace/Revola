# Server Source Directory

- `config/`: Database connection, Adama service boundaries, and environment configs
- `controllers/`: Route handlers (Auth, Products, Cart, Orders, Payments, Notifications)
- `jobs/`: Background cron tasks and seed scripts
- `middleware/`: JWT authentication guards, role restrictions, error handlers
- `models/`: Mongoose schema definitions
- `routes/`: Express API route definitions
- `services/`: External payment providers, storage, and bot notifications
- `utils/`: Delivery calculators, AppError class, and asyncHandler
