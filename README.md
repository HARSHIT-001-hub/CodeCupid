# CodeCupid 💘

CodeCupid is a campus-first developer collaboration platform where students can discover teammates, match based on skills, chat in real time, and build projects together.

It combines a swipe-based discovery UX with project recruitment, analytics, and team-strength/risk insights.

---

## ✨ Core Features

- **Skill-based discovery**: Tinder-style swipe cards for finding compatible developers.
- **Mutual matching**: likes become matches and auto-create direct chats.
- **Realtime chat**: direct and project group chat with typing indicators.
- **Help Wanted board**: create projects, define required skills, and accept/reject applicants.
- **Team intelligence**:
	- project risk score (market saturation, feasibility, execution potential)
	- team coverage analysis by skill category
	- smart team member suggestions by project type
- **Milestone tracking**: per-project milestone lifecycle with progress and at-risk detection.
- **Analytics dashboard**: users, projects, matches, skill demand, department activity, completion rate.
- **Auth + profile system**: Firebase email/password auth and user profile metadata.
- **Responsive UI + theme support**: desktop top-nav and mobile bottom-nav, dark/light mode.

---

## 🧱 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite 5
- React Router
- TanStack Query
- Framer Motion
- Recharts

### UI / Styling
- Tailwind CSS
- shadcn/ui + Radix UI primitives
- Lucide icons
- Sonner + shadcn toasts

### Backend / Data
- Firebase Authentication
- Firestore (realtime + subcollections)
- Firebase Storage (configured)

### Testing & Quality
- Vitest + Testing Library
- ESLint

---

## 📁 Project Structure

```text
src/
	components/         # Reusable UI and feature components
	context/            # Auth and theme providers
	data/               # Static constants (skills, departments, interests)
	hooks/              # Custom hooks
	lib/                # Firebase + shared utilities
	pages/              # Route-level pages
	services/           # Firestore, milestones, analytics services
	test/               # Vitest setup and tests
	utils/              # Scoring and analysis utilities
```

---

## 🚀 Getting Started

### 1) Prerequisites

- Node.js 18+
- npm (or pnpm / bun)
- Firebase project (Auth + Firestore enabled)

### 2) Install dependencies

```bash
npm install
```

### 3) Configure Firebase

Update `src/lib/firebase.ts` with your own Firebase web config:

```ts
const firebaseConfig = {
	apiKey: "...",
	authDomain: "...",
	projectId: "...",
	storageBucket: "...",
	messagingSenderId: "...",
	appId: "...",
};
```

> Note: Firebase web keys are publishable client keys, but you should still use your own project and security rules.

### 4) Run the app

```bash
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

---

## 🔐 Firebase Setup Checklist

1. Create Firebase project.
2. Enable **Authentication → Email/Password**.
3. Create **Firestore Database** (start in test mode for local dev).
4. Add a **Web App** and copy config into `src/lib/firebase.ts`.
5. Add production-ready Firestore rules before public deployment.

Recommended baseline access strategy:
- authenticated users can read user/project/match/chat data they are allowed to access
- writes limited to owners/participants where applicable

---

## 🗂 Firestore Data Model (Current App)

- `users/{uid}`: profile, skills, interests, semester, department, bio, github link
- `likes/{fromUid_toUid}`: one-way likes
- `matches/{uidA_uidB}`: mutual likes + participants
- `chats/{chatId}`: participants, type (`direct`/`group`), last message, optional project info
- `chats/{chatId}/messages/{messageId}`: sender, text, timestamp
- `projects/{projectId}`: owner, status, required skills, team members, limits
- `projects/{projectId}/applications/{appId}`: applicant, message, status
- `projects/{projectId}/milestones/{milestoneId}`: milestone lifecycle/status tracking

---

## 🧠 Product Flows

### 1) Discovery → Match → Chat
- User swipes right on a developer profile.
- App records a like.
- If reverse like exists, app creates a match + direct chat.

### 2) Project Collaboration
- Owner posts project with required skills and max team size.
- Other users apply with a message.
- Owner accepts/rejects applications.
- Accepted users are added to the team and project chat.

### 3) Project Intelligence
- Risk score evaluates project viability.
- Team coverage highlights skill gaps.
- Smart suggestions recommend candidates by role fit.

---

## 📊 Scripts

```bash
npm run dev         # Start local development server
npm run build       # Production build
npm run build:dev   # Development-mode build
npm run preview     # Preview built app
npm run lint        # Lint project
npm run test        # Run tests once
npm run test:watch  # Run tests in watch mode
```

---

## ✅ Testing

Current test setup is wired with Vitest + Testing Library.

Run:

```bash
npm run test
```

> There is currently a minimal sample test. Add feature-level tests for services and page flows as the next step.

---

## 🛠 Troubleshooting

- **Auth errors on signup/login**: verify Email/Password provider is enabled in Firebase Auth.
- **No data in Discover/Projects**: check Firestore rules and user documents.
- **Realtime updates not working**: confirm Firestore indexes/rules and network access.
- **Build failures**: ensure Node version compatibility and run a clean install.

---

## 🔒 Security Notes

- Replace bundled Firebase config with your own project configuration.
- Harden Firestore security rules before production.
- Restrict write permissions to document owners/authorized participants.
- Consider moving sensitive operational toggles (seeding/admin actions) behind role checks.

---

## 🧭 Roadmap Ideas

- Role-based permissions (admin/moderator)
- Better chat search/history tools
- Notification center for applications, acceptances, and milestones
- E2E tests for critical flows
- CI pipeline for lint + tests + build

---

