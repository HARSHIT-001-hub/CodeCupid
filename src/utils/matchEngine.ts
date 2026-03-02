// ═══════════════════════════════════════════════════════════════
// AI Match Engine — Compatibility scoring between developers
// ═══════════════════════════════════════════════════════════════

import { UserProfile } from "@/context/AuthContext";
import { SKILL_CATEGORIES } from "@/utils/scoring";

export interface MatchBreakdown {
  skillComplement: number;
  interestOverlap: number;
  availabilityMatch: number;
  roleFit: number;
  total: number;
}

/**
 * Skill Complement: How well user B's skills complement user A's.
 * Higher score = more complementary (fills gaps), not just overlapping.
 */
function calcSkillComplement(userA: UserProfile, userB: UserProfile): number {
  const skillsA = userA.skills || [];
  const skillsB = userB.skills || [];
  if (skillsA.length === 0 && skillsB.length === 0) return 0;

  const setA = new Set(skillsA);

  // Complementary: skills B has that A doesn't
  const complementary = skillsB.filter((s) => !setA.has(s)).length;
  // Shared foundation: skills both have (some overlap is good)
  const shared = skillsB.filter((s) => setA.has(s)).length;
  const totalUnique = new Set([...skillsA, ...skillsB]).size;

  if (totalUnique === 0) return 0;

  // Weighted: complementary skills worth more, but shared foundation matters
  return Math.min((complementary * 0.7 + shared * 0.3) / Math.max(totalUnique * 0.6, 1), 1);
}

/**
 * Interest Overlap: Percentage of shared interests
 */
function calcInterestOverlap(userA: UserProfile, userB: UserProfile): number {
  const interestsA = userA.interests || [];
  const interestsB = userB.interests || [];
  if (interestsA.length === 0 && interestsB.length === 0) return 0;

  const setA = new Set(interestsA);
  const shared = interestsB.filter((i) => setA.has(i)).length;
  const totalUnique = new Set([...interestsA, ...interestsB]).size;

  return totalUnique > 0 ? shared / totalUnique : 0;
}

/**
 * Availability Match: Based on semester proximity (closer semesters = better collab)
 */
function calcAvailabilityMatch(userA: UserProfile, userB: UserProfile): number {
  const semA = userA.semester || 1;
  const semB = userB.semester || 1;
  const diff = Math.abs(semA - semB);
  // 0 diff = 1.0, 1 diff = 0.85, 2 diff = 0.7, etc.
  return Math.max(0, 1 - diff * 0.15);
}

/**
 * Role Fit: How well their skill categories complement each other
 * (e.g., Frontend + Backend = great fit)
 */
function calcRoleFit(userA: UserProfile, userB: UserProfile): number {
  const getCats = (skills: string[]) => {
    const cats = new Set<string>();
    skills.forEach((skill) => {
      Object.entries(SKILL_CATEGORIES).forEach(([cat, catSkills]) => {
        if (catSkills.includes(skill)) cats.add(cat);
      });
    });
    return cats;
  };

  const catsA = getCats(userA.skills || []);
  const catsB = getCats(userB.skills || []);

  if (catsA.size === 0 && catsB.size === 0) return 0;

  // Different categories = better role diversity
  const allCats = new Set([...catsA, ...catsB]);
  const sharedCats = [...catsA].filter((c) => catsB.has(c)).length;

  // More total coverage + some shared foundation = best
  const diversity = allCats.size / Object.keys(SKILL_CATEGORIES).length;
  const foundation = sharedCats > 0 ? 0.2 : 0;

  return Math.min(diversity + foundation, 1);
}

/**
 * Calculate full match breakdown between two users
 */
export function calculateMatch(userA: UserProfile, userB: UserProfile): MatchBreakdown {
  const skillComplement = calcSkillComplement(userA, userB);
  const interestOverlap = calcInterestOverlap(userA, userB);
  const availabilityMatch = calcAvailabilityMatch(userA, userB);
  const roleFit = calcRoleFit(userA, userB);

  const total =
    skillComplement * 0.4 +
    interestOverlap * 0.2 +
    availabilityMatch * 0.2 +
    roleFit * 0.2;

  return {
    skillComplement,
    interestOverlap,
    availabilityMatch,
    roleFit,
    total,
  };
}

/**
 * Get percentage (0-100) from match breakdown
 */
export function getMatchPercent(breakdown: MatchBreakdown): number {
  return Math.round(breakdown.total * 100);
}

/**
 * Get color class for match percentage
 */
export function getMatchColor(percent: number): { text: string; ring: string; bg: string } {
  if (percent >= 80) return { text: "text-emerald-400", ring: "stroke-emerald-400", bg: "bg-emerald-500/15" };
  if (percent >= 60) return { text: "text-yellow-400", ring: "stroke-yellow-400", bg: "bg-yellow-500/15" };
  return { text: "text-muted-foreground", ring: "stroke-muted-foreground", bg: "bg-muted" };
}
