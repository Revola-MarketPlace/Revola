# Revola Website + Backend Architecture

This document describes the architectural layout of the Revola platform.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       Client Tier                           │
│  React 19 + TypeScript + Tailwind v4 (`client/`)            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                       Service Tier                          │
│  Express.js API Engine with JWT & RBAC (`server/`)          │
│  - Auth Controller (Email/Password & Google OAuth)          │
│  - Product & Catalog Management                             │
│  - Cart & Checkout Pipeline                                 │
│  - Dynamic Delivery Fee Engine (Adama Geocoding)            │
│  - Payment Verification Engine (Chapa / Bank Transfer)      │
│  - Notifications & Realtime Event Dispatch                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
┌──────────────────────────────▼──────────────────────────────┐
│                       Database Tier                         │
│  MongoDB Atlas (Document Store & Geospatial Indexing)       │
└─────────────────────────────────────────────────────────────┘
```
