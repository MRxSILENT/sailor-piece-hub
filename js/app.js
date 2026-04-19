/**
 * Sailor Piece Hub — Vanilla JS SPA
 * No npm · No build step · Open index.html and it works
 */

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let DATA = null
let FAVORITES = JSON.parse(localStorage.getItem('sp_favs') || '{}')

function saveFavs() {
  localStorage.setItem('sp_favs', JSON.stringify(FAVORITES))
  updateFavCount()
}

function toggleFav(category, item) {
  if (!FAVORITES[category]) FAVORITES[category] = []
  const idx = FAVORITES[category].findIndex(i => i.name === item.name)
  if (idx >= 0) FAVORITES[category].splice(idx, 1)
  else FAVORITES[category].push(item)
  saveFavs()
}

function isFav(category, name) {
  return (FAVORITES[category] || []).some(i => i.name === name)
}

function updateFavCount() {
  const count = Object.values(FAVORITES).flat().length
  const el = document.getElementById('fav-count')
  if (!el) return
  el.textContent = count
  el.hidden = count === 0
}

// ══════════════════════════════════════════════
// ROUTER (hash-based)
// ══════════════════════════════════════════════
const ROUTES = {
  '/':          renderHome,
  '/tierlist':  renderTierList,
  '/builder':   renderBuilder,
  '/wiki':      renderWiki,
  '/favorites': renderFavorites,
}

function getRoute() {
  const hash = window.location.hash.replace('#', '') || '/'
  return hash.split('?')[0] || '/'
}

function navigate(path) {
  window.location.hash = '#' + path
}

function router() {
  const path   = getRoute()
  const render = ROUTES[path] || renderHome
  setActiveNav(path)
  const app = document.getElementById('app')
  app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><p>Loading...</p></div>'
  setTimeout(() => render(app), 60)
}

function setActiveNav(path) {
  document.querySelectorAll('.nav-link').forEach(a => {
    const page = a.dataset.page
    const match = (path === '/' && page === 'home') ||
                  (path.startsWith('/' + page) && page !== 'home')
    a.classList.toggle('active', match)
  })
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
const TIER_COLORS = {
  'S+': '#ff9a3c', 'S': '#ff4757', 'A': '#ffd32a',
  'B':  '#2ed573', 'C': '#1e90ff', 'D': '#747d8c'
}
const TIER_ORDER = ['S+','S','A','B','C','D']

function tc(tier) { return TIER_COLORS[tier] || '#747d8c' }

function tierBadgeStyle(tier) {
  const c = tc(tier)
  return `background:${c}22;border-color:${c};color:${c}`
}

function tagHtml(tags) {
  if (!tags?.length) return ''
  return tags.map(t => `<span class="tag tag-${t}">${t}</span>`).join('')
}

function rarityHtml(rarity) {
  if (!rarity) return ''
  const cls = 'rarity-' + rarity.toLowerCase().replace(/\s+/g,'')
  return `<span class="item-rarity ${cls}">${rarity}</span>`
}

function timeAgo(iso) {
  if (!iso) return 'unknown'
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ══════════════════════════════════════════════
// ITEM CARD
// ══════════════════════════════════════════════
function itemCardHtml(item, tier, category) {
  const color    = tc(tier)
  const favored  = isFav(category, item.name)
  const hasExtra = item.location || item.requirements || item.bonuses

  return `
  <div class="item-card" data-name="${esc(item.name)}">
    <div class="item-header">
      <span class="item-emoji">${item.emoji || '🔹'}</span>
      <span class="item-tier-badge" style="${tierBadgeStyle(tier)}">${esc(tier)}</span>
      <button class="fav-star" data-cat="${esc(category)}" data-name="${esc(item.name)}"
        title="${favored ? 'Remove from favorites' : 'Add to favorites'}">
        ${favored ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="item-name">${esc(item.name)}</div>
    ${rarityHtml(item.rarity)}
    ${item.description ? `<div class="item-desc">${esc(item.description)}</div>` : ''}
    ${item.bonuses ? `<div class="item-bonus">${esc(item.bonuses)}</div>` : ''}
    <div class="item-tags">${tagHtml(item.tags)}</div>
    ${hasExtra ? `
      <button class="item-more-btn" data-card="${esc(item.name)}">▼ Where to get</button>
      <div class="item-extra" id="extra-${esc(item.name).replace(/\s/g,'_')}">
        ${item.location ? `<div class="item-extra-row"><div class="item-extra-label">📍 Location</div><div class="item-extra-val">${esc(item.location)}</div></div>` : ''}
        ${item.requirements ? `<div class="item-extra-row"><div class="item-extra-label">📋 Requirements</div><div class="item-extra-val">${esc(item.requirements)}</div></div>` : ''}
      </div>
    ` : ''}
  </div>`
}

// ══════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════
function renderHome(app) {
  const meta = [
    { icon:'🍎', label:'Best Fruit',  val:'Dragon Fruit', tier:'S+' },
    { icon:'⚔️', label:'Best Sword',  val:'Ice Queen',    tier:'S+' },
    { icon:'👊', label:'Best Melee',  val:'Moon Slayer',  tier:'S+' },
    { icon:'🧬', label:'Best Race',   val:'SwordBlessed', tier:'S+' },
    { icon:'✨', label:'Best Trait',  val:'Emperor',      tier:'S+' },
    { icon:'💎', label:'Best Rune',   val:'Havoc Rune',   tier:'S'  },
    { icon:'🏴', label:'Best Clan',   val:'Frostbane',    tier:'S+' },
  ]
  const stats = [
    { val:'60+', label:'Items Tracked' },
    { val:'8',   label:'Categories'    },
    { val:'4',   label:'Fruit Types'   },
    { val:'7',   label:'Build Slots'   },
  ]
  const features = [
    { icon:'🏆', name:'Tier Lists',    desc:'8 full tier lists — Fruits, Swords, Melee, Races, Traits, Runes, Clans & Artifacts with 4 Devil Fruit types.', link:'#/tierlist', cta:'View Tiers' },
    { icon:'🧠', name:'AI Builder',    desc:'Generate 7-slot builds for Farming, Boss fights & PvP using real meta data and synergy detection.', link:'#/builder',  cta:'Generate Build' },
    { icon:'📖', name:'Fandom Wiki',   desc:'Live-connected to the official Sailor Piece Fandom wiki. Articles and game data auto-sync every 30 min.', link:'#/wiki',     cta:'Browse Wiki' },
  ]

  app.innerHTML = `<div class="page">
    <div class="hero">
      <div class="hero-badge">⚓ Ice Update — April 2026 · Sea 2 Coming Soon</div>
      <h1 class="hero-title">
        <span style="color:var(--gold)">Sailor</span><span style="color:var(--cyan)"> Piece</span><br>
        <span style="font-family:'Rajdhani',sans-serif;font-size:38%;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--text-sec)">The Ultimate Hub</span>
      </h1>
      <p class="hero-sub">8 complete tier lists. 7-slot AI builds. Live Fandom wiki. Zero npm — just open and play.</p>
      <div class="hero-ctas">
        <a href="#/tierlist" class="btn btn-primary">🏆 Tier Lists</a>
        <a href="#/builder"  class="btn btn-cyan">🧠 AI Builder</a>
      </div>
      <div class="stats-bar">
        ${stats.map(s => `<div style="text-align:center"><span class="stat-val">${s.val}</span><span class="stat-label">${s.label}</span></div>`).join('')}
      </div>
    </div>

    <div class="section-title" style="margin-top:2.5rem">⚡ Current Meta</div>
    <div class="meta-snap-grid">
      ${meta.map(m => {
        const c = tc(m.tier)
        return `<div class="snap-card">
          <div class="snap-top">
            <span class="snap-icon">${m.icon}</span>
            <span class="snap-tier" style="background:${c}20;color:${c};border:1px solid ${c}44">${m.tier}</span>
          </div>
          <div class="snap-label">${m.label}</div>
          <div class="snap-val">${m.val}</div>
        </div>`
      }).join('')}
    </div>

    <div class="section-title" style="margin-top:2.5rem">What's Inside</div>
    <div class="feature-grid">
      ${features.map(f => `<div class="card feature-card">
        <div class="feature-icon">${f.icon}</div>
        <div class="feature-name">${f.name}</div>
        <p class="feature-desc">${f.desc}</p>
        <a href="${f.link}" class="btn btn-secondary" style="margin-top:1rem">${f.cta} →</a>
      </div>`).join('')}
    </div>

    <div class="sea2-banner" style="margin-top:1.5rem">
      <div>
        <div class="sea2-title">🔜 Sea 2 — 4 new islands · Guilds · Bloodlines · World Bosses · 4 new Melee Specs</div>
        <div class="sea2-sub">Frieren · Castorice · Cosmic Garou · DIO · Easter Event until April 22</div>
      </div>
      <a href="#/wiki" class="btn btn-ghost" style="font-size:.82rem;flex-shrink:0">Track Updates →</a>
    </div>
  </div>`
}

// ══════════════════════════════════════════════
// TIER LIST
// ══════════════════════════════════════════════
const CATEGORIES = [
  { key:'fruits',    label:'🍎 Fruits'     },
  { key:'swords',    label:'⚔️ Swords'     },
  { key:'melee',     label:'👊 Melee Specs' },
  { key:'races',     label:'🧬 Races'       },
  { key:'traits',    label:'✨ Traits'      },
  { key:'runes',     label:'💎 Runes'       },
  { key:'clans',     label:'🏴 Clans'       },
  { key:'artifacts', label:'🏺 Artifacts'   },
]

const CAT_DESCS = {
  fruits:    'Devil Fruits — Elemental, Natural, Beast & Mythical types ranked',
  swords:    'Weapons ranked by DPS, AoE coverage and endgame performance',
  melee:     'Combat specs ranked by burst damage and skill efficiency',
  races:     'Races ranked by stat bonuses and build synergy',
  traits:    'Traits ranked by damage multipliers and cooldown reduction',
  runes:     'Rune bonuses ranked by DPS and farming utility',
  clans:     'Clan passives ranked by combat power and resource bonuses',
  artifacts: 'Artifact sets ranked by stat bonuses and island location',
}

const FRUIT_TYPES = {
  Elemental: { icon:'⚡', color:'#ff9a3c', desc:'Logia — elemental body transform + physical immunity', fruits:['light','flame','ice','magma','darkness','snow'] },
  Natural:   { icon:'🌿', color:'#2ed573', desc:'Paramecia — body modification or environmental power. Highest raw damage.', fruits:['quake','fiend','bomb','invisible','spirit','dark','spin','blood'] },
  Beast:     { icon:'🐉', color:'#a855f7', desc:'Zoan — transform into a creature. Bonus HP + flight + beast moves.', fruits:['dragon','kitsune'] },
  Mythical:  { icon:'✨', color:'#ff4757', desc:'Ancient Zoan — rarest type. Mythological powers.', fruits:['phoenix','nika','spider'] },
}

let tlState = { tab:'fruits', search:'', tier:'all', fruitType:null, collapsed:{} }

function renderTierList(app) {
  app.innerHTML = `<div class="page" id="tl-page">
    <div class="tl-header">
      <div>
        <div class="page-title">Tier Lists</div>
        <div class="page-sub" id="tl-sub">${CAT_DESCS[tlState.tab]}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem">
        ${syncBadgeHtml()}
      </div>
    </div>

    <div class="cat-bar"><div class="cat-tabs" id="cat-tabs">
      ${CATEGORIES.map(c => {
        const count = Object.values(DATA?.[c.key] || {}).flat().length
        return `<button class="cat-tab ${c.key === tlState.tab ? 'active' : ''}" data-cat="${c.key}">
          ${c.label}${count ? `<span class="cat-count">${count}</span>` : ''}
        </button>`
      }).join('')}
    </div></div>

    <div id="ftype-section"></div>

    <div class="tl-controls">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input id="tl-search" class="input" placeholder="Search…" value="${esc(tlState.search)}" />
        <button class="search-clear" id="search-clear" style="display:${tlState.search ? 'block' : 'none'}">✕</button>
      </div>
      <select class="input" id="tier-filter" style="max-width:150px;flex-shrink:0">
        <option value="all" ${tlState.tier==='all'?'selected':''}>All Tiers</option>
        ${TIER_ORDER.map(t => `<option value="${t}" ${tlState.tier===t?'selected':''}>${t} Tier</option>`).join('')}
      </select>
    </div>

    ${codesStripHtml()}
    <div id="tier-rows-wrap"></div>
  </div>`

  renderFtypeSection()
  renderTierRows()
  bindTierListEvents()
}

function syncBadgeHtml() {
  const m = DATA?.meta
  if (!m) return ''
  const ok = m.fandomSuccess
  const c  = ok ? '#2ed573' : '#ffd32a'
  return `<div style="position:relative">
    <button class="sync-badge" id="sync-badge" style="border-color:${c}44;background:${c}10;color:${c}">
      <span style="width:7px;height:7px;border-radius:50%;background:${c};box-shadow:0 0 6px ${c};animation:pulse-dot 2s infinite;display:inline-block"></span>
      ${ok ? '🟢 Fandom Synced' : '🟡 Sync Partial'}
      <span style="color:var(--text-mute);font-size:.68rem">${timeAgo(m.lastScrapedAt || m.lastUpdated)}</span>
    </button>
    <div class="sync-panel" id="sync-panel">
      <div style="font-family:'Pirata One',cursive;color:var(--gold);font-size:1.05rem;margin-bottom:.7rem">⚓ Fandom Sync</div>
      <div class="sync-row"><span class="sync-k">Source</span><a href="https://roblox-sailor-piece.fandom.com" target="_blank" style="color:var(--cyan);font-size:.72rem">fandom.com ↗</a></div>
      <div class="sync-row"><span class="sync-k">Updated</span><span class="sync-v">${m.lastUpdated}</span></div>
      <div class="sync-row"><span class="sync-k">Fandom</span><span class="sync-v" style="color:${c}">${ok ? '✅ Live' : '⚠️ Cached'}</span></div>
      <div class="sync-row"><span class="sync-k">Categories</span><span class="sync-v">${m.categoriesUpdated ?? '—'} updated</span></div>
      <div class="sync-row"><span class="sync-k">Mode</span><span class="sync-v" style="font-family:'JetBrains Mono',monospace;font-size:.68rem">${m.scrapeMode ?? 'manual'}</span></div>
      <div style="margin-top:.7rem;padding-top:.7rem;border-top:1px solid var(--border);font-size:.7rem;color:var(--text-mute);text-align:center">Auto-syncs every 30 min via GitHub Actions + Playwright</div>
    </div>
  </div>`
}

function codesStripHtml() {
  const codes = DATA?.gameMeta?.activeCodes
  if (!codes?.length || tlState.tab !== 'fruits') return ''
  return `<div class="codes-strip">
    <div class="codes-strip-title">🎁 Active Codes — click to copy</div>
    <div class="code-chips" id="code-chips">
      ${codes.map(c => `<button class="code-chip" data-code="${esc(c)}">${esc(c)}</button>`).join('')}
    </div>
  </div>`
}

function renderFtypeSection() {
  const sec = document.getElementById('ftype-section')
  if (!sec || tlState.tab !== 'fruits') { if(sec) sec.innerHTML=''; return }

  const infoHtml = tlState.fruitType ? (() => {
    const ft = FRUIT_TYPES[tlState.fruitType]
    return `<div class="ftype-info" style="border-color:${ft.color}40;background:${ft.color}08">
      <span class="ftype-info-icon">${ft.icon}</span>
      <div>
        <div class="ftype-info-name" style="color:${ft.color}">${tlState.fruitType} (${ft.icon})</div>
        <div class="ftype-info-desc">${ft.desc}</div>
        <div class="ftype-info-pills">
          ${ft.fruits.map(f => `<span class="ftype-pill" style="border-color:${ft.color}44;color:${ft.color}">${f.charAt(0).toUpperCase()+f.slice(1)}</span>`).join('')}
        </div>
      </div>
    </div>`
  })() : ''

  sec.innerHTML = `<div class="ftype-bar">
    <div class="ftype-label">🍎 Fruit Type</div>
    <div class="ftype-btns">
      <button class="ftype-btn ${!tlState.fruitType?'active-all':''}" data-ftype="">All Types</button>
      ${Object.entries(FRUIT_TYPES).map(([k,v]) => `
        <button class="ftype-btn ${tlState.fruitType===k?'active':''}" data-ftype="${k}"
          style="${tlState.fruitType===k?`border-color:${v.color};background:${v.color}18;color:${v.color};box-shadow:0 0 10px ${v.color}40`:''}">
          ${v.icon} ${k}
        </button>
      `).join('')}
    </div>
    ${infoHtml}
  </div>`

  sec.querySelectorAll('[data-ftype]').forEach(btn => {
    btn.addEventListener('click', () => {
      tlState.fruitType = btn.dataset.ftype || null
      renderFtypeSection()
      renderTierRows()
    })
  })
}

function getFruitTypeKey(item) {
  if (item.fruitType) return item.fruitType
  const n = item.name.toLowerCase().replace(' fruit','')
  for (const [type, cfg] of Object.entries(FRUIT_TYPES)) {
    if (cfg.fruits.some(f => n.includes(f) || f.includes(n))) return type
  }
  return null
}

function renderTierRows() {
  const wrap = document.getElementById('tier-rows-wrap')
  if (!wrap || !DATA) return

  const catData = DATA[tlState.tab] || {}
  const q = tlState.search.toLowerCase()

  const rows = TIER_ORDER.filter(tier => {
    if (tlState.tier !== 'all' && tier !== tlState.tier) return false
    return catData[tier]?.length > 0
  })

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><p>No items found</p><button class="btn btn-ghost" id="clear-filters" style="margin-top:.75rem">Clear Filters</button></div>`
    wrap.querySelector('#clear-filters')?.addEventListener('click', () => {
      tlState.search = ''; tlState.tier = 'all'; tlState.fruitType = null
      document.getElementById('tl-search').value = ''
      document.getElementById('tier-filter').value = 'all'
      renderFtypeSection(); renderTierRows()
    })
    return
  }

  wrap.innerHTML = `<div class="tier-rows">
    ${rows.map(tier => {
      let items = catData[tier] || []

      // Fruit type filter
      if (tlState.tab === 'fruits' && tlState.fruitType) {
        items = items.filter(i => getFruitTypeKey(i) === tlState.fruitType)
      }

      // Search filter
      if (q) {
        items = items.filter(i =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.tags?.some(t => t.includes(q))
        )
      }

      if (!items.length) return ''
      const color    = tc(tier)
      const colId    = `${tlState.tab}-${tier}`.replace('+','p')
      const isOpen   = !tlState.collapsed[colId]

      return `<div class="tier-row">
        <div class="tier-row-header" data-col="${colId}">
          <div class="tier-box" style="background:${color}18;border-color:${color};color:${color}">${tier}</div>
          <div class="tier-meta">
            <span class="tier-item-count" style="color:${color}99">${items.length} item${items.length!==1?'s':''}</span>
            <span class="tier-chevron ${isOpen?'open':''}">▾</span>
          </div>
        </div>
        ${isOpen ? `<div class="tier-items">${items.map(item => itemCardHtml(item, tier, tlState.tab)).join('')}</div>` : ''}
      </div>`
    }).join('')}
  </div>`

  bindTierRowEvents(wrap)
}

function bindTierRowEvents(wrap) {
  // Collapse toggle
  wrap.querySelectorAll('.tier-row-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const colId = hdr.dataset.col
      tlState.collapsed[colId] = !tlState.collapsed[colId]
      renderTierRows()
    })
  })
  // Favorites
  wrap.querySelectorAll('.fav-star').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const cat  = btn.dataset.cat
      const name = btn.dataset.name
      const catData = DATA[cat] || {}
      let found = null
      for (const items of Object.values(catData)) {
        found = items.find(i => i.name === name)
        if (found) break
      }
      if (found) {
        toggleFav(cat, found)
        btn.textContent = isFav(cat, name) ? '❤️' : '🤍'
      }
    })
  })
  // Expand card
  wrap.querySelectorAll('.item-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name   = btn.dataset.card
      const extraId = 'extra-' + name.replace(/\s/g,'_')
      const extra  = document.getElementById(extraId)
      const isOpen = extra.classList.toggle('open')
      btn.textContent = isOpen ? '▲ Less info' : '▼ Where to get'
    })
  })
  // Codes copy
  wrap.closest('#app')?.querySelectorAll('.code-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      navigator.clipboard.writeText(chip.dataset.code).catch(()=>{})
      chip.textContent = '✓ Copied!'
      chip.classList.add('copied')
      setTimeout(() => { chip.textContent = chip.dataset.code; chip.classList.remove('copied') }, 1800)
    })
  })
}

function bindTierListEvents() {
  // Category tabs
  document.getElementById('cat-tabs')?.querySelectorAll('.cat-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tlState.tab = btn.dataset.cat
      tlState.search = ''; tlState.tier = 'all'; tlState.fruitType = null
      document.getElementById('tl-search').value = ''
      document.getElementById('tier-filter').value = 'all'
      document.getElementById('tl-sub').textContent = CAT_DESCS[tlState.tab] || ''
      btn.closest('.cat-tabs').querySelectorAll('.cat-tab').forEach(b => b.classList.toggle('active', b===btn))
      const codesArea = document.querySelector('.codes-strip')
      if (codesArea) codesArea.style.display = tlState.tab === 'fruits' ? '' : 'none'
      renderFtypeSection()
      renderTierRows()
    })
  })
  // Search
  const searchEl = document.getElementById('tl-search')
  const clearBtn = document.getElementById('search-clear')
  searchEl?.addEventListener('input', () => {
    tlState.search = searchEl.value
    clearBtn.style.display = tlState.search ? 'block' : 'none'
    renderTierRows()
  })
  clearBtn?.addEventListener('click', () => {
    tlState.search = ''; searchEl.value = ''; clearBtn.style.display = 'none'
    renderTierRows()
  })
  // Tier filter
  document.getElementById('tier-filter')?.addEventListener('change', e => {
    tlState.tier = e.target.value; renderTierRows()
  })
  // Sync badge dropdown
  const badge = document.getElementById('sync-badge')
  const panel = document.getElementById('sync-panel')
  badge?.addEventListener('click', e => { e.stopPropagation(); panel.classList.toggle('open') })
  document.addEventListener('click', () => panel?.classList.remove('open'), { once: false })
}

// ══════════════════════════════════════════════
// AI BUILDER
// ══════════════════════════════════════════════
const BUILD_RULES = {
  farming: {
    icon:'🌾', label:'Farming', desc:'Max drop rate & EXP efficiency',
    tags:  { fruits:['farming','aoe','speed'], swords:['farming'], melee:['farming','aoe'], races:['farming'], traits:['farming'], runes:['farming'], clans:['farming'] },
    priority: ['Kitsune Fruit','Light Fruit','Shadow','Rimuru','Fortune Rune','Radiant Rune','Monarch','Emperor','Kitsune'],
    tip:'Stack Kitsune Race + Fortune Rune + Monarch Clan for triple luck. Use Abyssal Empress for AFK grinding.',
    fullDesc:'Max drop rate and EXP efficiency. Kitsune Lucky Multiplier + Fortune/Radiant Runes for the highest rare drop chance.',
  },
  boss: {
    icon:'🐉', label:'Boss Fight', desc:'Burst damage for raid bosses',
    tags:  { fruits:['boss','pvp','aoe'], swords:['boss','pvp'], melee:['boss','pvp'], races:['boss'], traits:['boss'], runes:['boss'], clans:['boss'] },
    priority: ['Shadow Monarch','Ice Queen','Atomic','Dragon Fruit','Moon Slayer','Havoc Rune','Frostbane','Emperor','Celestial'],
    tip:'Frostbane clan stacks damage over a long fight. Use Conqueror\'s Haki on pull for AoE stun.',
    fullDesc:'Maximum burst for raid bosses. Shadow Monarch + Havoc Rune 82% boost + Frostbane stacking = fastest kills.',
  },
  pvp: {
    icon:'⚔️', label:'PvP Meta', desc:'Meta loadout for player combat',
    tags:  { fruits:['pvp','speed'], swords:['pvp','boss'], melee:['pvp'], races:['pvp'], traits:['pvp','boss'], runes:['pvp'], clans:['pvp'] },
    priority: ['Light Fruit','Ice Queen','Yamato','Moon Slayer','Emperor','Swordblessed','SwordBlessed','Havoc Rune','Alter','Upper','Warlord'],
    tip:'Emperor Trait slashes cooldowns — spam skills faster than enemies can dodge. Light flight makes you impossible to pin down.',
    fullDesc:'Meta PvP — Light speed + Emperor cooldowns + top DPS sword + stacking clan passives.',
  }
}

const SLOTS = [
  { key:'fruits',  cat:'fruits',  label:'Devil Fruit', icon:'🍎' },
  { key:'swords',  cat:'swords',  label:'Sword',        icon:'⚔️' },
  { key:'melee',   cat:'melee',   label:'Melee Spec',   icon:'👊' },
  { key:'races',   cat:'races',   label:'Race',          icon:'🧬' },
  { key:'traits',  cat:'traits',  label:'Trait',         icon:'✨' },
  { key:'runes',   cat:'runes',   label:'Rune',          icon:'💎' },
  { key:'clans',   cat:'clans',   label:'Clan',          icon:'🏴' },
]

const TW = { 'S+':100,'S':80,'A':60,'B':40,'C':20,'D':5 }

function bestItem(catKey, buildType) {
  const rule  = BUILD_RULES[buildType]
  const tags  = rule.tags[catKey] || []
  const catData = DATA?.[catKey] || {}
  let best = null, bestScore = -1
  for (const [tier, items] of Object.entries(catData)) {
    for (const item of (items || [])) {
      let score = TW[tier] || 0
      score += ((item.tags || []).filter(t => tags.includes(t)).length) * 18
      if (rule.priority.some(p => item.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(item.name.toLowerCase()))) score += 32
      if (score > bestScore) { bestScore = score; best = { ...item, tier, score } }
    }
  }
  return best
}

function findSynergy(buildType, picks) {
  const names = picks.filter(Boolean).map(p => p.name)
  return (DATA?.synergies || [])
    .filter(s => s.type === buildType)
    .map(s => ({ ...s, overlap: s.items.filter(n => names.some(p => p.includes(n)||n.includes(p))).length }))
    .sort((a,b) => b.overlap - a.overlap)[0] || null
}

function generateBuild(type) {
  const picks = SLOTS.map(s => bestItem(s.cat, type))
  const synergy = findSynergy(type, picks)
  const avg = picks.filter(Boolean).reduce((s,i)=>s+(i.score||0),0)/picks.filter(Boolean).length
  const rating = avg >= 80 ? 'S+' : avg >= 60 ? 'S' : avg >= 40 ? 'A' : 'B'
  return { type, picks, synergy, rating }
}

let builderType = 'pvp'

function renderBuilder(app) {
  app.innerHTML = `<div class="page builder-page">
    <div class="page-title">🧠 AI Build Generator</div>
    <div class="page-sub">Rule-based optimizer — 7 slots: Fruit · Sword · Melee · Race · Trait · Rune · Clan</div>

    <div class="build-types" id="build-types">
      ${Object.entries(BUILD_RULES).map(([k,v]) => `
        <button class="build-type-btn ${k===builderType?'active':''}" data-build="${k}">
          <span class="bt-icon">${v.icon}</span>
          <span class="bt-label">${v.label}</span>
          <span class="bt-desc">${v.desc}</span>
        </button>
      `).join('')}
    </div>

    <div class="gen-section">
      <button class="btn btn-primary gen-btn" id="gen-btn">⚡ Generate ${BUILD_RULES[builderType].label} Build</button>
    </div>

    <div id="build-output"></div>
  </div>`

  document.querySelectorAll('[data-build]').forEach(btn => {
    btn.addEventListener('click', () => {
      builderType = btn.dataset.build
      document.querySelectorAll('[data-build]').forEach(b => b.classList.toggle('active', b===btn))
      document.getElementById('gen-btn').textContent = `⚡ Generate ${BUILD_RULES[builderType].label} Build`
      document.getElementById('build-output').innerHTML = ''
    })
  })

  document.getElementById('gen-btn').addEventListener('click', () => {
    const out = document.getElementById('build-output')
    out.innerHTML = `<div style="text-align:center;padding:1.5rem"><div class="build-loading-bar"></div><p style="color:var(--text-mute)">Scoring all items…</p></div>`
    setTimeout(() => {
      const result = generateBuild(builderType)
      renderBuildResult(out, result)
    }, 900)
  })
}

function renderBuildResult(out, result) {
  const rule  = BUILD_RULES[result.type]
  const rc    = tc(result.rating)

  out.innerHTML = `
    <div style="animation:fadeUp .4s ease">
      <div class="build-result-header">
        <div>
          <div class="build-result-title">${rule.icon} ${rule.label} Build</div>
          <div class="build-result-desc">${rule.fullDesc}</div>
        </div>
        <div class="build-rating-box" style="border-color:${rc};background:${rc}18;color:${rc}">
          <span class="build-rating-label">Rating</span>
          <span class="build-rating-value">${result.rating}</span>
        </div>
      </div>

      <div class="build-slots">
        ${SLOTS.map((slot, i) => buildSlotHtml(slot, result.picks[i])).join('')}
      </div>

      ${result.synergy ? synergyHtml(result.synergy) : ''}

      <div class="pro-tip">
        <span class="pro-tip-label">💡 Pro Tip</span>
        <span class="pro-tip-text">${rule.tip}</span>
      </div>
    </div>`

  // Bind save buttons
  out.querySelectorAll('.bs-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat  = btn.dataset.cat
      const name = btn.dataset.name
      const catData = DATA[cat] || {}
      let found = null
      for (const items of Object.values(catData)) { found = items.find(i=>i.name===name); if(found) break }
      if (found) {
        toggleFav(cat, found)
        btn.textContent = isFav(cat, name) ? '❤️ Saved' : '🤍 Save'
        btn.classList.toggle('saved', isFav(cat, name))
      }
    })
  })
}

function buildSlotHtml(slot, item) {
  if (!item) return `<div class="build-slot" style="opacity:.5;display:flex;align-items:center;justify-content:center;min-height:90px;flex-direction:column;gap:.35rem"><span style="font-size:1.4rem">${slot.icon}</span><span style="font-size:.8rem;color:var(--text-mute)">${slot.label} — not found</span></div>`
  const color = tc(item.tier)
  const saved = isFav(slot.cat, item.name)
  return `<div class="build-slot" style="border-color:${color}40">
    <div class="bs-top">
      <span class="bs-cat">${slot.icon} ${slot.label}</span>
      <span class="bs-tier" style="background:${color}22;color:${color};border:1px solid ${color}55">${item.tier}</span>
    </div>
    <div class="bs-name"><span>${item.emoji||'🔹'}</span>${esc(item.name)}</div>
    ${item.description ? `<div class="bs-desc">${esc(item.description.split('.')[0])}.</div>` : ''}
    ${item.bonuses ? `<div class="bs-bonus">${esc(item.bonuses)}</div>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:.28rem;margin-top:.3rem">${tagHtml(item.tags)}</div>
    <button class="bs-save ${saved?'saved':''}" data-cat="${esc(slot.cat)}" data-name="${esc(item.name)}">${saved?'❤️ Saved':'🤍 Save'}</button>
  </div>`
}

function synergyHtml(syn) {
  if (!syn) return ''
  const rc = tc(syn.rating)
  return `<div class="synergy-box">
    <div class="syn-header">
      <span class="syn-label">⚡ Synergy Detected</span>
      <span class="syn-name">${esc(syn.name)}</span>
      ${syn.rating ? `<span style="color:${rc};font-family:'Pirata One',cursive;font-size:1rem">${syn.rating}</span>` : ''}
    </div>
    <div class="syn-desc">${esc(syn.description)}</div>
    <div class="syn-items">${syn.items.map(i=>`<span class="syn-item">${esc(i)}</span>`).join('')}</div>
  </div>`
}

// ══════════════════════════════════════════════
// WIKI PAGE
// ══════════════════════════════════════════════
const WIKI_PAGES = [
  { title:'Fruits',    emoji:'🍎', desc:'All Devil Fruits — types, abilities and how to obtain' },
  { title:'Swords',    emoji:'⚔️', desc:'All Swords — progression path and stat breakdowns' },
  { title:'Races',     emoji:'🧬', desc:'All Races — stat bonuses and how to reroll' },
  { title:'Clan',      emoji:'🏴', desc:'All Clans — passive bonuses and rarities' },
  { title:'Trait',     emoji:'✨', desc:'All Traits — damage and cooldown bonuses' },
  { title:'Artifacts', emoji:'🏺', desc:'Artifact sets — stats and island locations' },
  { title:'Codes',     emoji:'🎁', desc:'Active codes — free rewards and how to redeem' },
  { title:'Titles',    emoji:'🏅', desc:'All Titles — requirements and stat buffs' },
]

let wikiActive = null

function renderWiki(app) {
  app.innerHTML = buildWikiHtml()
  bindWikiEvents()
}

function buildWikiHtml() {
  return `<div class="page" id="wiki-page">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap">
      <div>
        <div class="page-title">📖 Fandom Wiki</div>
        <div class="page-sub">Live-connected to the official Sailor Piece Fandom wiki</div>
      </div>
      <a href="https://roblox-sailor-piece.fandom.com/wiki/Sailor_Piece_Wiki" target="_blank" rel="noopener" class="btn btn-secondary" style="font-size:.85rem">🔗 Open Full Wiki ↗</a>
    </div>

    <div class="fandom-banner">
      <div class="fandom-banner-left">
        <div class="fandom-dot"></div>
        <div>
          <div class="fandom-title">Connected to roblox-sailor-piece.fandom.com</div>
          <div class="fandom-sub">Articles load live from Fandom. Auto-sync runs every 30 min via GitHub Actions + Playwright.</div>
        </div>
      </div>
      <a href="https://roblox-sailor-piece.fandom.com/wiki/Sailor_Piece_Wiki" target="_blank" rel="noopener" class="btn btn-ghost" style="font-size:.8rem">Contribute ↗</a>
    </div>

    <div class="wiki-grid" id="wiki-grid">
      ${WIKI_PAGES.map(p => `
        <button class="wiki-card" data-wiki="${p.title}">
          <span class="wiki-card-emoji">${p.emoji}</span>
          <div>
            <div class="wiki-card-title">${p.title}</div>
            <div class="wiki-card-desc">${p.desc}</div>
          </div>
          <span class="wiki-card-arrow">→</span>
        </button>
      `).join('')}
    </div>

    <div id="wiki-article-wrap" style="margin-top:1.5rem"></div>
  </div>`
}

function bindWikiEvents() {
  document.querySelectorAll('[data-wiki]').forEach(btn => {
    btn.addEventListener('click', () => openWikiPage(btn.dataset.wiki))
  })
}

function openWikiPage(title) {
  const info = WIKI_PAGES.find(p => p.title === title)
  if (!info) return
  const wrap = document.getElementById('wiki-article-wrap')
  if (!wrap) return

  wrap.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-mute)">
    <div class="spinner"></div>Loading ${title} from Fandom…
  </div>`

  // Scroll into view
  wrap.scrollIntoView({ behavior:'smooth', block:'start' })

  // Show iframe with Fandom page
  setTimeout(() => {
    const iframeUrl = `https://roblox-sailor-piece.fandom.com/wiki/${encodeURIComponent(title)}`
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.75rem;flex-wrap:wrap">
        <div style="font-family:'Pirata One',cursive;font-size:1.5rem;color:var(--gold)">${info.emoji} ${title}</div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-ghost" id="wiki-back" style="font-size:.82rem">← All Pages</button>
          <a href="${iframeUrl}" target="_blank" rel="noopener" class="btn btn-secondary" style="font-size:.82rem">Open in Fandom ↗</a>
        </div>
      </div>
      <div class="wiki-iframe-wrap">
        <div class="wiki-iframe-notice">
          <span>🌐</span>
          <span>Live page from roblox-sailor-piece.fandom.com</span>
        </div>
        <iframe
          src="${iframeUrl}"
          class="wiki-iframe"
          title="${title} — Sailor Piece Wiki"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        ></iframe>
      </div>`

    document.getElementById('wiki-back')?.addEventListener('click', () => {
      wrap.innerHTML = ''
      window.scrollTo({ top: 0, behavior:'smooth' })
    })
  }, 400)
}

// ══════════════════════════════════════════════
// FAVORITES PAGE
// ══════════════════════════════════════════════
const CAT_ICONS = {
  fruits:'🍎', swords:'⚔️', melee:'👊', races:'🧬',
  traits:'✨', runes:'💎',  clans:'🏴', artifacts:'🏺'
}
const CAT_LABELS = {
  fruits:'Fruits', swords:'Swords', melee:'Melee Specs', races:'Races',
  traits:'Traits', runes:'Runes',   clans:'Clans',        artifacts:'Artifacts'
}

function renderFavorites(app) {
  const grouped = Object.fromEntries(
    Object.entries(FAVORITES).filter(([,items]) => items.length > 0)
  )
  const totalCount = Object.values(FAVORITES).flat().length
  const ordered = Object.keys(CAT_ICONS).filter(k => grouped[k])

  app.innerHTML = `<div class="page">
    <div class="fav-header">
      <div>
        <div class="page-title">❤️ Favorites</div>
        <div class="page-sub">${totalCount > 0
          ? `${totalCount} saved item${totalCount!==1?'s':''} across ${ordered.length} categor${ordered.length!==1?'ies':'y'} — stored locally`
          : 'No favorites saved yet'
        }</div>
      </div>
      ${totalCount > 0 ? `<button class="btn btn-danger" id="clear-all-favs">🗑️ Clear All</button>` : ''}
    </div>

    ${totalCount === 0 ? `<div class="empty-state">
      <div class="emoji">💔</div>
      <p style="font-family:'Pirata One',cursive;font-size:1.4rem;color:var(--text-sec)">No Favorites Yet</p>
      <p>Browse the Tier List and click 🤍 on any card to save items here.</p>
      <a href="#/tierlist" class="btn btn-secondary" style="margin-top:.75rem">Browse Tier Lists →</a>
    </div>` : ordered.map(cat => `
      <div class="fav-section">
        <div class="fav-sec-title">
          ${CAT_ICONS[cat]} ${CAT_LABELS[cat]}
          <span class="fav-sec-count">${grouped[cat].length}</span>
        </div>
        <div class="fav-grid">
          ${grouped[cat].map(item => favCardHtml(item, cat)).join('')}
        </div>
      </div>
    `).join('')}
  </div>`

  document.getElementById('clear-all-favs')?.addEventListener('click', () => {
    if (confirm('Clear all favorites?')) {
      FAVORITES = {}; saveFavs()
      renderFavorites(document.getElementById('app'))
    }
  })

  document.querySelectorAll('.fav-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat  = btn.dataset.cat
      const name = btn.dataset.name
      FAVORITES[cat] = (FAVORITES[cat] || []).filter(i => i.name !== name)
      saveFavs()
      renderFavorites(document.getElementById('app'))
    })
  })
}

function favCardHtml(item, category) {
  const color = tc(item.tier)
  return `<div class="fav-card" style="border-color:${color}33">
    <div class="fav-card-top">
      <span class="fav-emoji">${item.emoji || '🔹'}</span>
      <div style="flex:1;min-width:0">
        <div class="fav-name">${esc(item.name)}</div>
        <div class="fav-cat">${CAT_ICONS[category]||'📦'} ${CAT_LABELS[category]||category}</div>
      </div>
      <span class="fav-tier" style="background:${color}22;color:${color};border:1px solid ${color}44">${item.tier}</span>
    </div>
    ${item.description ? `<div class="fav-desc">${esc(item.description.split('.')[0])}.</div>` : ''}
    ${item.bonuses ? `<div style="font-size:.7rem;color:var(--cyan);font-family:'JetBrains Mono',monospace;margin-bottom:.25rem">${esc(item.bonuses)}</div>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:.28rem;margin:.35rem 0">${tagHtml(item.tags)}</div>
    <button class="fav-remove" data-cat="${esc(category)}" data-name="${esc(item.name)}">✕ Remove</button>
  </div>`
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════


// ══════════════════════════════════════════════
// AUTH — simple client-side session
// NOTE: Static site auth is display-only. Source
// is public on GitHub. This gates the UI only.
// ══════════════════════════════════════════════
const AUTH = {
  _CREDS: { id: 'DemonJuwel', pw: 'Juelsk@1234' },
  _key: 'sp_admin_session',

  check(id, pw) {
    return id === this._CREDS.id && pw === this._CREDS.pw
  },
  login(id, pw) {
    if (!this.check(id, pw)) return false
    sessionStorage.setItem(this._key, btoa(id + ':' + Date.now()))
    return true
  },
  logout() {
    sessionStorage.removeItem(this._key)
    updateAdminNav()
  },
  isLoggedIn() {
    return !!sessionStorage.getItem(this._key)
  }
}

function updateAdminNav() {
  const icon = document.getElementById('admin-nav-icon')
  if (icon) icon.textContent = AUTH.isLoggedIn() ? '🛡️' : '🔒'
}

// ══════════════════════════════════════════════
// ADMIN STORE — items added/removed by admin
// ══════════════════════════════════════════════
const AdminStore = {
  _key: 'sp_admin_items',
  _delKey: 'sp_admin_deleted',

  getAdded() {
    try { return JSON.parse(localStorage.getItem(this._key) || '{}') } catch { return {} }
  },
  getDeleted() {
    try { return JSON.parse(localStorage.getItem(this._delKey) || '[]') } catch { return [] }
  },
  addItem(category, tier, item) {
    const store = this.getAdded()
    if (!store[category]) store[category] = {}
    if (!store[category][tier]) store[category][tier] = []
    // Prevent duplicates
    if (!store[category][tier].some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
      store[category][tier].push({ ...item, _source: 'admin', _addedAt: new Date().toISOString() })
    }
    localStorage.setItem(this._key, JSON.stringify(store))
  },
  removeAdminItem(category, tier, name) {
    const store = this.getAdded()
    if (store[category]?.[tier]) {
      store[category][tier] = store[category][tier].filter(i => i.name !== name)
    }
    localStorage.setItem(this._key, JSON.stringify(store))
  },
  deleteDataItem(category, tier, name) {
    // Mark a data.json item as deleted
    const del = this.getDeleted()
    const key = `${category}::${tier}::${name}`
    if (!del.includes(key)) del.push(key)
    localStorage.setItem(this._delKey, JSON.stringify(del))
  },
  restoreDataItem(category, tier, name) {
    const del = this.getDeleted().filter(k => k !== `${category}::${tier}::${name}`)
    localStorage.setItem(this._delKey, JSON.stringify(del))
  },
  isDeleted(category, tier, name) {
    return this.getDeleted().includes(`${category}::${tier}::${name}`)
  },
  // Merge admin additions + deletions on top of data.json data
  getMergedCategory(category) {
    const base = DATA?.[category] || {}
    const added = this.getAdded()[category] || {}
    const merged = {}

    // Copy base items, excluding deleted ones
    for (const [tier, items] of Object.entries(base)) {
      merged[tier] = items.filter(item => !this.isDeleted(category, tier, item.name))
    }

    // Add admin items
    for (const [tier, items] of Object.entries(added)) {
      if (!merged[tier]) merged[tier] = []
      for (const item of items) {
        if (!merged[tier].some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
          merged[tier].push(item)
        }
      }
    }

    return merged
  }
}

// ══════════════════════════════════════════════
// BLOG STORE
// ══════════════════════════════════════════════
const BlogStore = {
  _key: 'sp_blog_posts',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]') }
    catch { return [] }
  },
  save(posts) {
    localStorage.setItem(this._key, JSON.stringify(posts))
  },
  add(post) {
    const posts = this.getAll()
    const newPost = {
      id: Date.now().toString(),
      title: post.title,
      category: post.category,
      excerpt: post.excerpt,
      body: post.body,
      author: post.author || 'DemonJuwel',
      date: new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }),
      createdAt: new Date().toISOString(),
    }
    posts.unshift(newPost)
    this.save(posts)
    return newPost
  },
  remove(id) {
    this.save(this.getAll().filter(p => p.id !== id))
  },
  getById(id) {
    return this.getAll().find(p => p.id === id) || null
  },
  update(id, data) {
    const posts = this.getAll().map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
    this.save(posts)
  }
}

// Default blog posts (shown before admin adds content)
function seedDefaultPosts() {
  if (BlogStore.getAll().length > 0) return
  const defaults = [
    {
      title: 'Ice Queen Update — What Changed',
      category: 'update',
      excerpt: 'The Ice Update dropped April 8, 2026 and shook up the entire meta. New sword, new clan, new race — here is everything you need to know.',
      body: `## Ice Queen Update Breakdown\n\nThe Ice Update released on **April 8, 2026** and brought some massive changes to the Sailor Piece meta.\n\n## What's New\n\n**Ice Queen Sword (S+ Tier)**\nThe new top sword in the game. It features the best AoE and burst damage with incredibly low cooldowns. Obtainable from the Frost Boss on Boss Island — requires the Frost Empress title.\n\n**Frostbane Clan (S+ Tier)**\nNew S+ clan with +40% DMG, +47% HP, and +10% Sword DMG. The passive stacks damage over time making it devastating for long boss fights.\n\n**Luckborn Race (S+ Tier)**\nThe new best race for farming. Gives the highest luck stat bonus of all races plus melee and sword damage boosts.\n\n## Meta Impact\n\nLight Fruit remains the best Legendary fruit, but Dragon, Fiend, and Kitsune now dominate the S+ tier. If you're grinding, reroll to Luckborn ASAP.`,
      author: 'DemonJuwel',
    },
    {
      title: 'Best PvP Build Guide 2026',
      category: 'guide',
      excerpt: 'Struggling in PvP? This complete build guide covers the exact Fruit, Sword, Race, Trait, Rune, and Clan combo to dominate every fight.',
      body: `## Best PvP Build 2026\n\nPvP in Sailor Piece is all about burst damage, mobility, and cooldown management. Here is the complete meta build.\n\n## The Build\n\n**Fruit:** Light Fruit — the best mobility in the game. V move is an escape tool and the flight lets you control positioning.\n\n**Sword:** Ice Queen or Yamato — both have incredible burst damage and large AoE hitboxes.\n\n**Race:** SwordBlessed — +20% Sword DMG Multiplier is the highest of any race.\n\n**Trait:** Emperor — best damage boost AND best cooldown reduction in the game. Non-negotiable.\n\n**Rune:** Havoc Rune — 82% damage boost. If you don't have it, use Wrath Rune.\n\n**Clan:** Frostbane or Upper — both have stacking damage passives that reward aggressive play.\n\n## Tips\n\n- Always activate Armament Haki before engaging\n- Use Light V move to reset positioning\n- Chain your skills without pausing — Emperor trait means you can spam`,
      author: 'DemonJuwel',
    },
    {
      title: 'Sea 2 — Everything We Know',
      category: 'news',
      excerpt: 'Sea 2 is the biggest Sailor Piece update ever. 4 new islands, Guilds, Bloodlines, World Bosses, and 4 new Melee Specs. Full breakdown inside.',
      body: `## Sea 2 Update — Full Info\n\nSea 2 is confirmed as the biggest Sailor Piece update ever. Originally planned for April 16, 2026, it was delayed to mid-late April to ensure quality.\n\n## Confirmed Features\n\n**4 New Islands**\n- JoJo Island (Part 5 / Golden Wind Roman theme confirmed)\n- More islands teased but not named yet\n\n**Guilds System**\n- 15–150 members per guild\n- Guild leaderboard with points system\n- Leaderboard rewards for top guilds\n\n**World Bosses**\n- 30 minute spawn timer\n- No pity system\n- Can drop spec directly\n\n**Sea Beasts**\n- Spawn in the Second Sea every hour\n- Bounty system now affects spawn rate\n\n**4 New Melee Specs**\n- Frieren\n- Castorice  \n- Cosmic Garou\n- DIO\n\n**Bloodlines**\n- New gacha lineage system\n\n**Easter Event**\nActive until April 22, 2026.\n\n## Sea 2 Enemy Stats\n- Sea 2 NPCs have 25% DMG reduction\n- Sea 2 Bosses have 35% DMG reduction\n- Build accordingly!`,
      author: 'DemonJuwel',
    },
  ]
  defaults.forEach(p => BlogStore.add(p))
}

// ══════════════════════════════════════════════
// BLOG PAGE
// ══════════════════════════════════════════════
let blogActivePost = null

function renderBlog(app) {
  seedDefaultPosts()
  if (blogActivePost) {
    renderBlogPost(app, blogActivePost)
    return
  }
  renderBlogList(app)
}

const CAT_BLOG_COLORS = {
  update: 'cat-update', guide: 'cat-guide', meta: 'cat-meta',
  news: 'cat-news', tips: 'cat-tips'
}

function renderBlogList(app) {
  const posts = BlogStore.getAll()

  app.innerHTML = `<div class="page blog-page">
    <div class="blog-header">
      <div>
        <div class="page-title">📝 Blog</div>
        <div class="page-sub">Updates, guides, meta breakdowns & news from the Sailor Piece community</div>
      </div>
      ${AUTH.isLoggedIn() ? `<a href="#/admin" class="btn btn-purple" style="font-size:.85rem">✏️ Manage Posts</a>` : ''}
    </div>

    ${posts.length === 0 ? `
      <div class="blog-empty-state">
        <div class="blog-empty-emoji">📝</div>
        <div class="blog-empty-title">No posts yet</div>
        <p style="color:var(--text-mute)">Check back soon for guides, meta updates, and news.</p>
      </div>
    ` : `
      <div class="blog-grid" id="blog-grid">
        ${posts.map(post => blogCardHtml(post)).join('')}
      </div>
    `}
  </div>`

  app.querySelectorAll('.blog-card').forEach(card => {
    card.addEventListener('click', () => {
      blogActivePost = card.dataset.postId
      renderBlogPost(app, blogActivePost)
    })
  })
  app.querySelectorAll('.blog-read-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      blogActivePost = btn.dataset.postId
      renderBlogPost(app, blogActivePost)
    })
  })
}

function blogCardHtml(post) {
  const catCls = CAT_BLOG_COLORS[post.category] || 'cat-tips'
  const excerpt = post.excerpt || post.body?.replace(/[#*`\n]/g, ' ').slice(0, 120) + '...'
  return `<div class="blog-card" data-post-id="${post.id}">
    <div class="blog-card-top">
      <div class="blog-cat-badge ${catCls}">${post.category || 'post'}</div>
      <div class="blog-card-title">${esc(post.title)}</div>
      <div class="blog-card-excerpt">${esc(excerpt)}</div>
    </div>
    <div class="blog-card-foot">
      <span class="blog-author">✍️ ${esc(post.author || 'DemonJuwel')}</span>
      <span class="blog-date">${esc(post.date || '')}</span>
      <button class="blog-read-btn" data-post-id="${post.id}">Read →</button>
    </div>
  </div>`
}

function renderBlogPost(app, id) {
  const post = BlogStore.getById(id)
  if (!post) { blogActivePost = null; renderBlogList(app); return }

  const catCls = CAT_BLOG_COLORS[post.category] || 'cat-tips'
  // Simple markdown-like rendering
  const bodyHtml = renderMarkdown(post.body || '')

  app.innerHTML = `<div class="page blog-page">
    <div class="blog-post-wrap">
      <button class="blog-post-back" id="blog-back">← Back to Blog</button>
      <div class="blog-post-cat"><span class="blog-cat-badge ${catCls}">${post.category || 'post'}</span></div>
      <h1 class="blog-post-title">${esc(post.title)}</h1>
      <div class="blog-post-meta">
        <span>✍️ ${esc(post.author || 'DemonJuwel')}</span>
        <span>📅 ${esc(post.date || '')}</span>
        ${post.updatedAt ? `<span>✏️ Updated</span>` : ''}
      </div>
      <div class="blog-post-body">${bodyHtml}</div>
      <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border)">
        <button class="blog-post-back" id="blog-back2">← Back to Blog</button>
      </div>
    </div>
  </div>`

  app.querySelector('#blog-back')?.addEventListener('click', () => {
    blogActivePost = null; renderBlogList(app)
  })
  app.querySelector('#blog-back2')?.addEventListener('click', () => {
    blogActivePost = null; renderBlogList(app)
  })
}

function renderMarkdown(md) {
  // Very basic markdown renderer
  return md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .split('\n\n').map(para => {
      const trimmed = para.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul')) return trimmed
      return `<p>${trimmed.replace(/\n/g, ' ')}</p>`
    }).join('\n')
}

// ══════════════════════════════════════════════
// ADMIN PAGE
// ══════════════════════════════════════════════
let adminTab = 'items'

function renderAdmin(app) {
  if (!AUTH.isLoggedIn()) {
    renderAdminLogin(app)
  } else {
    renderAdminPanel(app)
  }
}

function renderAdminLogin(app) {
  app.innerHTML = `<div class="page admin-login-wrap">
    <div class="admin-login-box">
      <div class="admin-login-icon">🛡️</div>
      <div class="admin-login-title">Admin Panel</div>
      <div class="admin-login-sub">Sailor Piece Hub — Restricted Access</div>

      <div class="admin-error" id="login-error">❌ Invalid credentials. Try again.</div>

      <div class="admin-field">
        <label>User ID</label>
        <input type="text" class="admin-input" id="login-id" placeholder="Enter user ID" autocomplete="username" />
      </div>
      <div class="admin-field">
        <label>Password</label>
        <input type="password" class="admin-input" id="login-pw" placeholder="Enter password" autocomplete="current-password" />
      </div>

      <button class="admin-login-btn" id="login-btn">🔓 Login</button>
    </div>
  </div>`

  const doLogin = () => {
    const id = document.getElementById('login-id').value.trim()
    const pw = document.getElementById('login-pw').value
    const err = document.getElementById('login-error')
    if (AUTH.login(id, pw)) {
      updateAdminNav()
      renderAdminPanel(app)
    } else {
      err.classList.add('show')
      document.getElementById('login-pw').value = ''
      setTimeout(() => err.classList.remove('show'), 3000)
    }
  }

  document.getElementById('login-btn').addEventListener('click', doLogin)
  document.getElementById('login-pw').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin() })
  document.getElementById('login-id').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-pw').focus() })
}

function renderAdminPanel(app) {
  app.innerHTML = `<div class="page admin-page">
    <div class="admin-header">
      <div>
        <div class="page-title" style="color:#c084fc">🛡️ Admin Panel</div>
        <div class="page-sub">Manage tier list content and blog posts</div>
      </div>
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
        <span class="admin-badge">🟢 Logged in as DemonJuwel</span>
        <button class="btn btn-danger" id="logout-btn">🔒 Logout</button>
      </div>
    </div>

    <div class="admin-tabs" id="admin-tabs">
      <button class="admin-tab ${adminTab==='items'?'active':''}"   data-tab="items">📦 Manage Items</button>
      <button class="admin-tab ${adminTab==='blog'?'active':''}"    data-tab="blog">📝 Manage Blog</button>
      <button class="admin-tab ${adminTab==='deleted'?'active':''}" data-tab="deleted">🗑️ Deleted Items</button>
    </div>

    <div id="admin-panel-body"></div>
  </div>`

  document.getElementById('logout-btn').addEventListener('click', () => {
    AUTH.logout()
    renderAdminLogin(app)
  })
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      adminTab = btn.dataset.tab
      document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b===btn))
      renderAdminTabContent(app)
    })
  })
  renderAdminTabContent(app)
}

function renderAdminTabContent(app) {
  const body = document.getElementById('admin-panel-body')
  if (!body) return
  if (adminTab === 'items')   renderAdminItems(body)
  if (adminTab === 'blog')    renderAdminBlog(body, app)
  if (adminTab === 'deleted') renderAdminDeleted(body)
}

// ── ADMIN: Manage Items ──────────────────────
const ADMIN_CATEGORIES = [
  { key:'fruits',    label:'Fruits'     },
  { key:'swords',    label:'Swords'     },
  { key:'melee',     label:'Melee Specs'},
  { key:'races',     label:'Races'      },
  { key:'traits',    label:'Traits'     },
  { key:'runes',     label:'Runes'      },
  { key:'clans',     label:'Clans'      },
  { key:'artifacts', label:'Artifacts'  },
]

let adminItemCat = 'fruits'
let adminItemSearch = ''

function renderAdminItems(body) {
  const totalAdmin = Object.values(AdminStore.getAdded()).flat().length
  const totalDel   = AdminStore.getDeleted().length

  body.innerHTML = `
    <!-- Add item form -->
    <div class="admin-form-card">
      <div class="admin-form-title">➕ Add New Item</div>
      <div class="admin-form-grid">
        <div class="admin-form-field">
          <label>Category</label>
          <select class="admin-select" id="add-cat">
            ${ADMIN_CATEGORIES.map(c => `<option value="${c.key}" ${c.key===adminItemCat?'selected':''}>${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="admin-form-field">
          <label>Tier</label>
          <select class="admin-select" id="add-tier">
            ${TIER_ORDER.map(t => `<option value="${t}">${t} Tier</option>`).join('')}
          </select>
        </div>
        <div class="admin-form-field">
          <label>Item Name *</label>
          <input class="input" id="add-name" placeholder="e.g. Dragon Fruit" />
        </div>
        <div class="admin-form-field">
          <label>Emoji</label>
          <input class="input" id="add-emoji" placeholder="🔹" maxlength="4" />
        </div>
        <div class="admin-form-field">
          <label>Rarity</label>
          <select class="admin-select" id="add-rarity">
            <option value="">— none —</option>
            <option value="Mythic">Mythic</option>
            <option value="Legendary">Legendary</option>
            <option value="Rare">Rare</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Common">Common</option>
          </select>
        </div>
        <div class="admin-form-field">
          <label>Tags (comma-sep)</label>
          <input class="input" id="add-tags" placeholder="pvp, boss, farming" />
        </div>
      </div>
      <div class="admin-form-field" style="margin-bottom:1rem">
        <label>Description</label>
        <input class="input" id="add-desc" placeholder="Short description of the item..." />
      </div>
      <div class="admin-form-field" style="margin-bottom:1rem">
        <label>Location / Where to Get</label>
        <input class="input" id="add-loc" placeholder="e.g. Boss Island — drop from Frost Boss" />
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <button class="admin-submit-btn" id="add-item-btn">➕ Add Item</button>
        <div class="admin-success" id="add-success">✅ Item added successfully!</div>
      </div>
    </div>

    <!-- Items list -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
      <div class="section-title" style="font-size:1.3rem;margin:0">📋 All Items</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">
        <span class="admin-count-badge">${totalAdmin} admin-added</span>
        ${totalDel>0?`<span class="admin-count-badge" style="background:rgba(255,71,87,0.1);border-color:rgba(255,71,87,0.25);color:#ff6b7a">${totalDel} hidden</span>`:''}
      </div>
    </div>

    <div class="admin-search-row">
      <div class="search-wrap" style="flex:1;max-width:360px">
        <span class="search-icon">🔍</span>
        <input class="input" id="admin-search" placeholder="Search items..." value="${esc(adminItemSearch)}" style="padding-left:2.5rem" />
      </div>
      <select class="admin-select" id="admin-cat-filter" style="max-width:160px">
        ${ADMIN_CATEGORIES.map(c=>`<option value="${c.key}" ${c.key===adminItemCat?'selected':''}>${c.label}</option>`).join('')}
      </select>
    </div>

    <div class="admin-items-wrap">
      <table class="admin-table" id="admin-items-table">
        <thead><tr>
          <th>Item</th><th>Category</th><th>Tier</th><th>Source</th><th>Tags</th><th>Action</th>
        </tr></thead>
        <tbody id="admin-items-body"></tbody>
      </table>
    </div>`

  renderAdminItemsTable()
  bindAdminItemsEvents()
}

function renderAdminItemsTable() {
  const tbody = document.getElementById('admin-items-body')
  if (!tbody) return

  const catFilter = document.getElementById('admin-cat-filter')?.value || adminItemCat
  const q = adminItemSearch.toLowerCase()
  let rows = []

  // Combine data.json items with admin items
  const merged = AdminStore.getMergedCategory(catFilter)
  const added  = AdminStore.getAdded()[catFilter] || {}

  for (const [tier, items] of Object.entries(merged)) {
    for (const item of items) {
      const isAdmin = item._source === 'admin' ||
        (added[tier] || []).some(i => i.name === item.name)
      if (q && !item.name.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) continue
      rows.push({ item, tier, cat: catFilter, isAdmin })
    }
  }

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-mute);padding:2rem">No items found</td></tr>`
    return
  }

  tbody.innerHTML = rows.map(({ item, tier, cat, isAdmin }) => {
    const color = tc(tier)
    return `<tr>
      <td><span style="margin-right:.5rem">${item.emoji||'🔹'}</span><strong style="color:var(--text)">${esc(item.name)}</strong>${item.description?`<div style="font-size:.75rem;color:var(--text-mute);margin-top:2px">${esc(item.description.slice(0,60))}${item.description.length>60?'…':''}</div>`:''}</td>
      <td style="color:var(--text-mute)">${cat}</td>
      <td><span style="background:${color}22;color:${color};border:1px solid ${color}44;border-radius:4px;padding:1px 7px;font-size:.75rem;font-weight:800">${tier}</span></td>
      <td><span class="admin-source-badge ${isAdmin?'source-admin':'source-fandom'}">${isAdmin?'Admin':'Fandom'}</span></td>
      <td style="font-size:.75rem;color:var(--text-mute)">${(item.tags||[]).join(', ')||'—'}</td>
      <td>
        <button class="admin-del-btn"
          data-cat="${esc(cat)}" data-tier="${esc(tier)}"
          data-name="${esc(item.name)}" data-source="${isAdmin?'admin':'data'}">
          ${isAdmin?'Remove':'Hide'}
        </button>
      </td>
    </tr>`
  }).join('')

  tbody.querySelectorAll('.admin-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { cat, tier, name, source } = btn.dataset
      if (!confirm(`${source==='admin'?'Remove':'Hide'} "${name}" from ${cat}?`)) return
      if (source === 'admin') AdminStore.removeAdminItem(cat, tier, name)
      else AdminStore.deleteDataItem(cat, tier, name)
      renderAdminItemsTable()
      // Force re-count badges
      const totalAdmin2 = Object.values(AdminStore.getAdded()).flat().length
      const totalDel2   = AdminStore.getDeleted().length
      document.querySelectorAll('.admin-count-badge').forEach((el, i) => {
        if (i === 0) el.textContent = totalAdmin2 + ' admin-added'
        if (i === 1) el.textContent = totalDel2 + ' hidden'
      })
    })
  })
}

function bindAdminItemsEvents() {
  document.getElementById('add-item-btn')?.addEventListener('click', () => {
    const name = document.getElementById('add-name').value.trim()
    if (!name) { alert('Item name is required'); return }

    const cat   = document.getElementById('add-cat').value
    const tier  = document.getElementById('add-tier').value
    const emoji = document.getElementById('add-emoji').value.trim() || '🔹'
    const desc  = document.getElementById('add-desc').value.trim()
    const loc   = document.getElementById('add-loc').value.trim()
    const tags  = document.getElementById('add-tags').value.split(',').map(t=>t.trim()).filter(Boolean)
    const rar   = document.getElementById('add-rarity').value

    AdminStore.addItem(cat, tier, { name, emoji, description: desc, tags, location: loc, rarity: rar||undefined })

    const suc = document.getElementById('add-success')
    suc.classList.add('show')
    setTimeout(() => suc.classList.remove('show'), 2500)

    // Clear name + desc fields
    document.getElementById('add-name').value = ''
    document.getElementById('add-desc').value = ''
    document.getElementById('add-loc').value  = ''

    adminItemCat = cat
    renderAdminItemsTable()
  })

  document.getElementById('admin-search')?.addEventListener('input', e => {
    adminItemSearch = e.target.value
    renderAdminItemsTable()
  })
  document.getElementById('admin-cat-filter')?.addEventListener('change', e => {
    adminItemCat = e.target.value
    renderAdminItemsTable()
  })
  document.getElementById('add-cat')?.addEventListener('change', e => {
    adminItemCat = e.target.value
  })
}

// ── ADMIN: Deleted/hidden items ──────────────
function renderAdminDeleted(body) {
  const deleted = AdminStore.getDeleted()

  body.innerHTML = `<div class="admin-form-card">
    <div class="admin-form-title" style="color:var(--tier-s)">🗑️ Hidden Items (${deleted.length})</div>
    <p style="color:var(--text-mute);font-size:.88rem;margin-bottom:1rem">These are items from data.json that you have hidden. Click Restore to make them visible again.</p>

    ${deleted.length === 0 ? `<div class="empty-state" style="padding:2rem"><div class="emoji">✅</div><p>No hidden items</p></div>` : `
      <div class="admin-items-wrap">
        <table class="admin-table">
          <thead><tr><th>Item Key</th><th>Action</th></tr></thead>
          <tbody>
            ${deleted.map(key => {
              const [cat, tier, name] = key.split('::')
              return `<tr>
                <td>
                  <span style="color:var(--text)">${esc(name)}</span>
                  <span style="color:var(--text-mute);font-size:.78rem;margin-left:.5rem">${esc(cat)} / ${esc(tier)}</span>
                </td>
                <td>
                  <button class="btn btn-ghost restore-btn" style="font-size:.78rem;padding:.3rem .7rem"
                    data-cat="${esc(cat)}" data-tier="${esc(tier)}" data-name="${esc(name)}">
                    ♻️ Restore
                  </button>
                </td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
      <button class="btn btn-danger" id="restore-all-btn" style="margin-top:1rem">♻️ Restore All</button>
    `}
  </div>`

  body.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      AdminStore.restoreDataItem(btn.dataset.cat, btn.dataset.tier, btn.dataset.name)
      renderAdminDeleted(body)
    })
  })
  body.querySelector('#restore-all-btn')?.addEventListener('click', () => {
    if (confirm('Restore all hidden items?')) {
      localStorage.removeItem('sp_admin_deleted')
      renderAdminDeleted(body)
    }
  })
}

// ── ADMIN: Manage Blog ────────────────────────
let editingPostId = null

function renderAdminBlog(body, app) {
  const posts = BlogStore.getAll()

  body.innerHTML = `
    <!-- Blog editor -->
    <div class="blog-editor-wrap">
      <div class="blog-editor-title">${editingPostId ? '✏️ Edit Post' : '✍️ New Blog Post'}</div>

      <div class="blog-editor-field">
        <label>Title *</label>
        <input class="input" id="blog-title" placeholder="Post title..." value="${editingPostId ? esc(BlogStore.getById(editingPostId)?.title||'') : ''}" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
        <div class="blog-editor-field" style="margin:0">
          <label>Category</label>
          <select class="admin-select" id="blog-cat">
            ${['update','guide','meta','news','tips'].map(c =>
              `<option value="${c}" ${editingPostId&&BlogStore.getById(editingPostId)?.category===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="blog-editor-field" style="margin:0">
          <label>Author</label>
          <input class="input" id="blog-author" value="${editingPostId ? esc(BlogStore.getById(editingPostId)?.author||'DemonJuwel') : 'DemonJuwel'}" />
        </div>
      </div>

      <div class="blog-editor-field">
        <label>Excerpt (shown on card)</label>
        <input class="input" id="blog-excerpt" placeholder="Short preview shown on the blog card..." value="${editingPostId ? esc(BlogStore.getById(editingPostId)?.excerpt||'') : ''}" />
      </div>

      <div class="blog-editor-field">
        <label>Body (supports **bold**, ## Heading, \`code\`, - list)</label>
        <div class="blog-toolbar">
          <button class="blog-tool-btn" data-wrap="**">B</button>
          <button class="blog-tool-btn" data-insert="## ">H2</button>
          <button class="blog-tool-btn" data-insert="### ">H3</button>
          <button class="blog-tool-btn" data-wrap="\`">\`code\`</button>
          <button class="blog-tool-btn" data-insert="- ">List</button>
          <button class="blog-tool-btn" data-insert="\n\n">¶</button>
        </div>
        <textarea class="blog-textarea" id="blog-body" placeholder="Write your post here...&#10;&#10;Supports basic markdown:&#10;## Heading&#10;**bold**&#10;\`code\`&#10;- bullet">${editingPostId ? esc(BlogStore.getById(editingPostId)?.body||'') : ''}</textarea>
      </div>

      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
        <button class="admin-submit-btn" id="blog-save-btn">${editingPostId ? '💾 Save Changes' : '📤 Publish Post'}</button>
        ${editingPostId ? `<button class="btn btn-ghost" id="blog-cancel-edit">Cancel</button>` : ''}
        <div class="admin-success" id="blog-success">${editingPostId ? '✅ Post updated!' : '✅ Post published!'}</div>
      </div>
    </div>

    <!-- Post list -->
    <div class="section-title" style="font-size:1.3rem;margin-bottom:1rem">All Posts (${posts.length})</div>
    <div class="blog-admin-list">
      ${posts.length === 0 ? `<div class="empty-state" style="padding:2rem"><div class="emoji">📝</div><p>No posts yet</p></div>` :
        posts.map(post => {
          const catCls = CAT_BLOG_COLORS[post.category] || 'cat-tips'
          return `<div class="blog-admin-item">
            <div>
              <span class="blog-cat-badge ${catCls}" style="margin-right:.5rem">${post.category}</span>
            </div>
            <div class="blog-admin-item-title">${esc(post.title)}</div>
            <div class="blog-admin-item-meta">📅 ${esc(post.date)} · ✍️ ${esc(post.author)}</div>
            <div class="blog-admin-actions">
              <button class="btn btn-ghost edit-post-btn" style="font-size:.78rem;padding:.3rem .7rem" data-id="${post.id}">✏️ Edit</button>
              <button class="btn btn-secondary" style="font-size:.78rem;padding:.3rem .7rem" onclick="blogActivePost='${post.id}';navigate('/blog')">👁️ View</button>
              <button class="admin-del-btn del-post-btn" data-id="${post.id}">🗑️</button>
            </div>
          </div>`
        }).join('')}
    </div>`

  // Toolbar
  body.querySelectorAll('.blog-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ta = document.getElementById('blog-body')
      const start = ta.selectionStart, end = ta.selectionEnd
      const sel = ta.value.slice(start, end)
      if (btn.dataset.wrap) {
        const w = btn.dataset.wrap
        ta.setRangeText(w + (sel||'text') + w, start, end, 'select')
      } else if (btn.dataset.insert) {
        ta.setRangeText(btn.dataset.insert, start, end, 'end')
      }
      ta.focus()
    })
  })

  // Save/publish
  body.querySelector('#blog-save-btn')?.addEventListener('click', () => {
    const title   = document.getElementById('blog-title').value.trim()
    const cat     = document.getElementById('blog-cat').value
    const author  = document.getElementById('blog-author').value.trim() || 'DemonJuwel'
    const excerpt = document.getElementById('blog-excerpt').value.trim()
    const postBody= document.getElementById('blog-body').value.trim()
    if (!title || !postBody) { alert('Title and body are required'); return }

    if (editingPostId) {
      BlogStore.update(editingPostId, { title, category: cat, author, excerpt, body: postBody })
      editingPostId = null
    } else {
      BlogStore.add({ title, category: cat, author, excerpt, body: postBody })
    }

    const suc = document.getElementById('blog-success')
    suc.classList.add('show')
    setTimeout(() => { suc.classList.remove('show'); renderAdminBlog(body, app) }, 1500)
  })

  body.querySelector('#blog-cancel-edit')?.addEventListener('click', () => {
    editingPostId = null; renderAdminBlog(body, app)
  })

  body.querySelectorAll('.edit-post-btn').forEach(btn => {
    btn.addEventListener('click', () => { editingPostId = btn.dataset.id; renderAdminBlog(body, app) })
  })
  body.querySelectorAll('.del-post-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const post = BlogStore.getById(btn.dataset.id)
      if (!post || !confirm(`Delete "${post.title}"?`)) return
      BlogStore.remove(btn.dataset.id)
      renderAdminBlog(body, app)
    })
  })
}

// ══════════════════════════════════════════════
// PATCH ROUTES + DATA to use AdminStore merge
// ══════════════════════════════════════════════

// Override the original DATA access in TierList to include admin items
const _origGetCatData = () => {}

// Patch renderTierRows to use merged data
const _origRenderTierRows = renderTierRows
window.renderTierRowsOrig = _origRenderTierRows

// We need to intercept category data access — simplest way: patch at render time
function getActiveCatData(catKey) {
  return AdminStore.getMergedCategory(catKey)
}

// Re-export patched version
ROUTES['/blog']      = renderBlog
ROUTES['/admin']     = renderAdmin
ROUTES['/favorites'] = renderFavorites
ROUTES['/wiki']      = renderWiki
ROUTES['/builder']   = renderBuilder
ROUTES['/tierlist']  = renderTierListPatched
ROUTES['/']          = renderHome

function renderTierListPatched(app) {
  renderTierList(app)
}

// Patch renderTierRows to use admin-merged data
const _renderTierRowsOriginal = renderTierRows
function renderTierRows() {
  const wrap = document.getElementById('tier-rows-wrap')
  if (!wrap || !DATA) return

  // Use merged data (data.json + admin additions - admin deletions)
  const catData = getActiveCatData(tlState.tab)
  const q = tlState.search.toLowerCase()

  const rows = TIER_ORDER.filter(tier => {
    if (tlState.tier !== 'all' && tier !== tlState.tier) return false
    return catData[tier]?.length > 0
  })

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><p>No items found</p><button class="btn btn-ghost" id="clear-filters" style="margin-top:.75rem">Clear Filters</button></div>`
    wrap.querySelector('#clear-filters')?.addEventListener('click', () => {
      tlState.search=''; tlState.tier='all'; tlState.fruitType=null
      document.getElementById('tl-search').value=''
      document.getElementById('tier-filter').value='all'
      renderFtypeSection(); renderTierRows()
    })
    return
  }

  wrap.innerHTML = `<div class="tier-rows">
    ${rows.map(tier => {
      let items = catData[tier] || []
      if (tlState.tab === 'fruits' && tlState.fruitType) {
        items = items.filter(i => getFruitTypeKey(i) === tlState.fruitType)
      }
      if (q) {
        items = items.filter(i =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.tags?.some(t => t.includes(q))
        )
      }
      if (!items.length) return ''

      const color  = tc(tier)
      const colId  = `${tlState.tab}-${tier}`.replace('+','p')
      const isOpen = !tlState.collapsed[colId]

      return `<div class="tier-row">
        <div class="tier-row-header" data-col="${colId}">
          <div class="tier-box" style="background:${color}18;border-color:${color};color:${color}">${tier}</div>
          <div class="tier-meta">
            <span class="tier-item-count" style="color:${color}99">${items.length} item${items.length!==1?'s':''}</span>
            <span class="tier-chevron ${isOpen?'open':''}">▾</span>
          </div>
        </div>
        ${isOpen ? `<div class="tier-items">${items.map(item => itemCardHtml(item, tier, tlState.tab)).join('')}</div>` : ''}
      </div>`
    }).join('')}
  </div>`

  bindTierRowEvents(wrap)
}

// ══════════════════════════════════════════════
// PATCH init to call updateAdminNav
// ══════════════════════════════════════════════
async function init() {
  const hamburger = document.getElementById('hamburger')
  const navLinks  = document.getElementById('nav-links')
  hamburger?.addEventListener('click', () => navLinks.classList.toggle('open'))
  document.addEventListener('click', e => {
    if (!e.target.closest('.navbar-inner')) navLinks.classList.remove('open')
  })

  try {
    const res = await fetch('public/data.json')
    DATA = await res.json()
  } catch {
    document.getElementById('app').innerHTML =
      '<div class="empty-state"><div class="emoji">⚠️</div><p>Failed to load data.json</p></div>'
    return
  }

  updateFavCount()
  updateAdminNav()
  seedDefaultPosts()

  window.addEventListener('hashchange', router)
  router()
}

init()
