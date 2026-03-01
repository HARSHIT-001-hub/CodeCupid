import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/context/AuthContext";
import { getUsers, likeUser, getLikedUserIds } from "@/services/firestore";
import DevCard from "@/components/DevCard";
import ProfileModal from "@/components/ProfileModal";
import Layout from "@/components/Layout";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { Filter, X } from "lucide-react";
import { DEPARTMENTS, SKILLS } from "@/data/constants";
import { toast } from "sonner";

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY = 500;

// Skeleton loader for cards
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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false);
  const [modalUserId, setModalUserId] = useState<string | null>(null);

  // Framer Motion drag values — GPU-accelerated
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1]);
  const controls = useAnimation();

  // Load users once
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      setLoadingUsers(true);
      const [allUsers, liked] = await Promise.all([
        getUsers(),
        getLikedUserIds(profile.uid),
      ]);
      if (cancelled) return;
      const available = allUsers.filter(
        (u) => u.uid !== profile.uid && !liked.includes(u.uid)
      );
      setUsers(available);
      setLoadingUsers(false);
    };
    load();
    return () => { cancelled = true; };
  }, [profile]);

  const filtered = useMemo(() => {
    return users.filter((d) => {
      if (filterDept && d.department !== filterDept) return false;
      if (filterSemester && d.semester !== Number(filterSemester)) return false;
      if (filterSkill && !d.skills?.includes(filterSkill)) return false;
      return true;
    });
  }, [users, filterDept, filterSemester, filterSkill]);

  // Only render top 3 cards for DOM efficiency
  const visibleCards = useMemo(() => {
    return filtered.slice(currentIndex, currentIndex + 3);
  }, [filtered, currentIndex]);

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

    // Animate card off-screen using GPU transform
    await controls.start({
      x: 300,
      opacity: 0,
      rotate: 15,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    });

    // Fire-and-forget Firestore write (don't block UI)
    likeUser(profile.uid, dev.uid).then((isMatch) => {
      if (isMatch) toast.success(`🎉 It's a match with ${dev.name}!`);
    }).catch(console.error);

    advanceCard();
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [isSwiping, filtered, currentIndex, profile, controls, advanceCard]);

  const handleSwipeLeft = useCallback(async () => {
    if (isSwiping) return;
    setIsSwiping(true);

    await controls.start({
      x: -300,
      opacity: 0,
      rotate: -15,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    });

    advanceCard();
    controls.set({ x: 0, opacity: 1, rotate: 0 });
  }, [isSwiping, controls, advanceCard]);

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
      handleSwipeRight();
    } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
      handleSwipeLeft();
    } else {
      // Snap back smoothly
      controls.start({ x: 0, rotate: 0, opacity: 1, transition: { type: "spring", damping: 20 } });
    }
  }, [handleSwipeRight, handleSwipeLeft, controls]);

  const handleFilterReset = useCallback(() => {
    setFilterDept("");
    setFilterSemester("");
    setFilterSkill("");
    setCurrentIndex(0);
  }, []);

  const currentDev = filtered[currentIndex];

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Discover</h1>
            <p className="text-sm text-muted-foreground">Find your next teammate</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl transition-colors ${showFilters ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <div className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filters</span>
                  <button onClick={handleFilterReset} className="text-xs text-primary hover:underline">Clear all</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setCurrentIndex(0); }}
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option value="">All Depts</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={filterSemester} onChange={e => { setFilterSemester(e.target.value); setCurrentIndex(0); }}
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option value="">All Sems</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                  <select value={filterSkill} onChange={e => { setFilterSkill(e.target.value); setCurrentIndex(0); }}
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option value="">All Skills</option>
                    {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {(filterDept || filterSemester || filterSkill) && (
                  <div className="flex flex-wrap gap-1.5">
                    {filterDept && <span className="skill-tag flex items-center gap-1">{filterDept} <X className="w-3 h-3 cursor-pointer" onClick={() => { setFilterDept(""); setCurrentIndex(0); }} /></span>}
                    {filterSemester && <span className="skill-tag flex items-center gap-1">Sem {filterSemester} <X className="w-3 h-3 cursor-pointer" onClick={() => { setFilterSemester(""); setCurrentIndex(0); }} /></span>}
                    {filterSkill && <span className="skill-tag flex items-center gap-1">{filterSkill} <X className="w-3 h-3 cursor-pointer" onClick={() => { setFilterSkill(""); setCurrentIndex(0); }} /></span>}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Stack */}
        <div className="relative min-h-[500px] flex items-start justify-center">
          {loadingUsers ? (
            <CardSkeleton />
          ) : currentDev ? (
            <div className="relative w-full max-w-sm mx-auto">
              {/* Background cards (static, no animation overhead) */}
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

              {/* Top card — draggable with GPU acceleration */}
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
                {/* Swipe indicator overlays */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-primary/50 bg-primary/5 z-20 pointer-events-none flex items-center justify-center"
                  style={{ opacity: likeOpacity }}
                >
                  <span className="text-primary font-display font-bold text-2xl rotate-[-15deg]">LIKE ♥</span>
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-destructive/50 bg-destructive/5 z-20 pointer-events-none flex items-center justify-center"
                  style={{ opacity: nopeOpacity }}
                >
                  <span className="text-destructive font-display font-bold text-2xl rotate-[15deg]">NOPE ✕</span>
                </motion.div>

                <DevCard developer={currentDev} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} onViewProfile={() => setModalUserId(currentDev.uid)} />
              </motion.div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-display text-xl font-semibold mb-2">You've seen everyone!</h3>
              <p className="text-muted-foreground text-sm">Check back later or adjust your filters</p>
              <button onClick={() => setCurrentIndex(0)}
                className="mt-4 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium btn-primary-glow">
                Start Over
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <ProfileModal
        isOpen={!!modalUserId}
        onClose={() => setModalUserId(null)}
        userId={modalUserId}
        context="discover"
        onLike={handleSwipeRight}
      />
    </Layout>
  );
};

export default Discover;
