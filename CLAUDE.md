# Daily Proof · CLAUDE.md
> Claude Code reads this file automatically. Follow every rule here before writing any code.

---

## What this project is
Daily Proof is a **local-first productivity tool** for solopreneurs and creators.
- One focus per session
- A running timer
- A short written proof (one honest paragraph)
- Sessions stack into a daily record
- **Zero accounts. Zero tracking. Zero servers. Data lives on the user's device via localStorage.**

Live URL: https://daily-proof-nine.vercel.app
Repo: https://github.com/Missionseventy/daily-proof
Hosting: Vercel (production) · GitHub Pages (backup)

---

## File structure
```
/
├── CLAUDE.md              ← you are here (project memory)
├── README.md
├── index.html             ← landing page + pricing section (single page)
├── app.html               ← the actual app (self-contained JS inline)
├── pricing.html           ← standalone pricing page
├── vercel.json            ← DO NOT TOUCH
├── worker.js              ← DO NOT TOUCH
├── api/                   ← DO NOT TOUCH
├── assets/
│   └── app.png
└── css/
│   └── styles.css         ← single shared stylesheet
└── js/
    ├── app.js             ← legacy (app logic is now inline in app.html)
    ├── landing.js         ← theme toggle for landing/pricing pages
    └── pricing.js         ← legacy (pricing logic now inline)
```

---

## Design system

### Fonts (Google Fonts — already in styles.css)
- Display / headings / timer: `'Cormorant Garamond', Georgia, serif` → var(--serif)
- Body / UI / buttons / labels: `'DM Mono', 'Courier New', monospace` → var(--mono)

### Color tokens — ALWAYS use these, never hardcode hex
```
Night mode (default):
--bg: #090806          Page background
--bg2: #0f0e0b         Input backgrounds
--surface: #161410     Hover states, secondary surfaces
--card: #1e1b16        Card backgrounds
--card-hover: #242019  Card hover
--border: #2c2820      Default borders
--border2: #3d3830     Hover / active borders
--text: #f2ead6        Primary text
--text2: #c5bc9f       Secondary text
--muted: #726858       Labels, placeholders, hints
--gold: #c9962a        Brand accent (active pill borders etc)
--gold-light: #e8b84b  CTA text, running timer
--gold-pale: #f5d98a   Gold hover
--gold-bg: rgba(201,150,42,.09)     Gold tinted backgrounds
--gold-border: rgba(201,150,42,.28) Gold borders
--danger: #b85c5c      Delete actions
--danger-bg: rgba(184,92,92,.1)
--green: #5ea86e       Success / paid badge
--green-bg: rgba(94,168,110,.1)
```

### Spacing & radius
- Cards: border-radius var(--r-lg) = 18px · padding 30px
- Inputs/pills: var(--r) = 10px
- Modals: var(--r-xl) = 26px
- Dividers: `<div class="divider"></div>`
- Container max-width: 1040px

---

## Components (use existing classes, never invent new ones)

### Buttons
```html
<button class="btn">Default</button>
<button class="btn primary">Gold accent</button>
<button class="btn cta">Solid gold — hero CTAs only</button>
<button class="btn danger">Delete</button>
<button class="btn ghost">Subtle / close</button>
<button class="btn sm">Small variant</button>
```

### Typography
```html
<div class="eyebrow">Section label with left rule</div>
<div class="serif-sm">Italic muted label</div>
<span class="label">UPPERCASE MONO LABEL</span>
<p class="muted">Helper text</p>
```

### Timer (most important component)
```html
<div class="timer-display" id="timerEl">00:00:00</div>
<!-- Add class "running" when active → turns gold + glow -->
```
Timer font: Cormorant Garamond · weight 300 · letter-spacing -4px

### Focus pills
```html
<div class="focus-pills">
  <button class="focus-pill active">Active</button>
  <button class="focus-pill">Inactive</button>
</div>
```

### Session item
```html
<div class="session-item">
  <div class="session-header">
    <div class="session-focus-tag">FOCUS</div>
    <div>
      <div class="session-mins">42m</div>
      <div class="session-time">2:30 PM</div>
    </div>
  </div>
  <div class="session-text">What I did...</div>
</div>
```

### Page load animation
```html
<div class="animate d1">stagger delay .07s</div>
<div class="animate d2">stagger delay .14s</div>
<!-- d1 through d5 -->
```

---

## localStorage keys (never rename — breaks user data)
```
dp_theme             "night" | "day"
dp_trial_start       ISO date string
dp_paid              "monthly" | "lifetime"
dp_sessions          JSON array of session objects
dp_active_focus      string
dp_focuses_YYYY-MM-DD  JSON array of focus strings (per day)
```

### Session object shape
```json
{
  "id": "uuid",
  "date": "2026-03-05",
  "minutes": 42,
  "focus": "Deep work",
  "text": "One honest paragraph here...",
  "createdAt": "2026-03-05T14:30:00.000Z"
}
```

---

## Access / paywall logic
```
No trial + no paid  →  redirect to index.html
Trial days < 7      →  full access
Trial days >= 7     →  show paywall modal
dp_paid set         →  full access forever
```

## Gumroad payment links (LIVE — do not change)
- Monthly ($7/mo):   https://missionseventy.gumroad.com/l/citlrs
- Lifetime ($49):    https://missionseventy.gumroad.com/l/nscnb

### Gumroad redirect handler (already in app.html)
After purchase, Gumroad redirects to: `https://daily-proof-nine.vercel.app/app.html?paid=lifetime`
The app detects `?paid=` URL param and sets `localStorage.setItem("dp_paid", "lifetime")` automatically.

---

## Rules (enforce all of these)
1. **NEVER touch** `vercel.json`, `worker.js`, `api/`
2. **Always use CSS variables** — zero hardcoded hex values
3. **Always use font variables** — var(--serif) or var(--mono)
4. **Mobile first** — design at 375px width, then 860px+
5. **No external JS libraries** — vanilla JS only
6. **No frameworks** — plain HTML/CSS/JS
7. **localStorage only** — no fetch, no APIs, no user data leaving device
8. **Timer uses Cormorant Garamond** — never change its font
9. **Gold is the only accent** — do not add new accent colors
10. **app.html is self-contained** — JS is inline in the script tag, not in app.js

---

## Priority improvements (in order)
1. Mobile sessions UX (panel behavior on small screens)
2. Weekly summary view (total mins per focus across 7 days)
3. Streak counter (consecutive days with at least one session)
4. Favicon + app icon
5. Open Graph tags for social sharing (already added to index.html)
