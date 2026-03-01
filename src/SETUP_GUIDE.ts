// ═══════════════════════════════════════════════════════════════
// CodeCupid: Firebase Setup Guide
// ═══════════════════════════════════════════════════════════════
//
// STEP 1: Create a Firebase Project
// ─────────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Click "Add project" and follow the wizard
// 3. Enable Google Analytics (optional)
//
// STEP 2: Enable Authentication
// ─────────────────────────────
// 1. In Firebase Console → Authentication → Sign-in method
// 2. Enable "Email/Password" provider
//
// STEP 3: Create Firestore Database
// ──────────────────────────────────
// 1. In Firebase Console → Firestore Database
// 2. Click "Create database"
// 3. Start in TEST MODE (for development)
// 4. Choose your region
//
// STEP 4: Get Your Firebase Config
// ─────────────────────────────────
// 1. Go to Project Settings → General
// 2. Under "Your apps", click the Web icon (</>)
// 3. Register your app
// 4. Copy the firebaseConfig object
// 5. Paste it into src/lib/firebase.ts
//
// STEP 5: Deploy Firestore Security Rules
// ────────────────────────────────────────
// Copy the rules below into Firestore → Rules tab:
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     // Users: anyone authenticated can read, only owner can write
//     match /users/{userId} {
//       allow read: if request.auth != null;
//       allow write: if request.auth != null && request.auth.uid == userId;
//     }
//
//     // Likes: authenticated users can create, read own likes
//     match /likes/{likeId} {
//       allow read: if request.auth != null;
//       allow create: if request.auth != null;
//     }
//
//     // Matches: participants can read
//     match /matches/{matchId} {
//       allow read: if request.auth != null && request.auth.uid in resource.data.users;
//       allow create: if request.auth != null;
//     }
//
//     // Chats: participants can read/write
//     match /chats/{chatId} {
//       allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
//       allow create: if request.auth != null;
//
//       match /messages/{messageId} {
//         allow read, write: if request.auth != null;
//       }
//     }
//
//     // Projects: anyone authenticated can read, owner manages
//     match /projects/{projectId} {
//       allow read: if request.auth != null;
//       allow create: if request.auth != null;
//       allow update: if request.auth != null;
//
//       match /applications/{appId} {
//         allow read: if request.auth != null;
//         allow create: if request.auth != null;
//         allow update: if request.auth != null;
//       }
//     }
//   }
// }
//
// STEP 6: Seed Dummy Data
// ───────────────────────
// 1. Sign up with a test account
// 2. Go to Profile page
// 3. Click "Seed Dummy Data to Firestore" button
//
// ═══════════════════════════════════════════════════════════════
// Firestore Collections Schema
// ═══════════════════════════════════════════════════════════════
//
// users/{uid}
//   - name: string
//   - email: string
//   - semester: number
//   - department: string
//   - skills: string[]
//   - interests: string[]
//   - bio: string
//   - githubLink: string
//   - photoURL: string
//   - createdAt: timestamp
//
// likes/{fromUid_toUid}
//   - from: string (uid)
//   - to: string (uid)
//   - createdAt: timestamp
//
// matches/{sortedUid1_uid2}
//   - users: string[] (both uids)
//   - createdAt: timestamp
//
// chats/{chatId}
//   - participants: string[]
//   - type: "direct" | "group"
//   - projectId?: string
//   - projectTitle?: string
//   - lastMessage: { text, senderId, timestamp }
//   - typing: { [uid]: boolean }
//   - createdAt: timestamp
//
// chats/{chatId}/messages/{msgId}
//   - senderId: string
//   - text: string
//   - timestamp: timestamp
//
// projects/{projectId}
//   - title: string
//   - description: string
//   - requiredSkills: string[]
//   - maxTeamSize: number
//   - status: "open" | "closed"
//   - ownerId: string
//   - ownerName: string
//   - teamMembers: string[]
//   - createdAt: timestamp
//
// projects/{projectId}/applications/{appId}
//   - applicantId: string
//   - applicantName: string
//   - message: string
//   - status: "pending" | "accepted" | "rejected"
//   - createdAt: timestamp
//
export {};
