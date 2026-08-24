# Revola — Managed Marketplace Platform for Reusable & Reclaimed Materials

Welcome to the official **Revola Website & Backend** team repository.

Revola is a managed marketplace connecting contractors, builders, and recyclers in Adama, Ethiopia to source and trade salvaged construction materials (metals, lumber, masonry, electrical, and plastics).

---

## 🏗️ Repository Structure

```text
Revola/
├── client/              # Vite + React 19 + TypeScript + Tailwind CSS v4 Website
├── server/              # Node.js + Express + Mongoose REST API Backend
├── bot/                 # Telegram verification bot architecture & configuration
├── docs/                # Architecture, API specifications, and team guidelines
└── .github/             # GitHub Actions CI/CD workflows and PR templates
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB or MongoDB Atlas URI

### 2. Website Setup (`client/`)
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### 3. Backend Setup (`server/`)
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

---

## 🔒 Security Policy
- Never commit real credentials, database URIs, or payment secret keys.
- Use `.env.example` files with empty placeholder templates.
- Follow team PR guidelines before merging into `develop` or `main`.
