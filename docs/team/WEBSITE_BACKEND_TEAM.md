# Revola Website & Backend Team Responsibilities

This document defines the functional scope and ownership areas for the Revola Website + Backend development team.

---

## 🎯 Functional Scope & Ownership

The Website & Backend team is directly responsible for:

1. **Web Application (`client/`)**:
   - Modern React 19 + TypeScript + Tailwind CSS v4 frontend interface.
   - User interfaces for Buyers, Sellers, Staff, and Administrators.
   - Appearance mode toggle (Light / Dark / System) with zero theme flash.
   - Responsive design for mobile, tablet, and desktop viewports.

2. **Backend API Services (`server/`)**:
   - High-performance Express.js REST API with comprehensive input validation.
   - Database modeling and geospatial indexing with MongoDB / Mongoose.

3. **Authentication & Identity**:
   - Email/Username + Password registration and login.
   - Secure Google OAuth 2.0 integration with automatic account linking (zero duplicate accounts).
   - JWT authentication via secure cookies and Authorization Bearer headers.
   - Profile management, password updates, and avatar uploads.

4. **Marketplace & Catalog Management**:
   - Public materials catalog with category filtering, condition tags, and search.
   - Seller inventory management (Create, Read, Update, Delete material listings).
   - Geocoded Adama supply yards, depots, and seller map points.

5. **Cart & Checkout Pipeline**:
   - User-isolated cart operations strictly separated from public catalog browsing.
   - Live inventory validation preventing stock overselling.

6. **Delivery Fee Calculation Engine**:
   - Dynamic delivery cost calculation using Adama geographical service area bounds.
   - Weight tiers, vehicle requirements, and weekend/weekday surge adjustments.

7. **Payment Processing & Verification**:
   - Chapa Ethiopian payment gateway integration with hosted checkout.
   - Webhook processing with HMAC-SHA256 signature verification.
   - Manual bank transfer receipt submission and staff verification queue.

8. **Order Lifecycle & Realtime Tracking**:
   - Order status state transitions (`PENDING_PAYMENT` → `CONFIRMED` → `PREPARING` → `IN_TRANSIT` → `DELIVERED`).
   - Live milestone tracking for buyers.
   - Seller payout calculations with marketplace commission deductions.

9. **Notifications System**:
   - Real-time / In-app notification creation for sales, payments, and delivery events.
   - Unread count badges and mark-all-read capabilities.

10. **Staff & Admin Management**:
    - Verification dashboards for manual bank receipts.
    - User management, platform audit logs, and payout releases.

---

## 🌿 Team Git Workflow

- **Base Branches**: `main` (Production), `develop` (Staging/Integration).
- **Feature Branches**:
  - `feature/web-auth`
  - `feature/web-marketplace`
  - `feature/web-checkout`
  - `feature/backend-orders`
  - `feature/backend-payment`
  - `feature/backend-delivery`
- Pull requests must be submitted against `develop` and reviewed before merging.
