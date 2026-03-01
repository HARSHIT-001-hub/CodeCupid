// Milestone tracker service — Firestore operations for project milestones
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  createdAt: any;
  completedAt?: any;
}

export const addMilestone = async (
  projectId: string,
  data: Omit<Milestone, "id" | "createdAt">
) => {
  await addDoc(collection(db, "projects", projectId, "milestones"), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateMilestone = async (
  projectId: string,
  milestoneId: string,
  data: Partial<Milestone>
) => {
  const updates: any = { ...data };
  if (data.status === "completed") {
    updates.completedAt = serverTimestamp();
  }
  await updateDoc(
    doc(db, "projects", projectId, "milestones", milestoneId),
    updates
  );
};

export const deleteMilestone = async (
  projectId: string,
  milestoneId: string
) => {
  await deleteDoc(
    doc(db, "projects", projectId, "milestones", milestoneId)
  );
};

export const subscribeMilestones = (
  projectId: string,
  callback: (milestones: Milestone[]) => void
) => {
  const q = query(
    collection(db, "projects", projectId, "milestones"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const milestones = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Milestone)
    );
    callback(milestones);
  });
};

// Calculate progress & detect execution risk
export function getMilestoneProgress(milestones: Milestone[]) {
  if (milestones.length === 0)
    return { percent: 0, completed: 0, total: 0, atRisk: false };

  const completed = milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const percent = Math.round((completed / milestones.length) * 100);

  // Check if project has been idle (first milestone created > 7 days ago, progress < 20%)
  const firstCreated = milestones[0]?.createdAt;
  let atRisk = false;
  if (firstCreated?.toDate) {
    const daysSinceStart =
      (Date.now() - firstCreated.toDate().getTime()) / (1000 * 60 * 60 * 24);
    atRisk = daysSinceStart > 7 && percent < 20;
  }

  return { percent, completed, total: milestones.length, atRisk };
}
