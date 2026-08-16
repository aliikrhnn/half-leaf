# Half Leaf

A full-stack e-commerce platform — customer storefront and back-office admin panel —
built on Next.js, Prisma and PostgreSQL.

Not a shopping-cart demo. This covers the parts that only show up once a store has to
actually run: stock that moves, orders that get returned, prices that change, refunds
that have to reconcile with a payment provider, and an audit trail for all of it.

---

## Features

**Storefront**

- Product catalogue with categories, variants, materials and brands
- Cart that survives login — a guest cart reconciles into the user's cart on sign-in
- Checkout with address book, shipping options and coupon codes
- Card payment through the PayTR iFrame API, plus bank-transfer orders
- Order tracking for guests, favourites, reviews and return requests
- Account area: orders, addresses, password reset, marketing consent

**Admin panel**

- Product CRUD with bulk import and export via Excel (`exceljs`)
- Inventory and stock movements, low-stock views
- Order lifecycle: status transitions, shipments, refunds through PayTR
- Return-request handling, itemised
- Coupons and campaigns, currency rates, shipping and bank settings
- CMS: hero slides, banners, legal pages, contact messages
- Dashboard statistics and a full audit log

**Image-processing pipeline**

Product photos go through a background worker: images are queued as jobs, processed with
`sharp` and an OpenAI-backed step, watermarked, uploaded to Supabase Storage, and can be
reverted per image. Job state and progress are tracked in the database and surfaced in
the admin panel.

---

## Architecture

```
src/
├── app/
│   ├── (storefront)/       Catalogue, cart, checkout, account
│   ├── admin/              Protected back-office
│   └── api/                REST route handlers (~50)
├── components/             UI, split by storefront / admin / brand
└── lib/
    ├── auth/               JWT (jose), session, route middleware
    ├── payment/            PayTR integration, order fulfilment
    ├── image-processing/   Worker, storage, watermarking
    ├── email/              Transactional and marketing templates (Resend)
    ├── services/           Business logic, kept out of route handlers
    ├── validations/        Zod schemas shared by client and server
    └── db/                 Prisma client and row mappers
prisma/                     Schema, migrations, seed
```

**Data model** — 30+ Prisma models. The ones that carry the design:

`Product` / `ProductVariant` / `Inventory` / `StockMovement` — stock is never a mutable
integer on the product. Every change is an append-only movement row, so the current level
is derived and always explainable.

`Order` / `OrderItem` / `Payment` / `Shipment` / `ReturnRequest` / `ReturnItem` — returns
are itemised rather than order-level, because in practice customers send back one thing
out of four.

`AuditLog` and `ConsentLog` — who changed what, and what the customer agreed to and when.
Both exist to answer questions after the fact, which is the only time anyone asks them.

**Layering** — route handlers parse and authorise, services hold the business logic, the
Prisma client is reached only through `lib/db`. Zod schemas are defined once and used on
both sides of the wire.

---

## Stack

| | |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Auth | JWT via `jose`, bcrypt password hashing |
| Validation | Zod |
| State | Zustand |
| Styling | Tailwind CSS, Lucide icons |
| Media | `sharp`, Supabase Storage, OpenAI |
| Payments | PayTR iFrame API |
| Email | Resend |
| Deployment | Vercel |

---

## Running it locally

```bash
npm install
cp .env.example .env        # then fill in
npx prisma migrate deploy
npm run db:generate
npm run dev                 # http://localhost:3000
```

| Script | |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

Connection strings are split: `DATABASE_URL` goes through the pgBouncer pool for
application queries, `DIRECT_URL` bypasses it for migrations. Prisma needs both.

---

## Status

Actively developed. Legal pages are placeholder drafts pending review, and the storefront
is in Turkish — the customers are.

## Licence

Not open source. Published for review; all rights reserved.
