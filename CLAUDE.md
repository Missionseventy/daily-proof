# Daily Proof · CLAUDE.md
> Claude Code reads this file automatically. Follow every rule here before writing any code.

---

## What this project is
Daily Proof is a **local-first productivity tool** for solopreneurs and creators.
- One focus per session
- A running timer
- A short written proof (one paragraph)
- Sessions stack into a daily record
- **Zero accounts. Zero tracking. Zero servers. Data lives on the user's device via localStorage.**

Live URL: https://daily-proof-nine.vercel.app
Repo: https://github.com/Missionseventy/daily-proof
Hosting: Vercel (production) + GitHub Pages (backup)

---

## File structure
```
/
├── CLAUDE.md              ← you are here
├── README.md
├── index.html             ← landing page + pricing (single page)
├── app.html               ← the actual app
├── pricing.html           ← standalone pricing (keep for now, may deprecate)
├── vercel.json            ← DO NOT TOUCH
├── worker.js              ← DO NOT TOUCH
├── api/                   ← DO NOT TOUCH
├── assets/
│   └── app.png            ← screenshot used on landing
└── css/
│   └── styles.css         ← single shared stylesheet
└── js/
    ├── app.js             ← app logic
    ├── landing.js         ← landing page logic
    └── pricing.js         ← pricing page logic
```

---

## Design system

### Fonts (loaded from Google Fonts)
- Display / headings: `'Playfair Display', Georgia, serif` — use for timers, hero text, prices, session counts
- Body / UI: `'IBM Plex Mono', 'Courier New', monospace` — use for labels, buttons, inputs, metadata

### Color tokens (CSS variables — always use these, never hardcode hex)
```css
/* Night mode (default) */
--bg:        #080807   /* page background */
--bg2:       #0e0d0b   /* input backgrounds */
--surface:   #141310   /* hover states */
--card:      #1c1a16   /* card background */
--card2:     #211f1a   /* card hover */
--border:    #2e2b24   /* default borders */
--border2:   #3a362d   /* hover borders */
--text:      #f0ead8   /* primary text */
--text2:     #c8bfa8   /* secondary text */
--muted:     #7a7060   /* labels, placeholders */
--gold:      #d4a843   /* primary accent — active states, CTA borders */
--gold2:     #e8c76a   /* gold hover */
--gold-bg:   rgba(212,168,67,.1)   /* gold tint backgrounds */
--danger:    #c26060   /* delete actions */
--danger-bg: rgba(194,96,96,.1)
--green:     #6ab87a   /* success / paid badge */
```

### Border radius
- Small elements (pills, inputs): `var(--r)` = 12px
- Cards: `var(--r-lg)` = 20px
- Modals: `var(--r-xl)` = 28px

### Spacing rhythm
- Section padding: 28px
- Gap between cards: 16px
- Dividers: `<div class="divider"></div>` (1px, var(--border), margin 22px 0)

---

## Component classes (always use these, never invent new ones)

### Buttons
```html
<button class="btn">Default</button>
<button class="btn primary">Gold accent — for main actions</button>
<button class="btn cta">Solid gold — for hero CTAs only</button>
<button class="btn danger">Delete actions</button>
<button class="btn ghost">Subtle — close buttons, secondary</button>
```

### Typography
```html
<div class="serif-label">Italic muted label (Playfair italic)</div>
<span class="label">UPPERCASE MONO LABEL</span>
<p class="muted">Secondary helper text</p>
```

### Focus pills
```html
<div class="focus-pills">
  <button class="focus-pill active">Active focus</button>
  <button class="focus-pill">Inactive focus</button>
</div>
```

### Badges
```html
<span class="badge trial">Trial · 6d left</span>
<span class="badge paid">Pro</span>
<span class="badge">Neutral</span>
```

### Cards
```html
<section class="card">...</section>
```
Every card gets a subtle top gradient line via `card::before` — this is automatic in CSS.

### Inputs
```html
<input class="input" />
<textarea class="textarea"></textarea>
```

### Timer display
```html
<div class="timer-display" id="timerEl">00:00:00</div>
<!-- Add class "running" when active — turns gold with glow -->
```

### Sessions
```html
<div class="session-item">
  <div class="session-header">
    <div class="session-focus-tag">FOCUS NAME</div>
    <div>
      <div class="session-mins">42m</div>
      <div class="session-time">2:30 PM</div>
    </div>
  </div>
  <div class="session-text">What I did...</div>
</div>
```

### Page animations
Add to elements that should animate in on load:
```html
<div class="animate d1">  <!-- d1 through d5 for stagger -->
```

---

## localStorage keys (never rename these — data compatibility)
```
dp_theme           — "night" | "day"
dp_trial_start     — ISO date string
dp_paid            — "monthly" | "lifetime"
dp_sessions        — JSON array of session objects
dp_active_focus    — string
dp_focuses_YYYY-MM-DD  — JSON array of focus strings (one per day)
```

### Session object shape
```json
{
  "id": "uuid",
  "date": "2026-03-05",
  "minutes": 42,
  "focus": "Deep work",
  "text": "Wrote the proof section...",
  "createdAt": "2026-03-05T14:30:00.000Z"
}
```

---

## Access / paywall logic
```
No trial started + no paid = redirect to index.html
Trial active (days < 7) = full access
Trial expired (days >= 7) = show paywall modal
Paid = full access forever
```

Payment is via **Gumroad** (not Stripe).
Placeholder links to replace: `https://YOUR_GUMROAD_MONTHLY_LINK` and `https://YOUR_GUMROAD_LIFETIME_LINK`

Pricing:
- Monthly: $7/mo
- Lifetime: $70 one-time

---

## Rules Claude must follow
1. **Never touch** `vercel.json`, `worker.js`, or the `api/` folder
2. **Always use CSS variables** — never hardcode colors
3. **Always use the font variables** — `var(--serif)` or `var(--mono)`
4. **Mobile first** — test at 375px, then 820px+
5. **No external JS libraries** — vanilla JS only (no jQuery, no lodash)
6. **No frameworks** — this is intentionally plain HTML/CSS/JS
7. **localStorage only** — no fetch calls, no APIs, no user data leaving the device
8. **Keep files consolidated**: logic lives in `js/app.js`, styles in `css/styles.css`
9. **The timer uses Playfair Display** — never change the timer font
10. **Gold (#d4a843) is the only accent color** — don't introduce new accent colors

---

## What to improve next (priority order)
1. Mobile layout of app.html (sessions panel UX on small screens)
2. Add a weekly summary view (total mins per focus, across the week)
3. Gumroad webhook to set `dp_paid` after purchase
4. App icon / favicon
5. Open Graph meta tags for sharing

---

## Gumroad integration note
When user purchases via Gumroad, the redirect URL should point to:
`https://daily-proof-nine.vercel.app/app.html?paid=lifetime`
Then `app.js` should detect the `?paid=` param and set `localStorage.setItem("dp_paid", "lifetime")`.
This is not yet implemented — it's the next big task.
