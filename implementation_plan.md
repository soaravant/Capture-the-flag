# Implementation Plan - Capture the Flag Mobile Web App

## Goal Description
Create a real-time, multi-device "Capture the Flag" game where users interact physically with mobile phones placed at flag stations. The system will synchronize captured percentages across all devices in real-time, managed by a central admin dashboard.

## User Review Required
> [!IMPORTANT]
> **Hosting & Database**: I am recommending **Firebase** (Google's platform) for this because it handles "Realtime" synchronization effortlessly, which is critical for the "scores interconnected" feature. It also provides free hosting.
> **Game Logic**: The logic "one goes up, others drop" implies a Tug-of-War mechanic. I propose initializing all colors at **25%** (or 0% if preferred) and enforcing a max total of 100% across all colors. Please confirm if you prefer:
> 1. **Zero-sum**: Total is always 100% (Start at 25/25/25/25. If Red +1, others -0.33).
> 2. **Independent with Penalty**: Colors grow to 100%, but holding one actively drains others?
> *Proceeding with **Zero-sum (Start at 25%)** as the default for balanced gameplay.*

## Proposed Architecture
- **Framework**: React (using Vite) - Fast, responsive, and great for state management.
- **Language**: TypeScript - For robust logic handling.
- **Styling**: Vanilla CSS - For custom, high-performance "premium" animations without framework overhead.
- **Backend/DB**: Firebase Realtime Database - Ideal for sub-second latency updates across 5 devices.
- **Deployment**: Firebase Hosting (PWA capabilities).

### Data Schema (Realtime DB)
```json
{
  "gameState": {
    "status": "IDLE | PLAYING | ENDED",
    "endTime": 1723456789000, 
    "scores": {
      "red": 25.0,
      "green": 25.0,
      "blue": 25.0,
      "yellow": 25.0
    },
    "capturing": {
      "flag1_deviceId": "red",
      "flag2_deviceId": "blue"
    }
  }
}
```

## Component Breakdown

### 1. General App Structure
- **Router**: Simple routing based on URL (e.g., `/admin`, `/flag?id=1`).
- **Context**: `GameContext` to handle Firebase subscriptions and global state.

### 2. Admin Dashboard (`/admin`)
- **Controls**: 
    - Time Picker (Specific time of day).
    - Start / Stop / Reset buttons.
- **Live View**: Large graph or progress bars showing current percentages of all bases.
- **Status Panel**: List of connected flag devices and their active status.

### 3. Flag Interface (`/flag`)
- **Layout**: 
    - Screen split into 4 touchable color zones (Red, Green, Blue, Yellow).
    - **Visual Feedback**: When pressed, the zone glows/ripples.
- **Interaction**:
    - `onTouchStart`: Sends "Start Capturing [Color]" to DB.
    - `onTouchEnd`: Sends "Stop Capturing" to DB.
- **End Screen**:
    - Overlay that appears automatically when `gameState.status === 'ENDED'` or `Date.now() > endTime`.

### 4. Simulation Dashboard (`/simulator`)
- **Purpose**: Test game mechanics on a PC without needing physical devices.
- **UI**: 
    - Display 4 (or N) "Virtual Phones" in a grid.
    - Each Virtual Phone has buttons to simulate "Hold Red", "Release Red", etc.
- **Functionality**:
    - Acts effectively as 4 separate browser windows but consolidated into one view.
    - Writes to Firebase just like real phones.

### 5. Game Logic (The "Brain")
Since this is a client-side app, we need a "Server Authority". Ideally, the **Admin Dashboard** will act as the host.
- **The Loop**: Run a `setInterval` (e.g., every 100ms) on the Admin device.

- **Calculations**:
    - Check which colors are currently being held (from DB `capturing` node).
    - Calculate delta: `Score += Rate * DeltaTime`.
    - Apply "Drag": If Red increases by `X`, decrease Green, Blue, Yellow by `X/3`.
    - Update `scores` in DB.
    - Check Time: If `now >= endTime`, set status to `ENDED`.

## Step-by-Step Implementation Steps

### Phase 1: Setup
- Initialize Vite Project.
- Set up Firebase Project & Config.
- Create basic directory structure.

### Phase 2: Connecting the Pipes
- Implement `useFirebase` hook to read/write `gameState`.
- Create a test button to toggle state and verify all screens update instantly.

### Phase 3: UI Implementation
- **Flag UI**: Create the 4-quadrant touch interface. Add CSS animations for "pressing".
- **Admin UI**: Build the dashboard with chart visualizations.
- **Simulator UI**: Build the grid of virtual phones for testing.

### Phase 4: The Game Loop
- Implement the centralized scoring logic in the Admin component.
- Handle the "Time of Day" logic (calculating duration remaining).

### Phase 5: Polish & Deployment
- proper "End Game" splash screen.
- Prevent screen sleep (Wake Lock API).
- Deploy to Firebase Hosting.

## Verification Plan
### Automated Tests
- Unit tests for the scoring algorithm (ensure math adds up to 100%).
### Manual Verification
- Open Admin on Laptop.
- **Use Simulator**: Open `/simulator` on the same laptop.
    - Simulate "Player 1 holds Red".
    - Simulate "Player 2 holds Green".
- Verify Admin chart updates in real-time.
- Verify "Tug-of-War" logic (Red goes up, Green goes up, others drop).
