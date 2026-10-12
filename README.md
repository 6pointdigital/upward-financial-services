# Upward Financial Services — Equipment Inventory

Next.js 15 app on **Webflow Cloud** (Cloudflare Workers via OpenNext) for listing commercial equipment from partner dealerships that Upward can finance.

## What it does
- **Public inventory** (`/`): search + filters (category, make, condition, price, year, state), sorting, estimated monthly payment on each card.
- **Listing page** (`/equipment/:id`): photo gallery, specs, interactive payment estimator, financing request form.
- **Portal** (`/portal`):
  - *Dealers* add/edit their own listings and photos, then submit for review. Editing a live listing sends it back for re-review.
  - *Upward admins* approve / request changes / unpublish, toggle financing eligibility, manage dealerships and users, work financing requests, and set estimator defaults (APR, terms, down %).
- Only **approved** listings (and their photos) are public. Drafts/pending are visible only to admins and the owning dealer.

## Storage (Webflow Cloud bindings in `wrangler.json`)
- `DB` — SQLite (D1). Schema in `migrations/`; Webflow Cloud applies migrations on deploy.
- `MEDIA` — Object storage (R2) for listing photos, served through `/api/photos/...` with access checks.

## First run
Visit `/setup` once to create the first Upward admin (the page locks after any user exists). Then add dealerships and dealer users under **Portal → Dealerships / Users**.

## Local development
```bash
npm install
npx wrangler d1 migrations apply DB --local
npm run preview        # OpenNext build + local Workers runtime
```
