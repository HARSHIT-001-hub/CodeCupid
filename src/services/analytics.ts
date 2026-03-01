// Analytics service — compute dashboard stats from Firestore
import {
  collection, getDocs, query, where, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SKILLS, DEPARTMENTS } from "@/data/constants";

export interface AnalyticsData {
  totalUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalMatches: number;
  skillDemand: { skill: string; count: number }[];
  departmentActivity: { department: string; count: number }[];
  projectCompletionRate: number;
  topSkill: string;
  topDepartment: string;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const [usersSnap, projectsSnap, matchesSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "projects")),
    getDocs(collection(db, "matches")),
  ]);

  const users = usersSnap.docs.map((d) => d.data());
  const projects = projectsSnap.docs.map((d) => d.data());

  // Skill demand from projects
  const skillCount: Record<string, number> = {};
  projects.forEach((p) => {
    (p.requiredSkills || []).forEach((s: string) => {
      skillCount[s] = (skillCount[s] || 0) + 1;
    });
  });
  const skillDemand = Object.entries(skillCount)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);

  // Department activity from users
  const deptCount: Record<string, number> = {};
  users.forEach((u) => {
    const dept = u.department || "Unknown";
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  });
  const departmentActivity = Object.entries(deptCount)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  // Project completion
  const closedProjects = projects.filter((p) => p.status === "closed").length;
  const projectCompletionRate =
    projects.length > 0 ? closedProjects / projects.length : 0;

  return {
    totalUsers: users.length,
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "open").length,
    totalMatches: matchesSnap.size,
    skillDemand,
    departmentActivity,
    projectCompletionRate,
    topSkill: skillDemand[0]?.skill || "N/A",
    topDepartment: departmentActivity[0]?.department || "N/A",
  };
}
