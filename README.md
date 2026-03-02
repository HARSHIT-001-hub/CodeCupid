# CodeCupid – AI Powered Campus Innovation Engine

CodeCupid is a campus-only platform that connects developers, validates ideas, and builds complete innovation teams.

**Tagline:** Find Your Perfect Tech Match.

## Features

- **Skill-Based Matching** – Swipe through developer profiles and match with teammates who complement your tech stack
- **Problem Validation Engine** – Risk scoring, market saturation, and tech feasibility analysis for projects
- **Smart Team Builder** – AI-powered team suggestions based on project requirements
- **Help Wanted Board** – Post projects and recruit the exact roles you need
- **Real-Time Chat** – Direct and group messaging with typing indicators
- **Execution Tracker** – Milestone tracking with progress bars and risk warnings
- **Analytics Dashboard** – Campus-wide stats on skills, departments, and project activity

## Tech Stack

- React (Vite) + TypeScript
- Tailwind CSS
- Firebase Authentication
- Firestore (real-time)
- Framer Motion
- Recharts

## Getting Started

1. Clone the repo and install dependencies:
   ```sh
   npm install
   npm run dev
   ```

2. Set up Firebase – see `src/SETUP_GUIDE.ts` for detailed instructions

3. Deploy Firestore security rules from the setup guide

4. Sign up with a test account, go to Profile, and click "Seed Dummy Data" to populate the app

## Project Structure

- `src/context/` – Auth context with Firebase integration
- `src/services/` – Firestore operations, analytics, milestones
- `src/components/` – Reusable UI components
- `src/pages/` – Route pages (Discover, Matches, Projects, Analytics, Chat, Profile)
- `src/utils/` – Scoring and validation utilities
- `src/data/` – Shared constants (skills, interests, departments)

© 2026 CodeCupid. All rights reserved.
