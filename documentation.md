# Capture the Flag - Project Documentation

## Project Overview
Capture the Flag is a real-time multiplayer game application built with React and Firebase. It features a central Admin Dashboard for game management, a Flag Interface for players (simulated on mobile devices), and a Simulator to visualize game mechanics during development.

## Features

### Admin Dashboard (`/admin`)
- **Game Control**: Start, Pause, and Reset the game with a 15-minute timer.
- **Live Monitoring**: Real-time view of all 4 bases.
- **Scoreboard**: Visual bar charts and status indicators (Secured, Contested, Neutral).
- **Timer**: Large countdown timer with progress bar.

### Flag Interface (`/flag`)
- **Mobile View**: Designed for players to interact with physical bases (simulated).
- **Status Display**: Shows current assignment or waiting status.
- *(Note: Currently a placeholder awaiting full implementation logic)*

### Simulator (`/simulator`)
- **Base Simulation**: Simulates 4 distinct bases (Base 1-4).
- **Interactive Controls**: Allows developers to simulate "Holding" a base by pressing color coded buttons.
- **Visual Feedback**:
    - **Pulsing Vignette**: detailed visual feedback when a base is being held.
    - **Pie Charts**: Real-time score distribution.
    - **Status Lights**: LED-style indicators for the leading team.

## Game Logic (`useGame.ts`)
- **State Management**: Uses Firebase Realtime Database for syncing game state across clients.
- **Interpolation**: Client-side ticker (`requestAnimationFrame`) interpolates scores for smooth animations between database updates.
- **Scoring Mechanics**:
    - **Holding**: A team gains points (10/sec) while holding a base.
    - **Stealing**: Points gained by the holding team are deducted from other teams to maintain a zero-sum balance (if others have points).
    - **Capture**: A base is "Captured" (owned) when a team reaches 100%.

## Tech Stack
- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend / Realtime**: Firebase Realtime Database
- **Routing**: React Router DOM 7

## Folder Structure
```
src/
├── assets/          # Static assets (images)
├── components/      # Reusable UI components
│   ├── BarChart.tsx
│   ├── ScorePieChart.tsx
│   └── ...
├── hooks/           # Custom React hooks
│   └── useGame.ts   # Core game logic and Firebase sync
├── pages/           # Route components
│   ├── AdminDashboard.tsx
│   ├── FlagInterface.tsx
│   └── Simulator.tsx
├── types/           # TypeScript definitions
├── utils/           # Helper functions
├── App.tsx          # Main router configuration
├── main.tsx         # Entry point
└── ...
```

## Setup & Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Configuration
The application uses Firebase. Ensure `src/lib/firebase.ts` is configured with your Firebase project credentials.
In development, `IS_DEMO` flag in `useGame.ts` can be toggled to use `localStorage` instead of Firebase for offline testing.
