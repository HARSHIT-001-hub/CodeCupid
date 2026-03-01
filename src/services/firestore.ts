// Firestore service — all database operations
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, arrayUnion,
  deleteDoc, limit, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/context/AuthContext";

// ─── Users ───────────────────────────────────────
export const getUsers = async (filters?: {
  semester?: number;
  department?: string;
  skill?: string;
}): Promise<UserProfile[]> => {
  let q = query(collection(db, "users"));

  // Firestore only allows one inequality filter, so we apply in-memory for multi-filter
  const snap = await getDocs(q);
  let users = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));

  if (filters?.semester) users = users.filter((u) => u.semester === filters.semester);
  if (filters?.department) users = users.filter((u) => u.department === filters.department);
  if (filters?.skill) users = users.filter((u) => u.skills?.includes(filters.skill));

  return users;
};

// ─── Likes & Matching ────────────────────────────
export const likeUser = async (fromUid: string, toUid: string): Promise<boolean> => {
  // Record the like
  await setDoc(doc(db, "likes", `${fromUid}_${toUid}`), {
    from: fromUid,
    to: toUid,
    createdAt: serverTimestamp(),
  });

  // Check if the other user already liked us → mutual match
  const reverseSnap = await getDoc(doc(db, "likes", `${toUid}_${fromUid}`));
  if (reverseSnap.exists()) {
    // Create match
    const matchId = [fromUid, toUid].sort().join("_");
    await setDoc(doc(db, "matches", matchId), {
      users: [fromUid, toUid],
      createdAt: serverTimestamp(),
    });
    // Create chat for the match
    await setDoc(doc(db, "chats", matchId), {
      participants: [fromUid, toUid],
      type: "direct",
      createdAt: serverTimestamp(),
      lastMessage: null,
    });
    return true; // It's a match!
  }
  return false;
};

export const getMatches = (
  uid: string,
  callback: (matches: { matchId: string; partnerUid: string }[]) => void
) => {
  const q = query(collection(db, "matches"), where("users", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const matches = snap.docs.map((d) => ({
      matchId: d.id,
      partnerUid: (d.data().users as string[]).find((u) => u !== uid) || "",
    }));
    callback(matches);
  });
};

export const getLikedUserIds = async (uid: string): Promise<string[]> => {
  const q = query(collection(db, "likes"), where("from", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().to as string);
};

// ─── Chat ────────────────────────────────────────
export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
}

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  const msgRef = collection(db, "chats", chatId, "messages");
  await addDoc(msgRef, {
    senderId,
    text,
    timestamp: serverTimestamp(),
  });
  // Update last message on chat doc
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: { text, senderId, timestamp: serverTimestamp() },
  });
};

export const subscribeToMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
    callback(msgs);
  });
};

export const getUserChats = (
  uid: string,
  callback: (chats: any[]) => void
) => {
  const q = query(collection(db, "chats"), where("participants", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(chats);
  });
};

// Set typing indicator
export const setTypingStatus = async (chatId: string, uid: string, isTyping: boolean) => {
  await updateDoc(doc(db, "chats", chatId), {
    [`typing.${uid}`]: isTyping,
  });
};

export const subscribeToTyping = (chatId: string, callback: (typing: Record<string, boolean>) => void) => {
  return onSnapshot(doc(db, "chats", chatId), (snap) => {
    const data = snap.data();
    callback(data?.typing || {});
  });
};

// ─── Projects (Help Wanted) ─────────────────────
export interface Project {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  maxTeamSize: number;
  status: "open" | "closed";
  ownerId: string;
  ownerName: string;
  teamMembers: string[];
  createdAt: any;
}

export interface Application {
  id: string;
  applicantId: string;
  applicantName: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: any;
}

export const createProject = async (data: Omit<Project, "id" | "createdAt">) => {
  const ref = await addDoc(collection(db, "projects"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getProjects = (callback: (projects: Project[]) => void) => {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
    callback(projects);
  });
};

export const applyToProject = async (
  projectId: string,
  applicantId: string,
  applicantName: string,
  message: string
) => {
  await addDoc(collection(db, "projects", projectId, "applications"), {
    applicantId,
    applicantName,
    message,
    status: "pending",
    createdAt: serverTimestamp(),
  });
};

export const getApplications = (
  projectId: string,
  callback: (apps: Application[]) => void
) => {
  const q = query(collection(db, "projects", projectId, "applications"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application));
    callback(apps);
  });
};

export const handleApplication = async (
  projectId: string,
  applicationId: string,
  applicantId: string,
  decision: "accepted" | "rejected"
) => {
  // Update application status
  await updateDoc(doc(db, "projects", projectId, "applications", applicationId), {
    status: decision,
  });

  if (decision === "accepted") {
    // Add to team members
    await updateDoc(doc(db, "projects", projectId), {
      teamMembers: arrayUnion(applicantId),
    });

    // Check if team is full → close project
    const projSnap = await getDoc(doc(db, "projects", projectId));
    const projData = projSnap.data();
    if (projData && projData.teamMembers?.length >= projData.maxTeamSize) {
      await updateDoc(doc(db, "projects", projectId), { status: "closed" });
    }

    // Create/update group chat for the project
    const chatRef = doc(db, "chats", `project_${projectId}`);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      await updateDoc(chatRef, { participants: arrayUnion(applicantId) });
    } else {
      await setDoc(chatRef, {
        participants: [projData?.ownerId, applicantId],
        type: "group",
        projectId,
        projectTitle: projData?.title,
        createdAt: serverTimestamp(),
        lastMessage: null,
      });
    }
  }
};

// ─── Seed Data ───────────────────────────────────
export const seedDummyData = async () => {
  const dummyUsers = [
    {
      uid: "demo_aarav",
      name: "Aarav Patel",
      email: "aarav@campus.edu",
      semester: 5,
      department: "Computer Science",
      skills: ["React", "Node.js", "TypeScript", "MongoDB"],
      interests: ["Hackathons", "SaaS", "Web Dev"],
      bio: "Full-stack dev obsessed with clean code and scalable systems.",
      githubLink: "https://github.com/aaravpatel",
      photoURL: "",
    },
    {
      uid: "demo_priya",
      name: "Priya Sharma",
      email: "priya@campus.edu",
      semester: 6,
      department: "Data Science",
      skills: ["Python", "AI/ML", "TailwindCSS", "Figma"],
      interests: ["AI", "Data Science", "Open Source"],
      bio: "ML enthusiast who loves turning data into actionable insights.",
      githubLink: "https://github.com/priyasharma",
      photoURL: "",
    },
    {
      uid: "demo_rohan",
      name: "Rohan Mehta",
      email: "rohan@campus.edu",
      semester: 4,
      department: "Information Technology",
      skills: ["Flutter", "Firebase", "UI/UX", "Figma"],
      interests: ["Mobile Dev", "Hackathons", "Game Dev"],
      bio: "Mobile-first developer with an eye for design. Won 3 hackathons.",
      githubLink: "https://github.com/rohanmehta",
      photoURL: "",
    },
    {
      uid: "demo_sneha",
      name: "Sneha Reddy",
      email: "sneha@campus.edu",
      semester: 7,
      department: "AI & ML",
      skills: ["Python", "AI/ML", "Docker", "AWS"],
      interests: ["AI", "DevOps", "SaaS"],
      bio: "Building intelligent systems that solve real problems.",
      githubLink: "https://github.com/snehareddy",
      photoURL: "",
    },
    {
      uid: "demo_vikram",
      name: "Vikram Singh",
      email: "vikram@campus.edu",
      semester: 3,
      department: "Computer Science",
      skills: ["React", "Next.js", "GraphQL", "TailwindCSS"],
      interests: ["Web Dev", "Open Source", "SaaS"],
      bio: "Frontend wizard who cares about pixels.",
      githubLink: "https://github.com/vikramsingh",
      photoURL: "",
    },
    {
      uid: "demo_ananya",
      name: "Ananya Gupta",
      email: "ananya@campus.edu",
      semester: 5,
      department: "Electronics",
      skills: ["Rust", "Go", "Docker", "PostgreSQL"],
      interests: ["IoT", "Cybersecurity", "DevOps"],
      bio: "Systems programmer who loves low-level optimization.",
      githubLink: "https://github.com/ananyagupta",
      photoURL: "",
    },
  ];

  for (const user of dummyUsers) {
    await setDoc(doc(db, "users", user.uid), {
      ...user,
      createdAt: serverTimestamp(),
    });
  }

  // Seed projects
  const dummyProjects = [
    {
      title: "Campus Food Delivery App",
      description: "A food ordering platform for campus canteens with real-time tracking.",
      requiredSkills: ["React", "Node.js", "Flutter"],
      maxTeamSize: 4,
      status: "open" as const,
      ownerId: "demo_aarav",
      ownerName: "Aarav Patel",
      teamMembers: ["demo_aarav"],
    },
    {
      title: "AI Study Buddy",
      description: "An AI-powered study companion that generates quizzes and summarizes notes.",
      requiredSkills: ["Python", "AI/ML", "React"],
      maxTeamSize: 3,
      status: "open" as const,
      ownerId: "demo_priya",
      ownerName: "Priya Sharma",
      teamMembers: ["demo_priya"],
    },
    {
      title: "Smart Attendance System",
      description: "Face recognition-based attendance for classrooms with analytics.",
      requiredSkills: ["Python", "AI/ML", "Docker"],
      maxTeamSize: 5,
      status: "open" as const,
      ownerId: "demo_sneha",
      ownerName: "Sneha Reddy",
      teamMembers: ["demo_sneha"],
    },
  ];

  for (const proj of dummyProjects) {
    await addDoc(collection(db, "projects"), {
      ...proj,
      createdAt: serverTimestamp(),
    });
  }

  console.log("✅ Seed data loaded!");
};
