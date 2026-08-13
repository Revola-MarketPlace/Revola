# Adama Materials Marketplace (Ethio-Escrow)

A full-stack, production-ready MERN marketplace application designed for buying, selling, and delivering reusable construction and raw materials in Adama City, Ethiopia. Features dynamic delivery fee calculations, escrow payout controls, and an integrated **Telegram Verifier Bot** supporting both 10-digit Telebirr reference code and receipt screenshot verification.

---

## 🌟 Overview & Key Features

### 🏢 Multi-Role Portals
- **Buyers**: Browse approved construction materials, calculate dynamic delivery fees in real-time, link to Telegram bot for Telebirr / Bank Transfer receipt submission (text reference or screenshot upload), track order progress, and review products.
- **Sellers**: Manage inventory, post new materials for admin approval, track revenue, and monitor escrow payout eligibility (payouts held until delivery confirmation).
- **Staff (Finance & Logistics)**: Verify manual bank transfers, assign couriers, and update dispatch/delivery milestones.
- **Administrators**: Moderate users, approve seller registrations, review pending material listings, verify payment receipts in the **Bank Verification Portal**, handle dispute resolutions, monitor audit logs, and trigger test state resets.

### 📱 Dual-Mode Telegram Receipt Verification Bot
- **Interactive Verification Wizard**: Guides buyers step-by-step through selecting payment methods (Telebirr, CBE, CBO, Awash, Dashen, BoA, Birhan, etc.).
- **Choice of Verification**:
  1. **10-Digit Telebirr / Bank Ref Code**: Validates transaction code length and submits for admin review.
  2. **Receipt Screenshot / Photo Upload**: Allows buyers to upload receipt photos directly in Telegram; the bot forwards the photo directly to authorized admin Telegram chats alongside inline `[Approve (PAID)]` / `[Reject (FAILED)]` action buttons.
- **Real-Time Push Alerts**: Admin actions in Telegram or web portal instantly notify the buyer's Telegram chat.

### 🚚 Dynamic Delivery Fee Calculation
Automatically calculated before checkout based on:
1. **Delivery Zone**: Central Adama (70 ETB), Mid-Range (120 ETB), Outskirts/Industrial (180 ETB).
2. **Item Bulk Quantity**: Base fee covers ≤5 items; 6–15 items (+15 ETB/item); >15 items (+25 ETB/item).
3. **Weekend Surge**: Automatically applies +25% surge on Saturday and Sunday.

---

## 🔀 Random File & Module Assignment (3 Collaborators)

To enable seamless parallel development across 3 team members without Git merge conflicts, project files have been randomly distributed across 3 collaborator responsibility domains:

```text
               ┌─────────────────────────────────────────────────────────┐
               │    Adama Materials Marketplace - GitHub Repository      │
               └────────────────────────────┬────────────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │                                  │                                  │
  👨‍💻 COLLABORATOR 1                 👨‍💻 COLLABORATOR 2                 👨‍💻 COLLABORATOR 3
  (Checkout, Admin & Telegram)       (Catalog, Orders & Payments)       (Bot, Delivery & Landing)
```

### 📋 Random Collaborator File Matrix

| Collaborator | Primary Domain | Randomly Assigned Files | Key Responsibilities |
|---|---|---|---|
| **Collaborator 1** | **Checkout & Admin Verification** | • `client/src/pages/CheckoutPage.tsx`<br>• `client/src/pages/AdminDashboard.tsx`<br>• `server/src/models/Payment.js`<br>• `server/src/controllers/orderController.js`<br>• `server/src/services/TelegramBotService.js`<br>• `server/src/routes/paymentRoutes.js`<br>• `client/src/context/CartContext.tsx` | Order checkout logic, Admin Bank Verification UI tab, Payment Mongoose schemas, and Telegram push notifications. |
| **Collaborator 2** | **Catalog, Orders & Security** | • `client/src/pages/CatalogPage.tsx`<br>• `client/src/pages/SellerDashboard.tsx`<br>• `server/src/controllers/paymentController.js`<br>• `server/src/models/Order.js`<br>• `server/src/controllers/productController.js`<br>• `server/src/middleware/auth.js`<br>• `client/src/services/api.ts` | Material catalog views, seller inventory, manual/online payment verification controllers, Order schemas, and JWT authentication middleware. |
| **Collaborator 3** | **Bot, Delivery & Landing UI** | • `bot/telegram_verifier_bot.py`<br>• `client/src/pages/LandingPage.tsx`<br>• `client/src/pages/StaffDashboard.tsx`<br>• `server/src/utils/deliveryFeeCalculator.js`<br>• `server/src/models/User.js`<br>• `server/src/services/PaymentService.js`<br>• `README.md` | Telegram Python bot wizard, dynamic delivery fee algorithm, landing page UI, staff dispatch views, and deployment documentation. |

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.10+ (for Telegram verifier bot)
- **MongoDB**: Local MongoDB or free MongoDB Atlas URI

### 2. Environment Configuration
Create a `.env` file in `server/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/adama-marketplace
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

Create `.env` inside `bot/`:
```env
MARKETPLACE_API_URL=http://localhost:5000/api/v1
STAFF_EMAIL=staff.finance@marketplace.com
STAFF_PASSWORD=StaffPass123
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### 3. Start Application
```powershell
# 1. Start Server (Express API on port 5000)
cd server
npm install
node src/server.js

# 2. Start Client (Vite Dev Server on port 5173 - in 2nd Terminal)
cd client
npm install
npm run dev

# 3. Start Telegram Bot (Python Bot - in 3rd Terminal)
cd bot
py telegram_verifier_bot.py
```

---

## 🌐 How to Deploy to Production

### Step 1: Database Deployment (MongoDB Atlas)
1. Register a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Obtain your `mongodb+srv://<username>:<password>@cluster.mongodb.net/adama_marketplace` URI.
3. Whitelist Network Access (`0.0.0.0/0`).

### Step 2: Backend API Deployment (Render / Railway / DigitalOcean)
1. Create a new Web Service pointing to the repository.
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `node src/server.js`
5. Set Production Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGO_URI=your_mongodb_atlas_uri`
   - `JWT_SECRET=your_production_secret`
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`
   - `TELEGRAM_BOT_TOKEN=your_telegram_bot_token`

### Step 3: Frontend Deployment (Vercel / Netlify)
1. Import repository into Vercel/Netlify.
2. Root Directory: `client`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variable:
   - `VITE_API_URL=https://your-backend-api.onrender.com/api/v1`

### Step 4: Telegram Bot Deployment (Background Worker)
1. Deploy `bot/` as a Background Worker on Render/Railway or a VPS (`systemd` service).
2. Start Command: `python telegram_verifier_bot.py`
3. Environment Variables:
   - `MARKETPLACE_API_URL=https://your-backend-api.onrender.com/api/v1`
   - `STAFF_EMAIL=staff.finance@marketplace.com`
   - `STAFF_PASSWORD=StaffPass123`
   - `TELEGRAM_BOT_TOKEN=your_telegram_bot_token`

---

## 🔑 Preloaded Test Credentials

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@marketplace.com` | `AdminPass123` | Full control, Bank Verification Tab, Reset Stats |
| **Staff (Finance)** | `staff.finance@marketplace.com` | `StaffPass123` | Payment Review & Verification |
| **Staff (Logistics)** | `staff.logistics@marketplace.com` | `StaffPass123` | Delivery Assignments & Tracking |
| **Seller 1** | `seller1@marketplace.com` | `SellerPass123` | Material Listings & Escrow Payouts |
| **Buyer 1** | `buyer1@marketplace.com` | `BuyerPass123` | Checkout & Telegram Verification |

---

## 📦 Deployment Archive

The complete deployment archive containing all updated source files is stored at:
`AdamaMaterials_Marketplace_v1.0_Deploy.zip` and `managed-marketplace.zip` in the root workspace.
