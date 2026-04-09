# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fullstack e-commerce system with a Django REST Framework backend and React frontend. Resembles Amazon's UI (multi-column product grid, cart, WhatsApp order sharing).

## Commands

### Backend
```bash
cd backend
venv\Scripts\activate                  # Windows
source venv/bin/activate               # Mac/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver             # port 8000
python manage.py createsuperuser
python manage.py test apps.products    # run tests for a single app
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # port 3000 (Vite)
```

### Environment variables
- `backend/core/.env`: `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `DATABASE_URL`
- `frontend/.env`: `VITE_API_URL=http://localhost:8000/api`

## Architecture

### Backend — `ventasOnline/backend/`
Three Django apps under `apps/`:

| App | Responsibility |
|-----|---------------|
| `accounts` | Custom `User` (extends `AbstractUser`, adds `phone`), `Address` |
| `products` | `Category`, `Product` (with `slug`, `stock`, `separated_qty`, `simple_history` audit log), `ProductImage`, `Supplier`, `Review` |
| `sales` | `Cart`/`CartItem` (one-per-user), `Order`/`OrderItem`, `Payment` |

`core/` holds Django settings, JWT config, and URL routing.

**Key model details:**
- `Product.separated_qty`: quantity reserved by approved-but-unpaid orders (reduces available stock without touching `stock`).
- `OrderItem.price`: snapshot of price at purchase time — never recalculated from `Product.price`.
- `Order.final_price` property: `total_price - discount` (admin-editable on `creada` orders only).
- `Product` uses `django-simple-history` for price/stock audit trail.

### Order State Machine
```
creada → aprobada → pagada   (immutable)
creada → anulada
aprobada → anulada  (admin only)
```
- Discount edit: admin only, `creada` state only.
- Approve: customer action on `creada`.
- Pay / Anular-after-approval: admin only.

### Frontend — `ventasOnline/frontend/src/`
| Directory | Responsibility |
|-----------|---------------|
| `api/` | Axios instance with base URL and JWT interceptor |
| `context/` | `AuthContext` (JWT tokens, user role), `CartContext` (localStorage + DB sync) |
| `components/` | Reusable UI (product card, cart drawer, etc.) |
| `pages/` | Route-level views: Store, Orders, Login/Register, Admin panel |

**Cart sync flow:** Guest items live in `localStorage`. On login, frontend calls `POST /api/sales/sync-cart/` to merge them into the DB cart, then clears localStorage.

### API Base URLs
- Auth: `/api/token/`, `/api/token/refresh/`, `/api/user/profile/`
- Products: `/api/products/products/`, `/api/products/categories/`
- Sales: `/api/sales/cart/`, `/api/sales/cart/add_item/`, `/api/sales/cart/remove_item/`, `/api/sales/sync-cart/`, `/api/sales/orders/`

### Auth
- JWT via `djangorestframework-simplejwt`.
- `is_staff=True` identifies admins — used for permission checks in views.
- Customers see only their own orders; staff sees all.

## Code Conventions
- Comments in **Spanish**, variable/function/class names in **English**.
- One file = one clear responsibility.
- All external API calls must have error handling.
- Seed data: ≥100 products with multiple images each (use a management command under `apps/products/management/commands/`).
