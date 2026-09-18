# Tile Warehouse Inventory & Locator System 📦🧱

A full-stack, mobile-first **Tile Warehouse Inventory & Locator System** designed specifically for warehouse workers to quickly add tiles, record location positions, locate tile designs in real-time, and manage warehouse sections.

---

## 🚀 Features

- 🔍 **Live Search & Locator Dashboard**: Search tile designs by name with instant debounced results, case-insensitive matching, section & position filter controls, and multi-location grouping.
- ⚡ **Ultra-Prominent Location Badges**: High contrast, large typography (`3.5rem+` section codes) optimized for quick identification on mobile devices in real warehouse lighting conditions.
- ➕ **Add Tile Interface**: Dedicated form with touch-friendly segmented control for positions (`Starting`, `Middle`, `Last`), Zod validation, toast notifications, automatic form reset, and auto-focus for rapid item entry.
- 📊 **Dynamic Dashboard**: Real-time stats from database including total tiles, today's additions, section counts, and recent activities.
- 📋 **Full Inventory Management**: Table (Desktop) / Card (Mobile) layout with sorting options (Newest, Oldest, Name A-Z, Name Z-A, Section), inline edit modal, and delete confirmation dialog.
- 🏗️ **Dynamic Section Management**: Configure custom warehouse sections (e.g. `A1–A15`, `B1–B15`, `C1–C15`, `D1–D15`) individually or in ranges.
- 🌓 **Dark / Light Mode**: Theme toggle with saved `localStorage` preference.
- 📱 **PWA & Mobile-First UX**: Responsive bottom navigation bar on mobile, sidebar on desktop, 44px+ touch targets, and installable web app manifest.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (default local zero-config) / PostgreSQL (production compatible)
- **ORM**: Prisma ORM
- **Validation**: Zod
- **Icons**: Lucide React
- **Notifications**: Sonner

---

## ⚙️ Quick Start (Local Setup)

### 1. Prerequisites
- Node.js 18+ installed

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration & Seeding
Push the Prisma schema to create the database file and seed initial default sections (`A1–A15`, `B1–B15`, `C1–C15`) & sample inventory:
```bash
npx prisma db push
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
├── app/
│   ├── page.tsx            # Dynamic Analytics Dashboard
│   ├── search/page.tsx     # Live Search & Locator Dashboard
│   ├── add-tile/page.tsx   # Add Tile Form Interface
│   ├── inventory/page.tsx  # Full Inventory Table & Actions (Edit/Delete)
│   ├── sections/page.tsx   # Warehouse Section Management
│   ├── api/
│   │   ├── tiles/route.ts       # Tile Search, Filter & Creation API
│   │   ├── tiles/[id]/route.ts  # Single Tile Update & Delete API
│   │   ├── sections/route.ts    # Section Config API
│   │   └── stats/route.ts       # Dashboard Analytics API
│   ├── globals.css         # Styling system & custom utility classes
│   └── layout.tsx          # Root Layout & Mobile/Desktop Navigation
├── components/
│   ├── Navbar.tsx          # Desktop Sidebar & Mobile Bottom Navigation Bar
│   └── ThemeToggle.tsx     # Light/Dark Theme Switcher
├── lib/
│   ├── db.ts               # Prisma Singleton Client
│   └── types.ts            # TypeScript Interfaces & Zod Validation Schemas
├── prisma/
│   ├── schema.prisma       # Prisma Database Schema
│   └── seed.ts             # Database Seed Script
├── public/
│   └── manifest.json       # PWA Web App Manifest
├── .env                    # Local environment variables
├── .env.example            # Environment variables template
└── README.md
```

---

## 🗄️ Database Schema

### `TileInventory`
| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Auto-generated unique identifier |
| `tileDesignName` | String | Tile design name (e.g. Jet Black, Italian Marble) |
| `section` | String | Warehouse section code (e.g. A1, B3, C2) |
| `position` | String | allowed: `STARTING`, `MIDDLE`, `LAST` |
| `note` | String? | Optional batch details / notes |
| `createdAt` | DateTime | Timestamp of creation |
| `updatedAt` | DateTime | Timestamp of last modification |

### `SectionConfig`
| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Auto-generated unique identifier |
| `code` | String (Unique) | Section code (e.g. A1, B15) |
| `prefix` | String | Zone prefix (e.g. A, B, C) |

---

## 🌐 Production Deployment

To deploy to platforms such as Vercel with PostgreSQL:
1. Update `schema.prisma` datasource provider to `postgresql`.
2. Set `DATABASE_URL="postgresql://user:password@host:5432/dbname"` in your environment variables.
3. Run `npx prisma db push` or `npx prisma migrate deploy` in your build pipeline.
