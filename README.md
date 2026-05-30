# Closer

> Church in your pocket. Daily sermons, scripture, and a quiet place to draw closer.

A React Native app built with **Expo**, **Expo Router**, **TypeScript**, **NativeWind** (Tailwind for RN), and **Plus Jakarta Sans**.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm start
```

Then:
- Press `i` to open the **iOS simulator** (requires Xcode)
- Press `a` to open the **Android emulator** (requires Android Studio)
- Scan the QR code with **Expo Go** on your phone (easiest way to preview)

## Scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `npm start`        | Start the Expo dev server                 |
| `npm run ios`      | Open in the iOS simulator                 |
| `npm run android`  | Open in the Android emulator              |
| `npm run web`      | Open in the browser                       |
| `npm run typecheck`| Run the TypeScript compiler (no emit)     |

## Project structure

```
app/                  # Expo Router screens (file-based routing)
  _layout.tsx         # Root layout — loads fonts, sets up nav
  index.tsx           # First page — Sign In / Sign Up
  +not-found.tsx      # 404 fallback

components/           # Reusable UI primitives
  BrandMark.tsx       # Closer logo (SVG)
  Button.tsx          # Primary / secondary / ghost button
  Input.tsx           # Styled text input
  SocialButton.tsx    # Apple / Google sign-in buttons

constants/
  theme.ts            # Design tokens (colors, radii, spacing)

global.css            # Tailwind directives (consumed by NativeWind)
tailwind.config.js    # Closer color & typography tokens
```

## Design system

| Token         | Value      | Use                                       |
| ------------- | ---------- | ----------------------------------------- |
| `bg`          | `#F7F3EC`  | App background — warm cream               |
| `surface`     | `#FFFFFF`  | Cards, inputs                             |
| `ink`         | `#1B1F2A`  | Primary text                              |
| `ink-muted`   | `#6B7280`  | Secondary text                            |
| `primary`     | `#2D3B5C`  | Reverent dusk-blue — CTAs & emphasis      |
| `accent`      | `#C8956D`  | Warm gold — highlights, dividers          |
| `border`      | `#E8E2D7`  | Hairlines, input borders                  |

Typography is **Plus Jakarta Sans** across the board, loaded via `@expo-google-fonts/plus-jakarta-sans` at app boot.

## What's next

The first page is wired with form state and a simulated submit. Plug in a real auth provider (Firebase, Supabase, Clerk, etc.) inside the `handleSubmit` handler in `app/index.tsx`.

Suggested next screens to build:
- `app/(tabs)/_layout.tsx` — tab bar after auth
- `app/(tabs)/today.tsx` — today's sermon
- `app/(tabs)/library.tsx` — sermon archive
- `app/(tabs)/profile.tsx` — user profile & settings
