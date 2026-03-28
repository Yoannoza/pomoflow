# PomoFlow

A premium Pomodoro timer with Notion integration, ambient soundscapes, and an immersive focus mode. Built with Next.js, Three.js, and Framer Motion.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)
![Three.js](https://img.shields.io/badge/Three.js-0.183-black?logo=three.js)

---

## Features

### Pomodoro Timer
- Configurable focus, short break, and long break durations
- Auto-transition between sessions with optional auto-start
- Visual progress ring with glowing animations
- Keyboard shortcuts: `Space` (play/pause), `R` (reset), `Esc` (exit focus)

### Notion Integration
- Import tasks directly from your Notion database
- Filter by status, priority, type, and context
- One-click import to your local task list

### Task Management
- Add, complete, and delete tasks
- Estimated vs completed pomodoro tracking per task
- Active task indicator during focus sessions
- Persistent storage via localStorage

### Immersive Focus Mode
- Full-screen focus overlay with neural particle flow field animation
- Interactive particles that react to mouse movement
- Large timer display with task prominently shown
- Breathing ring animations and ambient glow effects
- Built-in ambient sound controls

### Ambient Soundscapes
- 4 real ambient sounds: Rain, Fireplace, Wind, Forest
- Volume control with seamless looping
- Available in both normal and focus modes

### Visual Design
- Deep Forest + Champagne color theme (dark/light modes)
- Animated 3D dotted surface background (Three.js)
- Smooth transitions powered by Framer Motion
- Custom Nativera heading font
- GitHub-style activity heatmap for stats

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/Yoannoza/pomoflow.git
cd pomoflow
npm install
```

### Notion Setup (optional)

1. Create a [Notion integration](https://www.notion.so/my-integrations)
2. Share your task database with the integration
3. Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

```env
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id
```

Your Notion database should have these properties:
| Property | Type |
|----------|------|
| Tâche | Title |
| Statut | Status |
| Priorité | Select |
| Échéance | Date |
| Type | Select |
| Énergie | Select |
| Contexte | Select |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org) | Framework & API routes |
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com) | Styling |
| [Three.js](https://threejs.org) | 3D dotted surface background |
| [Framer Motion](https://motion.dev) | Animations & transitions |
| [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) | Neural flow field (focus mode) |
| [Web Audio / HTML5 Audio](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement) | Ambient soundscapes |
| [Notion API](https://developers.notion.com) | Task import |

---

## Project Structure

```
src/
├── app/
│   ├── api/notion/tasks/   # Notion API proxy
│   ├── page.tsx             # Main 3-column layout
│   ├── layout.tsx           # Root layout & fonts
│   └── globals.css          # Theme & animations
├── components/
│   ├── ambient/             # Ambient sound player
│   ├── focus/               # Focus view + neural background
│   ├── layout/              # Theme toggle, settings modal
│   ├── stats/               # Activity heatmap
│   ├── tasks/               # Task list & management
│   ├── timer/               # Timer ring & controls
│   └── ui/                  # Dotted surface, shared UI
├── hooks/
│   ├── useTimer.ts          # Timer state machine
│   ├── useTasks.ts          # Local task CRUD
│   ├── useNotionTasks.ts    # Notion API fetching
│   └── useConfetti.ts       # Celebration effect
└── lib/
    ├── types.ts             # TypeScript definitions
    └── storage.ts           # localStorage persistence
```

---

## License

MIT
