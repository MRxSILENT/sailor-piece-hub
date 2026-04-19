#!/usr/bin/env python3
"""
Sailor Piece Hub — Fandom Scraper (Python / Playwright)
No npm required. Uses Python's playwright package.

GitHub Actions installs it automatically.
Local usage:
    pip install playwright
    playwright install chromium
    python scripts/scraper.py
"""

import json, sys, re, time, random
from pathlib import Path
from datetime import datetime, timezone

DATA_FILE   = Path(__file__).parent.parent / "public" / "data.json"
FANDOM_BASE = "https://roblox-sailor-piece.fandom.com/wiki"
IS_CI       = "--ci" in sys.argv
DEBUG       = "--debug" in sys.argv

WIKI_PAGES = [
    ("Fruits",    "fruits"),
    ("Swords",    "swords"),
    ("Races",     "races"),
    ("Clan",      "clans"),
    ("Trait",     "traits"),
    ("Artifacts", "artifacts"),
    ("Codes",     "codes"),
]

TIER_MAP = {
    "s+":"S+","ss":"S+","god":"S+","godly":"S+","mythic":"S+","mythical":"S+",
    "s":"S",
    "a":"A",
    "b":"B",
    "c":"C",
    "d":"D","f":"D",
    "legendary":"S","rare":"A","uncommon":"B","common":"C",
}

FRUIT_TYPES = {
    "Elemental": ["light","flame","ice","magma","darkness","snow"],
    "Natural":   ["quake","fiend","bomb","invisible","spirit","dark","spin","blood"],
    "Beast":     ["dragon","kitsune"],
    "Mythical":  ["phoenix","nika","spider"],
}

EMOJI_MAP = {
    "Light":"✨","Flame":"🔥","Quake":"💥","Bomb":"💣","Invisible":"👻",
    "Dragon":"🐉","Kitsune":"🦊","Fiend":"👹","Spirit":"👻","Dark":"🌑",
    "Ice":"❄️","Spin":"🌀","Magma":"🌋","Snow":"❄️","Darkness":"🌑",
    "Katana":"🔪","Dark Blade":"⬛","Gryphon":"🦅",
    "Atomic":"⚛️","Shadow":"🌑","Ichigo":"🧡","Aizen":"💜",
    "True Aizen":"🌙","Yamato":"⚔️","Shadow Monarch":"👑",
    "Ice Queen":"❄️","Rimuru":"🌀","Jinwoo":"🟣","Saber":"🟡",
    "Abyssal Empress":"🌊","Escanor":"☀️","Ragna":"⚫",
    "Human":"🧑","Fishman":"🐟","Mink":"🐾","Skypea":"☁️",
    "Oni":"👹","Shinigami":"⚫","Hollow":"💀","Vampire":"🧛",
    "Shadowborn":"🌑","Demon":"😈","Luckborn":"🍀","Warlord":"⚔️",
    "Sunborn":"☀️","Servant":"🛡️","Galevorn":"🌪️","SwordBlessed":"⚔️",
    "Leviathan":"🌊","Slime":"🟢",
    "Frostbane":"❄️","Upper":"⬆️","Alter":"🌑","Espada":"🏴",
    "Pride":"🦁","Monarch":"👑","Voldigoat":"🐐",
    "Mugetsu":"⚫","Zoldyck":"🎭","Raikage":"⚡","Sasaki":"🌙",
}

def normalize_tier(raw):
    key = re.sub(r'\s+tier$','', raw.strip(), flags=re.I).lower().strip()
    key = re.sub(r'[^a-z+]','', key)
    return TIER_MAP.get(key)

def clean_name(raw):
    name = re.sub(r'\(.*?\)', '', raw)
    name = re.sub(r'\[.*?\]', '', name)
    name = re.sub(r'[\n\r\t]+', ' ', name)
    return name.strip()[:60]

def get_fruit_type(name):
    n = name.lower().replace(' fruit','')
    for ft, fruits in FRUIT_TYPES.items():
        if any(f in n or n in f for f in fruits):
            return ft
    return "Natural"

def infer_tags(name, tier, category):
    tags, n = [], name.lower()
    if category == "fruits":
        if any(k in n for k in ["light","quake","flame","dragon","kitsune","fiend"]): tags.append("farming")
        if any(k in n for k in ["light","quake","invisible","fiend","dark"]):         tags.append("pvp")
        if any(k in n for k in ["quake","dragon","fiend","bomb"]):                    tags.append("boss")
        if any(k in n for k in ["light","kitsune"]):                                  tags.append("speed")
        if any(k in n for k in ["quake","bomb","dragon"]):                            tags.append("aoe")
    if category == "swords":
        if any(k in n for k in ["shadow monarch","ice queen","atomic","true aizen","yamato"]): tags += ["pvp","boss"]
        if any(k in n for k in ["rimuru","abyssal","shadow"]): tags.append("farming")
    if tier in ("S+","S") and not tags: tags.append("pvp")
    return list(dict.fromkeys(tags))

def log(msg, level="info"):
    icons = {"info":"ℹ️","ok":"✅","warn":"⚠️","err":"❌","scrape":"🌐"}
    if level != "debug" or DEBUG:
        print(f"{icons.get(level,'▸')} {msg}", flush=True)

def parse_page(page, category):
    """Extract tier data from a rendered Fandom page."""
    items = {}
    codes = []

    try:
        page.wait_for_selector(".mw-parser-output", timeout=15000)

        if category == "codes":
            codes = page.evaluate("""() => {
                const found = new Set()
                document.querySelectorAll('code,tt,.mw-parser-output b,.mw-parser-output strong').forEach(el => {
                    const t = el.innerText.trim()
                    if (t.length >= 5 && t.length <= 40 && /^[A-Za-z0-9]+$/.test(t)) found.add(t)
                })
                document.querySelectorAll('table td').forEach(td => {
                    const t = td.innerText.trim()
                    if (t.length >= 5 && t.length <= 40 && /^[A-Za-z0-9]+$/.test(t)) found.add(t)
                })
                return [...found].slice(0,20)
            }""")
            return {"items": {}, "codes": codes}

        # Extract table rows
        rows = page.evaluate("""() => {
            const rows = []
            document.querySelectorAll('table tr').forEach(tr => {
                const cells = [...tr.querySelectorAll('td,th')].map(c => c.innerText.trim())
                if (cells.length >= 2) rows.push(cells)
            })
            return rows
        }""")

        for cells in rows:
            tier = None; name = None
            t0 = normalize_tier(cells[0]) if cells else None
            if t0 and len(cells) > 1 and 1 < len(cells[1]) < 60:
                tier, name = t0, cells[1]
            if not tier and len(cells) > 1:
                t1 = normalize_tier(cells[1])
                if t1 and 1 < len(cells[0]) < 60:
                    tier, name = t1, cells[0]
            if tier and name:
                cname = clean_name(name)
                if 1 < len(cname) < 55:
                    if tier not in items: items[tier] = []
                    if not any(i["name"] == cname for i in items[tier]):
                        obj = {
                            "name": cname,
                            "emoji": EMOJI_MAP.get(cname, EMOJI_MAP.get(cname.split()[0], "🔹")),
                            "description": "",
                            "tags": infer_tags(cname, tier, category),
                        }
                        if category == "fruits": obj["fruitType"] = get_fruit_type(cname)
                        items[tier].append(obj)

        # Supplement with heading + list structure
        sections = page.evaluate("""() => {
            const secs = []
            let heading = null
            document.querySelectorAll('.mw-parser-output h2,.mw-parser-output h3,.mw-parser-output h4,.mw-parser-output ul,.mw-parser-output ol').forEach(el => {
                if (['H2','H3','H4'].includes(el.tagName)) {
                    heading = el.innerText.replace(/\\[edit\\]/gi,'').trim()
                } else if (heading) {
                    const its = [...el.querySelectorAll('> li')].map(li => li.innerText.split('\\n')[0].trim()).filter(Boolean)
                    if (its.length) secs.push({heading, items: its})
                }
            })
            return secs
        }""")

        HEADING_TIER = {"s+ tier":"S+","ss tier":"S+","s tier":"S","a tier":"A","b tier":"B","c tier":"C","d tier":"D",
                        "godly":"S+","mythic":"S+","legendary":"S","rare":"A","uncommon":"B","common":"C"}
        for sec in sections:
            tier = HEADING_TIER.get(sec["heading"].lower().strip())
            if not tier: continue
            for raw in sec["items"]:
                cname = clean_name(re.sub(r'[-–:—].*','', raw))
                if 1 < len(cname) < 55:
                    if tier not in items: items[tier] = []
                    if not any(i["name"] == cname for i in items[tier]):
                        obj = {"name": cname, "emoji": EMOJI_MAP.get(cname,"🔹"),
                               "description":"","tags": infer_tags(cname, tier, category)}
                        if category == "fruits": obj["fruitType"] = get_fruit_type(cname)
                        items[tier].append(obj)

        count = sum(len(v) for v in items.values())
        log(f"  {category}: {count} items across {len(items)} tiers", "debug")
        return {"items": items, "codes": []}

    except Exception as e:
        log(f"  Parse error ({category}): {e}", "warn")
        return {"items": {}, "codes": []}

def main():
    print("\n╔══════════════════════════════════════════╗")
    print("║  Sailor Piece Hub — Python Scraper v4    ║")
    print("╚══════════════════════════════════════════╝\n")
    log(f"Mode: {'GitHub Actions CI' if IS_CI else 'Local'}")
    log(f"Target: {FANDOM_BASE}")

    # Load existing data
    existing = {}
    if DATA_FILE.exists():
        try:
            existing = json.loads(DATA_FILE.read_text())
            log(f"Loaded existing data.json ({len(existing)} keys)", "ok")
        except Exception as e:
            log(f"Existing data.json malformed: {e}", "warn")

    scraped = {}
    fandom_ok = False
    codes_found = []

    # Import Playwright (Python edition)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        log("playwright not installed. Run: pip install playwright && playwright install chromium", "err")
        log("Keeping existing data unchanged.", "warn")
        sys.exit(0)

    try:
        log("Launching Chromium…")
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox","--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                    "--lang=en-US",
                ] + (["--single-process"] if IS_CI else [])
            )
            ctx = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                locale="en-US",
                viewport={"width":1280,"height":800},
                extra_http_headers={"Accept-Language":"en-US,en;q=0.9"},
            )
            ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")

            log("Browser ready. Scraping wiki pages…", "scrape")

            for wiki_page, category in WIKI_PAGES:
                url = f"{FANDOM_BASE}/{wiki_page}"
                log(f"  → {url}")
                page = ctx.new_page()
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    time.sleep(1.5 + random.random())

                    title = page.title()
                    if any(x in title.lower() for x in ["blocked","403","denied"]):
                        log(f"  Blocked on {wiki_page}: {title}", "warn")
                        page.close(); continue

                    log(f"  Loaded: {title!r}", "ok")
                    result = parse_page(page, category)

                    if category == "codes" and result["codes"]:
                        codes_found = result["codes"]
                        log(f"  Codes: {', '.join(codes_found[:5])}", "ok")
                    elif sum(len(v) for v in result["items"].values()) >= 2:
                        scraped[category] = result["items"]
                        fandom_ok = True

                    time.sleep(2 + random.random() * 1.5)
                except Exception as e:
                    log(f"  Failed ({wiki_page}): {e}", "err")
                finally:
                    page.close()

            browser.close()
        log("Browser closed", "ok")
    except Exception as e:
        log(f"Browser error: {e}", "err")
        log("Keeping existing data unchanged.", "warn")

    # ── Merge ──────────────────────────────────────────
    merged = dict(existing)
    updated_cats = 0

    for cat, tier_data in scraped.items():
        count = sum(len(v) for v in tier_data.values())
        if count < 2:
            log(f"Skipping {cat} — only {count} item(s)", "warn"); continue
        if cat in merged and isinstance(merged[cat], dict):
            # Safe merge: keep existing, add new from Fandom
            for tier, items in tier_data.items():
                if tier not in merged[cat]: merged[cat][tier] = []
                for item in items:
                    if not any(e["name"].lower() == item["name"].lower() for e in merged[cat][tier]):
                        merged[cat][tier].append(item)
                        log(f"  + {cat}/{tier}: {item['name']}", "debug")
        else:
            merged[cat] = tier_data
        updated_cats += 1
        log(f"Updated {cat} ({count} items)", "ok")

    # Codes
    valid_codes = [c for c in codes_found if re.match(r'^[A-Z0-9]{4,30}$', c, re.I)]
    if valid_codes:
        if "gameMeta" not in merged: merged["gameMeta"] = {}
        merged["gameMeta"]["activeCodes"] = valid_codes
        log(f"Active codes: {', '.join(valid_codes)}", "ok")

    # Update meta
    merged["meta"] = {
        **(existing.get("meta") or {}),
        "lastUpdated":       datetime.now(timezone.utc).date().isoformat(),
        "lastScrapedAt":     datetime.now(timezone.utc).isoformat(),
        "scrapedFrom":       FANDOM_BASE,
        "fandomSuccess":     fandom_ok,
        "categoriesUpdated": updated_cats,
        "scrapeMode":        "github-actions-python-playwright" if IS_CI else "local-python-playwright",
    }

    DATA_FILE.write_text(json.dumps(merged, indent=2, ensure_ascii=False))

    print("\n" + "─" * 50)
    log(f"data.json saved → {DATA_FILE}", "ok")
    log(f"Categories updated: {updated_cats}/8")
    log(f"Fandom scrape:      {'SUCCESS' if fandom_ok else 'PARTIAL — existing data preserved'}")
    log(f"Date:               {merged['meta']['lastUpdated']}")
    print("─" * 50 + "\n")

if __name__ == "__main__":
    main()
