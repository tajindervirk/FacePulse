# FacePulse

> Real-time facial expression detection powered by MediaPipe, a FACS-based AI classifier, and a premium monochrome spatial UI.

FacePulse detects **13 distinct facial expressions** from a live webcam feed using Google's MediaPipe Face Landmarker and a scientifically-grounded Facial Action Coding System (FACS) weighted scoring engine — entirely in the browser, with zero server-side processing and no data ever leaving your device.

---

## Key Features

- **13 Expression Detection** — Happy, Sad, Surprised, Angry, Disgusted, Fearful, Winking, Puffed Cheeks, Confusion, Smirk, Boredom, Yawning, and Neutral
- **Camera Pinch-to-Zoom** — Contactless hand gesture zoom (1× to 5×) tracked live via MediaPipe Hand Landmarker
- **Multi-Face Support** — Simultaneously detect and classify expressions on up to 4 faces
- **FACS Weighted Classifier** — Mathematically-bounded concurrent scoring with mutual suppression guards, validated against 151 E2E test cases (100% pass rate)
- **4 Overlay Modes** — Mesh, Contour, Dots, and None rendered on a live canvas overlay
- **Emoji Rain Effect** — Animated falling emojis matching the current detected expression
- **3D Spatial UI** — Mouse-tracking parallax tilt, glassmorphism cards, animated grid backdrop
- **Monochrome Theme** — Dark/Light toggle with a strict Shadcn-inspired HSL design system
- **Screenshot Capture** — One-click canvas capture of the live video with overlay
- **Privacy First** — 100% client-side. No API keys. No data transmission. No tracking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **AI Vision** | `@mediapipe/tasks-vision` (FaceLandmarker + HandLandmarker) |
| **Expression Engine** | Custom FACS-based weighted JS classifier (`src/utils/expressionLogic.js`) |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Charts** | Recharts 3 |
| **Linting** | OxLint |
| **Styling** | Vanilla CSS with HSL design tokens |

---

## Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher (comes with Node.js)
- A **webcam** connected or built-in
- A modern **Chromium-based browser** (Chrome, Edge, Brave) — required for MediaPipe GPU delegate support. Firefox has partial support.

> **Note**: MediaPipe loads its WASM and model files from CDN on first load (~20–40 MB). An internet connection is required for the first run. Subsequent loads use the browser cache.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Temporary
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

On first load, allow camera access when prompted. MediaPipe will download the face and hand landmark models (~20 MB) from Google's CDN — this only happens once and is then cached by the browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR at `http://localhost:5173` |
| `npm run build` | Build optimized production bundle to `dist/` |
| `npm run preview` | Serve the production `dist/` build locally |
| `npm run lint` | Run OxLint static analysis |

---

## Project Structure

```
FacePulse/
│
├── index.html                    # App entry point + all favicon <link> tags
├── vite.config.js                # Vite configuration
├── package.json                  # Dependencies and scripts
│
├── public/                       # Static assets (served at root /)
│   ├── favicon.ico               # Multi-res browser tab icon (16/32/48px)
│   ├── favicon-96x96.png         # Standard favicon
│   ├── icon-512.png              # High-res app icon
│   ├── apple-touch-icon.png      # iOS home screen icon (180×180)
│   ├── web-app-manifest-192x192.png  # Android PWA icon
│   ├── web-app-manifest-512x512.png  # Android PWA splash icon
│   └── site.webmanifest          # Web App Manifest (PWA)
│
└── src/
    ├── main.jsx                  # React root render entry
    ├── App.jsx                   # Root component (theme, layout, navbar)
    ├── App.css                   # App-level styles
    ├── index.css                 # Global CSS design system (HSL tokens, utilities)
    │
    ├── components/
    │   ├── FaceScanner.jsx       # Main camera view, zoom, pan, canvas overlay
    │   ├── ExpressionDashboard.jsx # Expression cards, confidence bars, blendshape panel
    │   ├── ControlPill.jsx       # Floating overlay-mode & screenshot controls
    │   └── EmojiRain.jsx         # Emoji rain animation canvas effect
    │
    ├── hooks/
    │   └── useFaceExpression.js  # MediaPipe init, detection loop, hand pinch tracking
    │
    └── utils/
        └── expressionLogic.js    # FACS 13-expression weighted scoring classifier
```

---

## Architecture

### Detection Pipeline

```
Webcam Feed (640×480)
       │
       ▼ requestAnimationFrame loop (throttled to 150ms)
┌─────────────────────────────┐
│   MediaPipe FaceLandmarker  │ → 478 face landmarks + 52 blendshape scores
│   MediaPipe HandLandmarker  │ → 21 hand landmarks (thumb tip [4] + index tip [8])
└─────────────────────────────┘
       │
       ├──→ drawOverlay() → Canvas (Mesh / Contour / Dots / None)
       │
       ├──→ classifyExpression(blendshapes) → { expression, emoji, confidence% }
       │         └── FACS Weighted Scorer (expressionLogic.js)
       │
       └──→ pinchDistance = √(Δx² + Δy²) → zoom level (1× – 5×) in FaceScanner
```

### FACS Expression Classifier (`src/utils/expressionLogic.js`)

The classifier maps MediaPipe's 52 blendshape scores to 13 expressions using weighted mathematical formulas grounded in the Facial Action Coding System (FACS):

| Expression | Key Blendshapes Used |
|---|---|
| **Happy** 😄 | `mouthSmileLeft/Right`, `cheekSquintLeft/Right` |
| **Sad** 😢 | `mouthFrownLeft/Right`, `browInnerUp`, `browDownLeft/Right` |
| **Surprised** 😲 | `browInnerUp`, `browOuterUpLeft/Right`, `eyeWideLeft/Right`, `jawOpen` |
| **Angry** 😠 | `browDownLeft/Right`, `eyeSquintLeft/Right`, `mouthPressLeft/Right`, `noseSneerLeft/Right` |
| **Disgusted** 🤢 | `noseSneerLeft/Right`, `mouthUpperUpLeft/Right` (quadratic formula) |
| **Fearful** 😨 | `eyeWideLeft/Right`, `browInnerUp`, `browOuterUpLeft/Right`, `mouthStretchLeft/Right` |
| **Winking** 😉 | Asymmetric blink: `eyeBlinkLeft/Right` diff > 0.3, max > 0.5, min < 0.3 |
| **Puffed** 🐡 | `cheekPuff`, suppressed by `cheekSquint` and smile |
| **Confusion** 😕 | Brow asymmetry (`browOuterUp` diff, `browDown` diff), `browInnerUp` |
| **Smirk** 😏 | Asymmetric smile: `mouthSmile` diff × `mouthDimple` diff |
| **Boredom** 😑 | Parabolic eye droop `4x(1−x)` from `eyeBlink`, `eyeLookDown`, `mouthFrown` |
| **Yawning** 🥱 | `jawOpen` × `eyeBlink/Squint` closure, suppressed by smile |
| **Neutral** 😐 | Default when no expression exceeds threshold (0.12) |

All 13 expressions are scored **simultaneously** (not sequentially). The highest score above `0.12` wins. Mutual suppression guards prevent anatomically impossible co-expressions (e.g. smile suppresses sadness).

### Camera Pinch-to-Zoom Gesture

The `HandLandmarker` tracks landmarks in real time. The distance between **index fingertip (landmark 8)** and **thumb tip (landmark 4)** is computed as a normalized Euclidean distance $d = \sqrt{\Delta x^2 + \Delta y^2}$. Changes in `d` relative to a reference distance drive a `zoomLevel` state (clamped to `1×` – `5×`). Panning is enabled at zoom > 1× via touch or mouse drag, with mirrored coordinate correction for the flipped webcam feed.

---

## Gestures & Controls

| Gesture / Control | Action |
|---|---|
| **Pinch fingers** (camera) | Zoom in on the video feed |
| **Spread fingers** (camera) | Zoom out on the video feed |
| **Double-click / double-tap** video | Reset zoom to 1× |
| **Drag** (when zoomed in) | Pan the video |
| **Touchpad pinch** | Zoom in/out (touchpad gesture) |
| Overlay buttons (top-left of video) | Switch between Mesh / Contour / Dots / None overlays |
| 📷 Screenshot button | Capture a PNG of the current frame with overlay |
| ☁️ Emoji Rain button | Toggle the emoji rain animation |
| ☀️/🌙 Theme button | Toggle Dark / Light mode |
| **Zen Mode** button | Hide the header for a fullscreen-style view |
