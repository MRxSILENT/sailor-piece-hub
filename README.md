# ⚓ Sailor Piece Hub

> **Zero npm. Zero build step.** Just upload the files — it works instantly.
> Auto-syncs with the Sailor Piece Fandom wiki every 30 minutes via GitHub Actions + Python.

---

## 🚀 How to Use

**Locally:** Double-click `index.html` — done.

**On GitHub Pages:** Push the files → enable Pages → live in 60 seconds.

---

## 📁 Files

```
sailor-piece-hub/
├── index.html            ← Open this in any browser
├── css/style.css         ← All styles (dark gaming theme)
├── js/app.js             ← Complete SPA (routing, all pages, builder)
├── public/
│   ├── data.json         ← Game data (auto-updated by scraper)
│   └── favicon.svg
├── scripts/
│   └── scraper.py        ← Python scraper — NO npm needed
└── .github/workflows/
    └── scrape.yml        ← Auto-runs every 30 min (Python only)
```

---

## 🌐 Deploy to GitHub Pages (free)

### Step 1 — Push to GitHub
```
1. Go to github.com → New repository → "sailor-piece-hub" → Public → Create
2. Extract this zip, open a terminal in the folder, then:
```
```bash
git init
git add -A
git commit -m "⚓ init"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sailor-piece-hub.git
git push -u origin main
```

### Step 2 — Enable GitHub Pages
```
GitHub repo → Settings → Pages → Source: "Deploy from branch" → main / root → Save
```
Your site will be live at: `https://YOUR_USERNAME.github.io/sailor-piece-hub/`

> **Important:** Change `vercel.json` is not needed for GitHub Pages.
> If using GitHub Pages, open `js/app.js` and change the `fetch('public/data.json')` path to `fetch('./public/data.json')` — it already uses relative paths so it should work.

### Step 3 — Enable Fandom Auto-Sync
```
GitHub repo → Actions → "⚓ Sync Fandom Wiki" → Enable workflow
```
Runs every 30 minutes automatically using Python. No npm, no Node.js needed.

Optional — add this secret for auto-deploy after sync:
```
Settings → Secrets → New secret: VERCEL_DEPLOY_HOOK = your webhook URL
```

---

## 🍎 The 4 Fruit Types

| Type | Game Name | Mechanic |
|---|---|---|
| ⚡ Elemental | Logia | Body turns into an element — physical immunity |
| 🌿 Natural | Paramecia | Body modification / environmental power |
| 🐉 Beast | Zoan | Transform into a creature — bonus HP + flight |
| ✨ Mythical | Ancient Zoan | Rarest — mythological powers |

---

## 🛠️ Run Scraper Locally

```bash
pip install playwright
playwright install chromium
python scripts/scraper.py
```

That's it. No npm. No node_modules.

---

## ✨ Features

- **8 Tier Lists** — Fruits, Swords, Melee, Races, Traits, Runes, Clans, Artifacts
- **4 Fruit Types** — filter by Elemental / Natural / Beast / Mythical
- **AI Build Generator** — 7 slots: Fruit + Sword + Melee + Race + Trait + Rune + Clan
- **Fandom Wiki** — live iframe for all wiki pages
- **Favorites** — saved in localStorage (no account needed)
- **Auto-sync** — GitHub Actions + Playwright scrapes fandom.com every 30 min
- **Fandom Sync Badge** — shows last sync time and status in the UI
