# Half Leaf — Full-Stack Implementation Plan

> **Status:** Phase 1 in progress  
> Legal texts are placeholder drafts — require expert legal review before production.  
> Payment and shipping integrations use interface stubs only — no real credentials.

---

## Architecture Overview

```
half-leaf/
├── prisma/                   # Database schema + migrations + seed
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout (minimal: fonts + AppShell)
│   │   ├── (store pages)     # Existing storefront pages
│   │   ├── admin/            # Admin panel (protected)
│   │   │   ├── layout.tsx    # Admin layout (sidebar, no store Header/Footer)
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── urunler/      # Product CRUD
│   │   │   ├── kategoriler/  # Category CRUD
│   │   │   ├── siparisler/   # Order management
│   │   │   ├── musteriler/   # Customer management
│   │   │   ├── kuponlar/     # Coupon management
│   │   │   ├── bannerlar/    # Banner / content management
│   │   │   └── ayarlar/      # Settings
│   │   └── api/              # REST API routes
│   │       ├── auth/         # login, register, logout, me
│   │       ├── products/     # public + admin product endpoints
│   │       ├── categories/   # public + admin category endpoints
│   │       ├── orders/       # customer + admin order endpoints
│   │       ├── cart/         # server-side cart (future)
│   │       ├── coupons/      # coupon validation + management
│   │       ├── returns/      # return request endpoints
│   │       └── admin/        # admin-only: stats, bulk ops
│   ├── components/
│   │   ├── admin/            # Admin-only components
│   │   │   ├── layout/       # AdminSidebar, AdminHeader
│   │   │   ├── products/     # ProductForm, ProductTable
│   │   │   ├── orders/       # OrderTable, OrderDetail
│   │   │   └── ui/           # Admin-specific UI primitives
│   │   └── (existing store components unchanged)
│   ├── lib/
│   │   ├── db/
│   │   │   └── prisma.ts     # Prisma client singleton
│   │   ├── auth/
│   │   │   ├── jwt.ts        # JWT sign/verify (jose, edge-compatible)
│   │   │   └── middleware.ts # Auth helpers for API routes
│   │   ├── services/         # Business logic layer
│   │   │   ├── product.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── coupon.service.ts
│   │   │   └── return.service.ts
│   │   ├── validations/      # Zod schemas (shared frontend + backend)
│   │   │   ├── product.schema.ts
│   │   │   ├── order.schema.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── coupon.schema.ts
│   │   └── api/
│   │       └── response.ts   # Typed API response helpers
│   └── middleware.ts         # Next.js middleware (admin route protection)
└── .env.example              # Required environment variables
```

### Tech Stack Additions
| Layer | Technology | Reason |
|-------|-----------|--------|
| Database | PostgreSQL (Supabase-compatible) | ACID, JSON support, full-text search |
| ORM | Prisma 6 | Type-safe, migrations, seed |
| Validation | Zod | Shared schemas for frontend + backend |
| Auth | Custom JWT (jose) | Edge-compatible, no external provider dependency |
| Passwords | bcryptjs | Industry standard, pure-JS |

### Integration Points (stubs — not wired)
| Capability | Interface Location |
|-----------|-------------------|
| Payment provider (Stripe, İyzico, PayTR) | `src/lib/services/payment.service.ts` |
| Shipping provider (Yurtiçi, Aras, PTT) | `src/lib/services/shipping.service.ts` |
| Invoice provider (Parasut, Logo) | `src/lib/services/invoice.service.ts` |
| Email notifications | `src/lib/services/email.service.ts` |

---

## Data Models

### Core Entities
- **User** (customer + admin, role-based)
- **Session** (JWT sessions, revocable)
- **Address** (user-owned, multi-address)
- **Category** (hierarchical-ready, sortable)
- **Product** (full e-commerce model)
- **ProductVariant** (price/stock per variant)
- **ProductImage**, **ProductTag**, **ProductSpec**
- **Order** (guest + authenticated)
- **OrderItem** (snapshot of product at purchase time)
- **Payment** (provider-agnostic, metadata JSON)
- **Shipment** (provider-agnostic, tracking)
- **ReturnRequest** + **ReturnItem**
- **Coupon** (percentage / fixed / free-shipping)
- **CouponUsage** (per-user usage tracking)
- **Banner** (content management)
- **ConsentRecord** (KVKK + age verification audit log)

---

## Milestones

### ✅ Phase 0 — Storefront Frontend (Complete)
- Dark-themed Next.js 16 storefront
- 18 mock products across 6 categories
- Cart (Zustand + localStorage)
- Age gate (+18)
- 15 routes: store, help, legal pages

### 🔄 Phase 1 — Backend Foundation (Current)
- [ ] Prisma schema (all models)
- [ ] Prisma client singleton
- [ ] Zod validation schemas
- [ ] JWT auth helpers
- [ ] Service layer (product, category, auth)
- [ ] API routes: GET /api/products, GET /api/categories
- [ ] API routes: POST /api/auth/login, POST /api/auth/register
- [ ] AppShell (conditional store/admin layout)
- [ ] Admin layout + sidebar
- [ ] Admin login page
- [ ] Admin dashboard (skeleton)
- [ ] Next.js middleware (admin protection)
- [ ] .env.example

### Phase 2 — Seed Data + Admin Product CRUD
- [ ] Prisma seed (convert mock data → DB)
- [ ] Admin: product list, create, edit, delete
- [ ] Admin: category list, create, edit, delete
- [ ] Image upload (local filesystem → S3-ready)
- [ ] Full-text product search API

### Phase 3 — Customer Accounts + Cart Backend
- [ ] Customer registration, login, profile
- [ ] Address add/edit/delete
- [ ] Server-side cart persistence (DB + localStorage sync)
- [ ] JWT refresh tokens + logout
- [ ] Frontend: account pages (/hesabim/*)

### Phase 4 — Checkout + Orders
- [ ] Order creation API
- [ ] Payment stub (Stripe-ready interface)
- [ ] Order confirmation page
- [ ] Order status management (admin)
- [ ] Customer order history
- [ ] Shipping stub (tracking-ready interface)

### Phase 5 — Admin Operations
- [ ] Admin: order list + detail + status update
- [ ] Admin: customer list + detail
- [ ] Admin: coupon CRUD
- [ ] Admin: return request management
- [ ] Admin: banner / content management
- [ ] Admin: dashboard with real DB stats

### Phase 6 — Advanced Commerce
- [ ] Coupon validation at checkout
- [ ] Return request portal (customer-facing)
- [ ] Product variant selection (storefront)
- [ ] Stock reservation on checkout
- [ ] Low-stock alerts (admin)
- [ ] Consent records audit log

### Phase 7 — Integrations + Production
- [ ] Real payment provider (Stripe / İyzico / PayTR)
- [ ] Real shipping provider (Yurtiçi / Aras / PTT)
- [ ] Invoice provider integration
- [ ] Email notifications (order confirm, shipping)
- [ ] Environment-based config
- [ ] Deployment (Vercel + Supabase / Railway)
- [ ] Rate limiting, security headers
- [ ] Analytics integration

---

## API Design

All endpoints return:
```json
{ "success": true, "data": {}, "meta": { "total": 0, "page": 1, "limit": 20 } }
{ "success": false, "error": "Hata mesajı" }
```

### Public Endpoints
```
GET  /api/products                 List products (filter, sort, paginate)
GET  /api/products/:id             Product detail
GET  /api/categories               List categories
GET  /api/categories/:slug/products Products by category
POST /api/auth/register            Customer registration
POST /api/auth/login               Login (customer or admin)
POST /api/auth/logout              Logout (clears session)
GET  /api/auth/me                  Current user (requires auth)
POST /api/coupons/validate         Validate a coupon code
```

### Authenticated (Customer)
```
GET  /api/orders                   My orders
POST /api/orders                   Create order
GET  /api/orders/:id               Order detail
GET  /api/addresses                My addresses
POST /api/addresses                Add address
PUT  /api/addresses/:id            Update address
DELETE /api/addresses/:id          Delete address
POST /api/returns                  Submit return request
```

### Admin Only
```
GET  /api/admin/stats              Dashboard stats
GET/POST/PUT/DELETE /api/admin/products/*
GET/POST/PUT/DELETE /api/admin/categories/*
GET/PUT /api/admin/orders/*
GET /api/admin/customers/*
GET/POST/PUT/DELETE /api/admin/coupons/*
GET/POST/PUT/DELETE /api/admin/banners/*
```

---

## Compliance Notes
- All visible copy: Turkish only
- No tobacco/nicotine/liquid/flavor products
- No smoking-promoting language
- +18 age gate required; consent logged to `ConsentRecord`
- KVKK consent required at registration
- Legal pages are draft templates — require expert review
- Payment card data never stored (handled by payment provider)
