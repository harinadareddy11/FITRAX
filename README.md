<div align="center">

# 🏋️ FitRax

### Your Private Gym Companion — Built for Indian Gym-Goers

**Track. Transform. Repeat.**

[![React Native](https://img.shields.io/badge/React_Native-Expo-20232A?logo=react)](https://expo.dev)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Zustand](https://img.shields.io/badge/State-Zustand-FF4154)](https://zustand-demo.pmnd.rs)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

📦 **[Download Latest APK](https://github.com/yourusername/fitrax/releases)**

</div>

---

## 🤔 The Problem

People who work out seriously run into a few recurring frustrations:

- 📸 **Progress photos end up in your gallery** — visible to anyone who picks up your phone, mixed in with everything else, with no structure
- 📉 **No accountability system** — missing a few days has no consequence, making it easy to quietly quit
- 📋 **Workout plans live in notes apps or paper** — no structure, no history, no way to see if you're progressing
- 📵 **Gym connectivity is unreliable** — basement gyms and dead zones mean logged sessions often don't save

**FitRax is a personal workout app built to solve exactly these things** — private progress tracking, streak-based consistency, structured plans, and offline-first logging.

---

## ✅ What FitRax Does

| Feature | Description |
|---|---|
| 📸 Private progress photo vault | Photos stored in-app via Supabase — never in your device gallery |
| 🔥 Streak tracking | Tracks your current and best streaks to keep you consistent |
| 📋 Structured workout plans | Auto-generated or custom plans with day-wise exercise breakdowns |
| ⏭ Done vs. Skipped logging | Mark sets as completed or skipped — both tracked separately |
| 📡 Offline-first sync | Workouts saved locally when offline, synced silently when back online |
| 🔒 Biometric app lock | Fingerprint / Face ID to keep your data private |

---

## ✨ Features in Detail

### 📸 Private Progress Photo Vault
Most people don't take progress photos consistently because they don't want them sitting in their camera roll. FitRax solves this by storing all photos securely inside the app via Supabase Storage — **they never appear in your device gallery**.

- Capture **Front, Back, and Side** photos per update
- View your physical transformation over time in a clean timeline
- Photos are tied to your account and protected behind biometric lock

---

### 🔥 Streaks & Consistency Tracking
Consistency is the hardest part of fitness. FitRax keeps you accountable with a streak system that rewards showing up.

- Tracks your **current streak** and **best streak** across all workouts
- Displays **total lifetime sessions** on your profile
- Seeing your streak break is enough motivation to not skip

---

### 📋 Workout Plans — Structured & Day-Wise

FitRax generates a proper weekly split based on how many days you can commit:

| Days per Week | Generated Split |
|---|---|
| 3 days | Full Body |
| 4 days | Upper / Lower |
| 5–6 days | Push / Pull / Legs |

Each plan breaks down into **individual days with specific exercises, sets, and reps**. You can:

- **Edit any day** — change exercise names, sets, or reps without resetting the whole plan
- **Build manually** — create a fully custom routine from scratch
- **Use preset templates** — curated plans ready from day one

---

### ⚡ Active Workout Logging — The Core Loop
- Log **weight (kg or Bodyweight) × reps** for every set in real time
- Mark each set as:
  - ✅ `Completed` — done
  - ⏭ `Skipped` — machine taken, injury, or not today
- Built-in **rest timer** with visual countdown and audio cues

Skipped sets are preserved in your history separately — so your data stays accurate even on imperfect days.

---

### 📊 Workout History & Analytics

- **Accordion-style session history** — expand any past workout to see every set logged
- Completed sets shown in **green**, skipped sets in **grey** — clear visual separation
- **Total volume per session** (kg moved) tracked over time
- **Interactive body weight chart** showing fluctuations over time

---

### 📡 Offline-First Sync

Gyms often have poor cellular reception. FitRax handles this gracefully:

```
Workout completed offline
        ↓
Saved to local AsyncStorage queue
        ↓
"Offline · Pending Sync" badge shown on session
        ↓
Device reconnects to internet
        ↓
Session silently pushed to Supabase → queue cleared
```

No manual action needed. Your data is never lost.

---

### 🔐 Authentication & Security

- **Email/Password** login with persistent sessions — no repeated logins
- **Biometric App Lock** — Fingerprint or Face ID via `expo-local-authentication`
- Session persistence via Supabase + `AsyncStorage` across restarts

---

### 🎯 Onboarding Flow

A one-time setup that personalises the entire experience:

| Step | What It Captures |
|------|-----------------|
| 1 | **Primary Goal** — Muscle Gain, Fat Loss, Maintain, or General Fitness |
| 2 | **Body Stats** — Age, Weight, Height → auto-calculates BMI |
| 3 | **Available Equipment** — checkbox selection for your gym setup |
| 4 | **Workout Path** — Auto-Generated, Manual Builder, or Preset Templates |
| 5 | **Diet & Logging Prefs** — budget and logging preference |

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| ⚛️ React Native (Expo) | Cross-platform mobile development |
| 🗄️ Supabase | Auth, PostgreSQL database, progress photo storage |
| 🐻 Zustand | Global state (user + onboarding) |
| 🧭 React Navigation | Native Stack + Bottom Tabs |
| 💾 AsyncStorage | Offline queue + session caching |
| 🌐 NetInfo | Connectivity detection for sync triggers |
| 🖼️ expo-image-picker | In-app progress photo capture |
| 🔊 expo-av | Rest timer audio cues |
| 🔒 expo-local-authentication | Biometric app lock |
| 🅰️ Expo Google Fonts | Outfit (UI) + Space Mono (numbers & data) |

---

## 🏗 Architecture

```
React Native (Expo) Frontend
          ↓
Supabase Auth (Email/Password + Session Persistence)
          ↓
Supabase PostgreSQL + Storage (online)
     /         \
AsyncStorage    NetInfo Listener
(offline queue) (triggers sync on reconnect)
```

---

## 🗄️ Database Schema

| Table | Key Fields |
|---|---|
| `profiles` | `goal`, `weight`, `height`, `bmi`, `streak_current`, `total_sessions`, `diet_budget` |
| `workout_templates` | `days: JSONB` — weekly split with exercises per day |
| `workout_sessions` | `date`, `total_volume_kg`, `duration`, `exercises: JSONB` |
| `progress_logs` | `date`, `weight` — body weight history |
| Storage Buckets | `avatars`, `progress_photos` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- Expo CLI
- A [Supabase](https://supabase.com) project

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/fitrax.git
cd fitrax
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Configure Environment
```bash
cp .env.example .env
# Add your SUPABASE_URL and SUPABASE_ANON_KEY
```

### 4️⃣ Start Development Server
```bash
npx expo start
```

---

## 📦 Production Build

```bash
eas build -p android --profile preview
```

👉 **[Download Latest Release](https://github.com/yourusername/fitrax/releases)**

---

## 📁 Project Structure

```
fitrax/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (onboarding)/    # 5-step onboarding flow
│   ├── (tabs)/          # Dashboard, Workout, Progress, Profile
│   └── workout/         # Active workout session
├── components/          # Reusable UI components
├── store/               # Zustand stores
├── lib/
│   ├── supabase.ts
│   ├── offlineQueue.ts
│   └── workoutGen.ts
├── hooks/
└── supabase/
    ├── migrations/
    └── policies/
```

---

## 🗺 Roadmap

- [x] Private progress photo vault (not saved to gallery)
- [x] Streak and consistency tracking
- [x] Auto-generated workout splits
- [x] Day-wise plan editor
- [x] Done vs. Skipped set tracking
- [x] Offline-first sync
- [x] Biometric app lock
- [ ] Apple Health / Google Fit integration
- [ ] AI progressive overload suggestions
- [ ] Barcode scanner for diet logging
- [ ] Hindi & regional language support
- [ ] iOS build via EAS

---

## 👨‍💻 Author

**Your Name**
🔗 GitHub: [harinadareddy11](https://github.com/harinadareddy11)

---

<div align="center">

⭐ If FitRax helped your training, consider starring the repository.

*Built for people who take their fitness seriously.*

</div>
