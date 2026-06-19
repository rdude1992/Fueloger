# FuelLog — Vehicle Tracker PWA

Track fuel, trips and vehicle expenses. All data stays on your device.

## Files
```
fuellog-pwa/
├── index.html     ← The full app
├── manifest.json  ← PWA metadata
├── sw.js          ← Service worker (offline support)
├── icon-192.png   ← App icon
└── icon-512.png   ← App icon (large)
```

---

## Deploy to GitHub Pages (free, 2 minutes)

1. Go to **github.com** → Sign in (or create free account)
2. Click **+** → **New repository**
   - Name: `fuellog` (or anything)
   - Set to **Public**
   - Click **Create repository**
3. Click **uploading an existing file**
4. Drag all 5 files into the upload area
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

All your data is stored in `localStorage` on your device only.
Nothing is sent to any server. Export a JSON backup anytime from Settings.
