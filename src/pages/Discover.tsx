import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/context/AuthContext";
import { getUsers, likeUser, getLikedUserIds, getProjects, Project } from "@/services/firestore";
import DevCard from "@/components/DevCard";
import ProfileModal from "@/components/ProfileModal";
import MatchBadge from "@/components/MatchBadge";
import CompatibilityModal from "@/components/CompatibilityModal";
import SmartFilters, { FilterState } from "@/components/SmartFilters";
import TrendingSection from "@/components/TrendingSection";
import DiscoverProjectCard from "@/components/DiscoverProjectCard";
import Layout from "@/components/Layout";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { toast } from "sonner";
import { calculateMatch, getMatchPercent, MatchBreakdown } from "@/utils/matchEngine";
import { useIsMobile } from "@/hooks/use-mobile";

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY = 500;

const CardSkeleton = () => (
  <div className="glass-card rounded-2xl p-6 w-full max-w-sm mx-auto animate-pulse">
    <div className="flex justify-center mb-5">
      <div className="w-24 h-24 rounded-full bg-muted" />
    </div>
    <div className="space-y-3">
      <div className="h-5 bg-muted rounded-lg w-3/4 mx-auto" />
      <div className="h-3 bg-muted rounded-lg w-1/2 mx-auto" />
      <div className="h-12 bg-muted rounded-lg w-full" />
      <div className="flex gap-2 justify-center">
        {[1, 2, 3].map(i => <div key={i} className="h-6 w-16 bg-muted rounded-full" />)}
      </div>
    </div>
  </div>
);

const Discover = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false);
  const [modalUserId, setModalUserId] = useState<string | null>(null);

  // Toggle: developers vs projects
  const [mode, setMode] = useState<"developers" | "projects">("developers");

  // Smart filters
  const [filters, setFilters] = useState<FilterState>({ skills: [], department: "", semester: "", minMatch: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Compatibility modal
  const [compatUser, setCompatUser] = useState<{ breakdown: MatchBreakdown; name: string } | null>(null);

  // Framer Motion drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1]);
  const controls = useAnimation();

  // Load users
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      setLoadingUsers(true);
      const [allUsers, liked] = await Promise.all([getUsers(), getLikedUserIds(profile.uid)]);
      if (cancelled) return;
      setUsers(allUsers.filter((u) => u.uid !== profile.uid && !liked.includes(u.uid)));
      setLoadingUsers(false);
    };
    load();
    return () => { cancelled = true; };
  }, [profile]);

  // Load projects
  useEffect(() => {
    const unsub = getProjects(setProjects);
    return unsub;
  }, []);

  // Compute match breakdowns
  const matchData = useMemo(() => {
    if (!profile) return {};
    const data: Record<string, MatchBreakdown> = {};
    users.forEach((u) => {
      data[u.uid] = calculateMatch(profile, u);
    });
    return data;
  }, [profile, users]);

  const matchPercents = useMemo(() => {
    const pcts: Record<string, number> = {};
    Object.entries(matchData).forEach(([uid, bd]) => {
      pcts[uid] = getMatchPercent(bd);
    });
    return pcts;
  }, [matchData]);

  // Filtered developers
  const filtered = useMemo(() => {
    return users.filter((d) => {
      if (filters.department && d.department !== filters.department) return false;
      if (filters.semester && d.semester !== Number(filters.semester)) return false;
      if (filters.skills.length > 0 && !filters.skills.some((s) => d.skills?.includes(s))) return false;
      if (filters.minMatch > 0 && (matchPercents[d.uid] || 0) < filters.minMatch) return false;
      return true;
    });
  }, [users, filters, matchPercents]);

  // Trending: top 6 by match score (proxy for trending)
  const trending = useMemo(() => {
    return [...users]
      .sort((a, b) => (matchPercents[b.uid] || 0) - (matchPercents[a.uid] || 0))
      .slice(0, 6);
  }, [users, matchPercents]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.skills.length > 0 && !filters.skills.some((s) => p.requiredSkills?.includes(s))) return false;
      return true;
    });
  }, [projects, filters]);

  const visibleCards = useMemo(() => filtered.slice(currentIndex, currentIndex + 3), [filtered, currentIndex]);

  const advanceCard = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    x.set(0);
    setIsSwiping(false);
  }, [x]);

  const handleSwipeRight = useCallback(async () => {
    if (isSwiping) return;
    setIsSwiping(true);
    const dev = filtered[currentIndex];
    if (!dev || !profile) { setIsSwiping(false); return; }
    await controls.start({ x: 300, opacity: 0, rotate: 15, transition: { type: "spring", damping: 30, stiffness: 300 } });
    likeUser(profile.uid, dev.uid).then((isMatch) => {
      if (isMatch) toast.success(`🎉 It's a match with ${dev.name}!`);
    }).catch(console.error);
    advanceCard();
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [isSwiping, filtered, currentIndex, profile, controls, advanceCard]);

  const handleSwipeLeft = useCallback(async () => {
    if (isSwiping) return;
    setIsSwiping(true);
    await controls.start({ x: -300, opacity: 0, rotate: -15, transition: { type: "spring", damping: 30, stiffness: 300 } });
    advanceCard();
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [isSwiping, controls, advanceCard]);

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) handleSwipeRight();
    else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) handleSwipeLeft();
    else controls.start({ x: 0, rotate: 0, opacity: 1, transition: { type: "spring", damping: 20 } });
  }, [handleSwipeRight, handleSwipeLeft, controls]);

  const handleFiltersChange = useCallback((f: FilterState) => {
    setFilters(f);
    setCurrentIndex(0);
  }, []);

  const currentDev = filtered[currentIndex];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Discover</h1>
            <p className="text-sm text-muted-foreground">Find your next teammate</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle mode */}
            <div className="flex rounded-xl bg-secondary p-0.5">
              <button
                onClick={() => setMode("developers")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === "developers" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Developers
              </button>
              <button
                onClick={() => setMode("projects")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === "projects" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Projects
              </button>
            </div>
            {/* Mobile filter button */}
            {isMobile && (
              <div className="relative">
                <SmartFilters filters={filters} onChange={handleFiltersChange} isOpen={showFilters} onToggle={() => setShowFilters(!showFilters)} />
              </div>
            )}
          </div>
        </div>

        <div className={`flex gap-6 ${!isMobile ? "flex-row" : "flex-col"}`}>
          {/* Desktop Sidebar Filters */}
          {!isMobile && (
            <div className="w-64 flex-shrink-0">
              <SmartFilters filters={filters} onChange={handleFiltersChange} isOpen={true} onToggle={() => {}} />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {mode === "developers" ? (
              <>
                {/* Trending */}
                {!loadingUsers && trending.length > 0 && (
                  <TrendingSection developers={trending} matchPercents={matchPercents} onViewProfile={setModalUserId} />
                )}

                {/* Card Stack */}
                <div className="relative min-h-[500px] flex items-start justify-center">
                  {loadingUsers ? (
                    <CardSkeleton />
                  ) : currentDev ? (
                    <div className="relative w-full max-w-sm mx-auto">
                      {visibleCards.slice(1, 3).reverse().map((dev, i) => (
                        <div
                          key={dev.uid}
                          className="absolute inset-0 glass-card rounded-2xl"
                          style={{
                            transform: `translate3d(0, ${(2 - i) * 8}px, 0) scale(${1 - (2 - i) * 0.04})`,
                            opacity: 0.5 + i * 0.2,
                            zIndex: i,
                            willChange: "transform",
                          }}
                        />
                      ))}

                      <motion.div
                        key={currentDev.uid}
                        style={{ x, rotate, opacity, willChange: "transform", zIndex: 10 }}
                        animate={controls}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.6}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing relative"
                      >
                        {/* Swipe overlays */}
                        <motion.div className="absolute inset-0 rounded-2xl border-2 border-primary/50 bg-primary/5 z-20 pointer-events-none flex items-center justify-center" style={{ opacity: likeOpacity }}>
                          <span className="text-primary font-display font-bold text-2xl rotate-[-15deg]">LIKE ♥</span>
                        </motion.div>
                        <motion.div className="absolute inset-0 rounded-2xl border-2 border-destructive/50 bg-destructive/5 z-20 pointer-events-none flex items-center justify-center" style={{ opacity: nopeOpacity }}>
                          <span className="text-destructive font-display font-bold text-2xl rotate-[15deg]">NOPE ✕</span>
                        </motion.div>

                        {/* Match badge overlay */}
                        <div className="absolute top-3 right-3 z-30">
                          <MatchBadge
                            percent={matchPercents[currentDev.uid] || 0}
                            onClick={() => setCompatUser({ breakdown: matchData[currentDev.uid], name: currentDev.name })}
                          />
                        </div>

                        <DevCard developer={currentDev} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} onViewProfile={() => setModalUserId(currentDev.uid)} />
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="font-display text-xl font-semibold mb-2">You've seen everyone!</h3>
                      <p className="text-muted-foreground text-sm">Check back later or adjust your filters</p>
                      <button onClick={() => setCurrentIndex(0)} className="mt-4 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium btn-primary-glow">
                        Start Over
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              /* Projects Mode */
              <div className="space-y-4">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-5xl mb-4">📂</div>
                    <h3 className="font-display text-lg font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProjects.map((project) => (
                      <DiscoverProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal isOpen={!!modalUserId} onClose={() => setModalUserId(null)} userId={modalUserId} context="discover" onLike={handleSwipeRight} />
      <CompatibilityModal isOpen={!!compatUser} onClose={() => setCompatUser(null)} breakdown={compatUser?.breakdown || null} userName={compatUser?.name || ""} />
    </Layout>
  );
};

export default Discover;
