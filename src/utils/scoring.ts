// ═══════════════════════════════════════════════════════════════
// Scoring & Validation Utilities for CodeCupid
// ═══════════════════════════════════════════════════════════════

import { UserProfile } from "@/context/AuthContext";
import { Project } from "@/services/firestore";

// ─── Skill → Category Mapping ────────────────────
export const SKILL_CATEGORIES: Record<string, string[]> = {
  Frontend: ["React", "Next.js", "TailwindCSS", "Flutter", "UI/UX", "Figma"],
  Backend: ["Node.js", "Go", "Rust", "GraphQL"],
  "AI/ML": ["Python", "AI/ML"],
  "UI/UX": ["Figma", "UI/UX"],
  DevOps: ["Docker", "AWS"],
  Database: ["Firebase", "MongoDB", "PostgreSQL"],
};

export const ALL_CATEGORIES = Object.keys(SKILL_CATEGORIES);

export function getSkillCategory(skill: string): string[] {
  return ALL_CATEGORIES.filter((cat) =>
    SKILL_CATEGORIES[cat].includes(skill)
  );
}

// ─── Market Saturation Score ─────────────────────
// Compares a project's requiredSkills against all existing projects
export function calcMarketSaturation(
  requiredSkills: string[],
  allProjects: Project[]
): number {
  if (allProjects.length === 0) return 0;

  const similarities = allProjects.map((p) => {
    const overlap = p.requiredSkills?.filter((s) =>
      requiredSkills.includes(s)
    ).length || 0;
    const total = new Set([...requiredSkills, ...(p.requiredSkills || [])]).size;
    return total > 0 ? overlap / total : 0;
  });

  const avgSimilarity =
    similarities.reduce((a, b) => a + b, 0) / similarities.length;
  return Math.min(avgSimilarity * 2, 1); // Scale up, cap at 1
}

// ─── Tech Feasibility Score ──────────────────────
// Compares owner skills vs required skills (higher = more feasible)
export function calcTechFeasibility(
  ownerSkills: string[],
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 1;
  const covered = requiredSkills.filter((s) =>
    ownerSkills.includes(s)
  ).length;
  return covered / requiredSkills.length;
}

// ─── Execution Potential ─────────────────────────
export function calcExecutionPotential(
  requiredSkillsCount: number,
  maxTeamSize: number,
  ownerCoverage: number
): number {
  const skillComplexity = Math.max(0, 1 - requiredSkillsCount / 10);
  const teamCapacity = Math.min(maxTeamSize / 5, 1);
  return skillComplexity * 0.3 + teamCapacity * 0.3 + ownerCoverage * 0.4;
}

// ─── Final Risk Score ────────────────────────────
export function calcRiskScore(
  marketSaturation: number,
  techFeasibility: number,
  executionPotential: number
): number {
  return (
    marketSaturation * 0.4 +
    (1 - techFeasibility) * 0.4 +
    (1 - executionPotential) * 0.2
  );
}

export function getRiskLevel(
  score: number
): { label: string; color: string; bg: string } {
  if (score < 0.35)
    return { label: "Low Risk", color: "text-emerald-400", bg: "bg-emerald-500/20" };
  if (score < 0.65)
    return { label: "Medium Risk", color: "text-yellow-400", bg: "bg-yellow-500/20" };
  return { label: "High Risk", color: "text-red-400", bg: "bg-red-500/20" };
}

// ─── Team Coverage Analyzer ──────────────────────
export interface TeamCoverage {
  category: string;
  status: "covered" | "partial" | "missing";
  members: string[];
}

export function analyzeTeamCoverage(
  teamMembers: UserProfile[],
  requiredSkills: string[]
): TeamCoverage[] {
  // Determine which categories are needed based on required skills
  const neededCategories = new Set<string>();
  requiredSkills.forEach((skill) => {
    getSkillCategory(skill).forEach((cat) => neededCategories.add(cat));
  });

  // If no specific categories from skills, check all
  const categoriesToCheck =
    neededCategories.size > 0 ? Array.from(neededCategories) : ALL_CATEGORIES;

  return categoriesToCheck.map((category) => {
    const categorySkills = SKILL_CATEGORIES[category];
    const membersWithSkill = teamMembers.filter((m) =>
      m.skills?.some((s) => categorySkills.includes(s))
    );

    const requiredInCategory = requiredSkills.filter((s) =>
      categorySkills.includes(s)
    );
    const coveredInCategory = requiredInCategory.filter((s) =>
      teamMembers.some((m) => m.skills?.includes(s))
    );

    let status: "covered" | "partial" | "missing";
    if (membersWithSkill.length === 0) status = "missing";
    else if (
      requiredInCategory.length > 0 &&
      coveredInCategory.length < requiredInCategory.length
    )
      status = "partial";
    else status = "covered";

    return {
      category,
      status,
      members: membersWithSkill.map((m) => m.name),
    };
  });
}

export function calcTeamCoverageScore(coverage: TeamCoverage[]): number {
  if (coverage.length === 0) return 0;
  const covered = coverage.filter((c) => c.status === "covered").length;
  const partial = coverage.filter((c) => c.status === "partial").length;
  return (covered + partial * 0.5) / coverage.length;
}

export function calcTeamStrengthIndex(
  teamMembers: UserProfile[],
  coverageScore: number
): number {
  // Skill diversity: unique skills / total possible
  const allSkills = new Set(teamMembers.flatMap((m) => m.skills || []));
  const skillDiversity = Math.min(allSkills.size / 10, 1);

  // Experience mix: spread of semesters
  const semesters = teamMembers.map((m) => m.semester || 1);
  const semRange =
    semesters.length > 1
      ? (Math.max(...semesters) - Math.min(...semesters)) / 8
      : 0;
  const experienceMix = Math.min(semRange + 0.3, 1);

  return skillDiversity * 0.5 + experienceMix * 0.3 + coverageScore * 0.2;
}

// ─── Smart Team Builder ──────────────────────────
export const PROJECT_TYPE_ROLES: Record<string, string[]> = {
  SaaS: ["Frontend", "Backend", "UI/UX", "Database"],
  AI: ["AI/ML", "Backend", "Frontend", "DevOps"],
  "Web App": ["Frontend", "Backend", "UI/UX", "Database"],
  "Mobile App": ["Frontend", "UI/UX", "Backend", "Database"],
};

export interface CandidateSuggestion {
  user: UserProfile;
  role: string;
  matchScore: number;
  skillMatchPercent: number;
  commonInterests: number;
}

export function suggestTeamMembers(
  projectType: string,
  preferredStack: string[],
  allUsers: UserProfile[],
  excludeUids: string[]
): Record<string, CandidateSuggestion[]> {
  const roles = PROJECT_TYPE_ROLES[projectType] || PROJECT_TYPE_ROLES["Web App"];
  const result: Record<string, CandidateSuggestion[]> = {};

  const available = allUsers.filter(
    (u) => !excludeUids.includes(u.uid)
  );

  for (const role of roles) {
    const roleSkills = SKILL_CATEGORIES[role] || [];
    const candidates: CandidateSuggestion[] = available
      .map((user) => {
        const userSkills = user.skills || [];
        const relevantSkills = [...roleSkills, ...preferredStack];
        const matchedSkills = userSkills.filter((s) =>
          relevantSkills.includes(s)
        );
        const skillMatchPercent =
          relevantSkills.length > 0
            ? matchedSkills.length / relevantSkills.length
            : 0;

        const commonInterests = (user.interests || []).filter((i) =>
          ["Hackathons", "SaaS", "Web Dev", "AI", "Open Source"].includes(i)
        ).length;

        const matchScore =
          skillMatchPercent * 0.6 +
          (commonInterests / 5) * 0.2 +
          0.2; // activity placeholder

        return {
          user,
          role,
          matchScore,
          skillMatchPercent,
          commonInterests,
        };
      })
      .filter((c) => c.skillMatchPercent > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    result[role] = candidates;
  }

  return result;
}
