# FuelLog — Vehicle Tracker PWA

A private, offline-first Progressive Web App for tracking fuel, trips, and vehicle expenses. Built as a single self-contained `index.html` — no backend, no build step, no signup. All data lives in `localStorage` on the user's own device.

## Files
```
fuellog-pwa/
├── index.html                  ← The entire app (HTML/CSS/JS, ~4,200 lines)
├── manifest.json                ← PWA metadata (icons, theme, display mode)
├── sw.js                        ← Service worker (offline caching + update flow)
├── icon-192.png / icon-512.png            ← App icons
└── icon-maskable-192.png / icon-maskable-512.png ← Maskable variants for adaptive icons
```

There is no `package.json`, build tooling, or dependency install step — you can open `index.html` directly or host the folder as static files.

---

## Features

**Dashboard**
- Per-vehicle or "All vehicles" view with a monthly cost hero stat (fuel + other expenses, with month-over-month % change)
- Distance driven, average mileage (km/l), and cost-per-km stat cards, plus bar charts
- Live odometer display per vehicle
- Maintenance tracker: flags Service and Tyres as OK / Due Soon / Overdue based on km and days since the last logged entry (service: every ~5,000–6,000 km / ~150–180 days; tyres: every ~28,000–35,000 km / ~4 years)
- Active-trip card when a live trip is running

**Fuel log**
- Log fill-ups with cost, litres, odometer reading, station, full-tank flag, and notes
- Auto-calculates price-per-litre and mileage since the last fill-up
- **Receipt scanning**: capture/upload a fuel receipt photo, and the app runs on-device OCR (OpenCV.js for image preprocessing + Tesseract.js for text recognition) to auto-extract cost, litres, price/L, and date, which you can review and apply to the form. Scanned receipts are archived in IndexedDB. OCR libraries load lazily from CDN on first use and are then cached by the service worker for full offline use afterward.

**Trips**
- Manual trip entry (start/end odometer, source/destination, purpose) or **live trip tracking** (start now, finish later — tracks elapsed time)
- Purpose categories (business, personal, commute, etc.) with a breakdown view

**Expenses**
- Categorized non-fuel spend: Toll, Parking, Repair, Service, Insurance, Tires, Battery, Accessory, Other
- Each category has its own vendor label and optional odometer field
- Filterable by vehicle and category

**Vehicles**
- Multiple vehicles supported, each with name, type (🚗 Car / 🏍 Bike / 🛵 Scooter / ⚡ EV / 🚌 Other), fuel type, registration, odometer, and purchase date

**Data & backup**
- Export full backup as JSON, or all entries as CSV
- Native Share Sheet support (send backup to Drive, WhatsApp, Files, email, etc.) with a plain-download fallback
- Import a JSON backup (replaces current data, with confirmation)
- Backup reminder banner based on a configurable backup frequency
- "Clear all data" and a one-tap sample-data seeder for trying the app out

**PWA behavior**
- Installable on Android (Chrome) and iOS (Safari → Add to Home Screen)
- Offline-first via service worker: app shell is cache-first, HTML is network-first-with-fallback, OCR libraries are cached indefinitely once downloaded
- Update banner prompts a reload when a new version is deployed
- Light/dark theme toggle, pull-to-refresh, and swipe-to-close modals with in-app back-button handling

---

## Deploy to GitHub Pages (free, 2 minutes)

1. Go to **github.com** → Sign in (or create free account)
2. Click **+** → **New repository**
   - Name: `fuellog` (or anything)
   - Set to **Public**
   - Click **Create repository**
3. Click **uploading an existing file**
4. Drag all files (`index.html`, `manifest.json`, `sw.js`, and the 4 icon PNGs) into the upload area
5. Click **Commit changes**
6. Go to **Settings** → **Pages** → Source: **main branch / root**
7. Click **Save** — you'll get a URL like `https://yourname.github.io/fuellog`

Open that URL in Chrome on your Android phone → tap the **"Add to Home Screen"** banner or menu → **Install**.

---

## Deploy to Netlify (even easier, drag & drop)

1. Go to **netlify.com** → Sign up free
2. Drag the entire `fuellog-pwa` **folder** onto the Netlify dashboard
3. Done — you get a live HTTPS URL instantly

Open the URL in Chrome on Android → install prompt appears automatically.

---

## iOS (iPhone/iPad)

1. Open the URL in **Safari**
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

---

## Why can't I install from a local file?

Chrome requires **HTTPS** to enable PWA install. A local `file://` path doesn't qualify.
Hosting on GitHub Pages or Netlify gives you free HTTPS in under 2 minutes.

---

## Data & Privacy

All your data (vehicles, fuel entries, trips, expenses) is stored in `localStorage` on your device only. Scanned receipt images and their extracted text are stored locally in IndexedDB. Nothing is sent to any server — the only network activity is the one-time download of the OCR libraries (Tesseract.js/OpenCV.js) from their CDNs the first time you use receipt scanning, after which the service worker caches them for offline use. Export a JSON backup anytime from Settings.

---

## Updating the app after deploy

The service worker uses a version string (`CACHE_VERSION` in `sw.js`). Bump it on every deploy so returning users get the update prompt instead of a stale cached copy.
