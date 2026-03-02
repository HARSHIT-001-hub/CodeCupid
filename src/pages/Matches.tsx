import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { getMatches, handleApplication } from "@/services/firestore";
import {
  doc, getDoc, collection, query, where, getDocs, onSnapshot,
  deleteDoc, orderBy, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from "@/components/Layout";
import ProfileModal from "@/components/ProfileModal";
import RequestCard from "@/components/RequestCard";
import { motion, AnimatePresence } from "framer-motion";
import { Github, MessageCircle, GraduationCap, Building2, Inbox, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { calculateMatch, getMatchPercent } from "@/utils/matchEngine";

// ─── Types ──────────────────────────────────────
interface RequestItem {
  id: string;           // application doc id
  projectId: string;
  projectTitle: string;
  user: UserProfile;    // the other party
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date | null;
  matchPercent: number;
}

// ─── Tab Button ─────────────────────────────────
const TabButton = ({
  active, label, count, icon: Icon, onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: typeof Inbox;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`
      relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
      ${active
        ? "bg-primary/10 text-primary border border-primary/25 shadow-[0_0_12px_hsl(var(--primary)/0.08)]"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
      }
    `}
  >
    <Icon className="w-4 h-4" />
    {label}
    {count > 0 && (
      <span className={`
        ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold leading-none
        ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
      `}>
        {count}
      </span>
    )}
    {active && (
      <motion.div
        layoutId="tab-underline"
        className="absolute -bottom-px left-3 right-3 h-[2px] rounded-full bg-primary"
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    )}
  </button>
);

// ─── Empty State ────────────────────────────────
const EmptyState = ({ emoji, title, sub }: { emoji: string; title: string; sub: string }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
    <div className="text-5xl mb-3">{emoji}</div>
    <h3 className="font-display text-base font-semibold mb-1">{title}</h3>
    <p className="text-muted-foreground text-sm max-w-xs mx-auto">{sub}</p>
  </motion.div>
);

// ─── Main Component ─────────────────────────────
const Matches = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [matchedDevs, setMatchedDevs] = useState<(UserProfile & { chatId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Received & sent requests
  const [receivedRequests, setReceivedRequests] = useState<RequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestItem[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);

  // ── Load matches ────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const unsub = getMatches(profile.uid, async (matches) => {
      const devs = await Promise.all(
        matches.map(async (m) => {
          const snap = await getDoc(doc(db, "users", m.partnerUid));
          return { uid: m.partnerUid, chatId: m.matchId, ...(snap.data() || {}) } as UserProfile & { chatId: string };
        })
      );
      setMatchedDevs(devs);
      setLoading(false);
    });
    return unsub;
  }, [profile]);

  // ── Load received requests ──────────────────
  useEffect(() => {
    if (!profile) return;
    setLoadingReceived(true);

    const loadReceived = async () => {
      const projQuery = query(collection(db, "projects"), where("ownerId", "==", profile.uid));
      const projSnap = await getDocs(projQuery);
      const items: RequestItem[] = [];

      for (const projDoc of projSnap.docs) {
        const projData = projDoc.data();
        const appsSnap = await getDocs(
          query(collection(db, "projects", projDoc.id, "applications"), orderBy("createdAt", "desc"))
        );
        for (const appDoc of appsSnap.docs) {
          const appData = appDoc.data();
          const userSnap = await getDoc(doc(db, "users", appData.applicantId));
          if (!userSnap.exists()) continue;
          const userData = { uid: userSnap.id, ...userSnap.data() } as UserProfile;
          const matchPercent = getMatchPercent(calculateMatch(profile, userData));

          items.push({
            id: appDoc.id,
            projectId: projDoc.id,
            projectTitle: projData.title,
            user: userData,
            message: appData.message || "",
            status: appData.status || "pending",
            createdAt: appData.createdAt instanceof Timestamp ? appData.createdAt.toDate() : null,
            matchPercent,
          });
        }
      }

      // Deduplicate
      const seen = new Set<string>();
      setReceivedRequests(items.filter((r) => {
        const key = `${r.user.uid}_${r.projectId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
      setLoadingReceived(false);
    };
    loadReceived();
  }, [profile]);

  // ── Load sent requests ──────────────────────
  useEffect(() => {
    if (!profile) return;
    setLoadingSent(true);

    const loadSent = async () => {
      const projSnap = await getDocs(collection(db, "projects"));
      const items: RequestItem[] = [];

      for (const projDoc of projSnap.docs) {
        const projData = projDoc.data();
        const appsQuery = query(
          collection(db, "projects", projDoc.id, "applications"),
          where("applicantId", "==", profile.uid)
        );
        const appsSnap = await getDocs(appsQuery);
        for (const appDoc of appsSnap.docs) {
          const appData = appDoc.data();
          // Fetch project owner as the "other user"
          const ownerSnap = await getDoc(doc(db, "users", projData.ownerId));
          const ownerData = ownerSnap.exists()
            ? ({ uid: ownerSnap.id, ...ownerSnap.data() } as UserProfile)
            : ({ uid: projData.ownerId, name: projData.ownerName, email: "", semester: 0, department: "", skills: [], interests: [], bio: "", githubLink: "", photoURL: "" } as UserProfile);

          const matchPercent = getMatchPercent(calculateMatch(profile, ownerData));
          items.push({
            id: appDoc.id,
            projectId: projDoc.id,
            projectTitle: projData.title,
            user: ownerData,
            message: appData.message || "",
            status: appData.status || "pending",
            createdAt: appData.createdAt instanceof Timestamp ? appData.createdAt.toDate() : null,
            matchPercent,
          });
        }
      }
      setSentRequests(items);
      setLoadingSent(false);
    };
    loadSent();
  }, [profile]);

  // ── Actions ─────────────────────────────────
  const handleAccept = useCallback(async (req: RequestItem) => {
    setActioningId(req.id);
    try {
      await handleApplication(req.projectId, req.id, req.user.uid, "accepted");
      setReceivedRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "accepted" as const } : r));
      toast.success(`Accepted ${req.user.name}!`);
    } catch (e) {
      toast.error("Failed to accept request");
    }
    setActioningId(null);
  }, []);

  const handleReject = useCallback(async (req: RequestItem) => {
    setActioningId(req.id);
    try {
      await handleApplication(req.projectId, req.id, req.user.uid, "rejected");
      setReceivedRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "rejected" as const } : r));
      toast("Request rejected");
    } catch (e) {
      toast.error("Failed to reject request");
    }
    setActioningId(null);
  }, []);

  const handleCancel = useCallback(async (req: RequestItem) => {
    setActioningId(req.id);
    try {
      await deleteDoc(doc(db, "projects", req.projectId, "applications", req.id));
      setSentRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast("Request cancelled");
    } catch (e) {
      toast.error("Failed to cancel request");
    }
    setActioningId(null);
  }, []);

  const handleMessage = useCallback((userId: string) => {
    const dev = matchedDevs.find((d) => d.uid === userId);
    if (dev) navigate(`/chat/${dev.chatId}`);
  }, [matchedDevs, navigate]);

  // Counts
  const pendingReceivedCount = receivedRequests.filter((r) => r.status === "pending").length;
  const pendingSentCount = sentRequests.filter((r) => r.status === "pending").length;

  // ── Match Card (inline) ─────────────────────
  const renderMatchCard = (dev: UserProfile & { chatId: string }, i: number) => {
    const initials = dev.name?.split(" ").map((n) => n[0]).join("") || "?";
    return (
      <motion.div
        key={dev.uid}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06 }}
        className="rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_2px_20px_hsl(var(--primary)/0.06)]"
      >
        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => setModalUserId(dev.uid)}
          >
            <span className="font-display font-bold text-primary text-sm">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3
                className="font-display font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                onClick={() => setModalUserId(dev.uid)}
              >
                {dev.name}
              </h3>
              <div className="flex gap-1.5">
                {dev.githubLink && (
                  <a href={dev.githubLink} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-primary transition-colors">
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={() => navigate(`/chat/${dev.chatId}`)}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mb-2">
              <span className="flex items-center gap-0.5"><GraduationCap className="w-3 h-3" />Sem {dev.semester}</span>
              <span className="flex items-center gap-0.5"><Building2 className="w-3 h-3" />{dev.department}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {dev.skills?.slice(0, 4).map((s) => <span key={s} className="skill-tag text-[10px] py-0.5 px-2">{s}</span>)}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold">My Matches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your connections and collaboration requests
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1.5 mb-6 pb-3 border-b border-border/50 overflow-x-auto">
          <TabButton active={activeTab === "received"} label="Received" count={pendingReceivedCount} icon={Inbox} onClick={() => setActiveTab("received")} />
          <TabButton active={activeTab === "sent"} label="Sent" count={pendingSentCount} icon={Send} onClick={() => setActiveTab("sent")} />
        </div>

        {/* ── Confirmed Matches (always visible) ── */}
        {matchedDevs.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Confirmed Matches · {matchedDevs.length}
            </h2>
            <div className="space-y-2.5">
              {matchedDevs.map((dev, i) => renderMatchCard(dev, i))}
            </div>
          </div>
        )}

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "received" && (
            <motion.div
              key="received"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Received Requests
              </h2>

              {loadingReceived ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-border/40 bg-card p-5 animate-pulse">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-8 bg-muted rounded w-full mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : receivedRequests.length === 0 ? (
                <EmptyState emoji="📬" title="No one has sent you a request yet." sub="Post a project on the Projects page to start receiving collaboration requests." />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {receivedRequests.map((req) => (
                      <RequestCard
                        key={req.id}
                        type="received"
                        user={req.user}
                        matchPercent={req.matchPercent}
                        message={req.message}
                        status={req.status}
                        createdAt={req.createdAt}
                        projectTitle={req.projectTitle}
                        onAccept={() => handleAccept(req)}
                        onReject={() => handleReject(req)}
                        onViewProfile={() => setModalUserId(req.user.uid)}
                        isActioning={actioningId === req.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Sent Requests
              </h2>

              {loadingSent ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-border/40 bg-card p-5 animate-pulse">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sentRequests.length === 0 ? (
                <EmptyState emoji="📤" title="You haven't sent any requests yet." sub="Browse open projects and apply to collaborate with other developers." />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {sentRequests.map((req) => (
                      <RequestCard
                        key={req.id}
                        type="sent"
                        user={req.user}
                        matchPercent={req.matchPercent}
                        status={req.status}
                        createdAt={req.createdAt}
                        projectTitle={req.projectTitle}
                        onCancel={() => handleCancel(req)}
                        onViewProfile={() => setModalUserId(req.user.uid)}
                        isActioning={actioningId === req.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProfileModal
        isOpen={!!modalUserId}
        onClose={() => setModalUserId(null)}
        userId={modalUserId}
        context="matches"
        onMessage={handleMessage}
      />
    </Layout>
  );
};

export default Matches;
