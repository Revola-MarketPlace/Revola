# Contributing to Revola Website & Backend

Please review the contribution standards below before submitting code.

---

## 🌿 Git Branching Strategy

1. **Base Branches**:
   - `main` — Production release branch. Direct commits are restricted.
   - `develop` — Active integration branch for sprint deliverables.

2. **Feature Branch Convention**:
   - `feature/web-<feature-name>` (e.g. `feature/web-auth`, `feature/web-marketplace`)
   - `feature/backend-<feature-name>` (e.g. `feature/backend-orders`, `feature/backend-payment`)
   - `fix/<area>-<issue>` (e.g. `fix/cart-sync`)

3. **Pull Requests**:
   - Open PRs against `develop`.
   - Use the standard PR template in `.github/PULL_REQUEST_TEMPLATE.md`.
   - Ensure all linting and type checks pass.

---

## 🛡️ Security & Quality Standards
- No hardcoded secrets or passwords in any file.
- All Mongoose user queries must scope by authenticated `req.user._id` unless Admin/Staff.
