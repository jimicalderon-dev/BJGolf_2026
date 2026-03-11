# BJ 2026 — Golf Tournament App

A luxury mobile web app for the BJ 2026 golf trip at Las Colinas Golf & Country Club Resort (Jun 18–22, 2026). Built with Vite + React + Tailwind CSS + Supabase, installable as a PWA.

## Features

- **PIN-based login** — Select your name and enter your 4-digit PIN
- **Live Leaderboard** — Real-time scores via Supabase Realtime
- **Score Entry** — Hole-by-hole scoring with instant feedback (eagle/birdie notifications)
- **Ryder Cup Standings** — Team A vs Team B with automatic point calculation
- **Player Stats** — Head-to-head comparison charts
- **Trip Itinerary** — 5-day schedule (Jun 18–22)
- **Hotel Info** — Room assignments at Las Colinas
- **Photo Gallery** — Upload and share trip photos via Supabase Storage
- **Group Chat** — Real-time team chat
- **Challenges** — CTP, Long Drive, Skins, Eagle Club, Birdie Streak
- **PWA** — Install to home screen on iOS and Android

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 + custom glassmorphism components |
| Backend | Supabase (Postgres + Realtime + Storage) |
| Auth | PIN-based (no email/password) |
| PWA | vite-plugin-pwa + Workbox |
| Fonts | Playfair Display (serif) + DM Sans (sans) |

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd bj-golf-2026
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Navigate to **Project Settings → API**
3. Copy your **Project URL** and **anon public** key

### 3. Configure Environment Variables

Edit `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Open `supabase-setup.sql` from this project root
3. Paste the contents and click **Run**

This creates all tables, sets up Row Level Security, seeds players and events, and configures Supabase Realtime.

### 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Players & PINs

After running the SQL migration, 10 players are seeded. Default PINs follow the pattern `1001` through `1010`:

| # | Player | Team | Handicap | PIN |
|---|--------|------|----------|-----|
| 1 | Player 1 | A | 14 | 1001 |
| 2 | Player 2 | A | 18 | 1002 |
| 3 | Player 3 | A | 22 | 1003 |
| 4 | Player 4 | A | 10 | 1004 |
| 5 | Player 5 | A | 16 | 1005 |
| 6 | Player 6 | B | 12 | 1006 |
| 7 | Player 7 | B | 20 | 1007 |
| 8 | Player 8 | B | 15 | 1008 |
| 9 | Player 9 | B | 24 | 1009 |
| 10 | Player 10 | B | 11 | 1010 |

**To update player names and PINs**, edit the `INSERT INTO players` section at the bottom of `supabase-setup.sql` before running it, or update the rows directly in the Supabase Table Editor.

---

## Tournament Events

| ID | Name | Format | Day |
|----|------|--------|-----|
| `ind` | Individual Strokeplay | Individual | Day 1 |
| `bb` | Better Ball | Team | Day 2 |
| `scr` | Scramble | Team | Day 3 |
| `alt` | Alternate Shot | Team | Day 4 |
| `rc` | Ryder Cup Singles | Individual | Day 5 |

---

## Database Schema

```
players           — id, name, team (A/B), handicap, pin_code, avatar_url
events            — id, name, type, day_number, emoji
scores            — player_id, event_id, hole_number, strokes (UNIQUE per player+event+hole)
chat_messages     — id, player_id, message, created_at
photos            — id, player_id, url, caption, day, created_at
challenge_results — id, challenge_id, player_id, value, unit, created_at
notifications     — id, type, player_id, hole_number, message, created_at
```

---

## Customizing

### Change Player Names / Handicaps / PINs
Edit the `INSERT INTO players` rows in `supabase-setup.sql`, or use the Supabase Table Editor after running the migration.

### Change Room Assignments
Edit `src/pages/Hotel.jsx` — the `ROOMS` array at the top of the file.

### Change the Course / Holes
Edit `src/constants/course.js` — the `HOLES` array with `{ number, par, yards, si }` for each of the 18 holes.

### Add/Edit Challenges
Edit `src/constants/course.js` — the `CHALLENGES` array.

### Change the Schedule (Itinerary)
Edit `src/constants/course.js` — the `ITINERARY` array.

---

## Build for Production

```bash
npm run build
```

Output is in the `dist/` folder. Deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

### Deploy to Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Set your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel dashboard.

### Deploy to Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir dist
```

---

## PWA Installation

### iOS (Safari)
1. Open the app URL in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Tap **Add**

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the menu (⋮)
3. Tap **Add to Home screen** / **Install app**

---

## Supabase Realtime

The following tables are configured for real-time updates:
- `scores` — Live leaderboard updates
- `chat_messages` — Group chat
- `notifications` — Birdie/eagle push banners

---

## License

Private project — BJ Golf Trip 2026.
