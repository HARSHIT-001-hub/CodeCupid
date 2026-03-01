import { useState, useEffect, useCallback } from "react";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { getMatches, getUserChats } from "@/services/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Layout from "@/components/Layout";
import ProfileModal from "@/components/ProfileModal";
import { motion } from "framer-motion";
import { Github, MessageCircle, GraduationCap, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Matches = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [matchedDevs, setMatchedDevs] = useState<(UserProfile & { chatId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalUserId, setModalUserId] = useState<string | null>(null);

  const handleMessage = useCallback((userId: string) => {
    const dev = matchedDevs.find((d) => d.uid === userId);
    if (dev) navigate(`/chat/${dev.chatId}`);
  }, [matchedDevs, navigate]);

  useEffect(() => {
    if (!profile) return;
    const unsub = getMatches(profile.uid, async (matches) => {
      // Fetch partner profiles
      const devs = await Promise.all(
        matches.map(async (m) => {
          const snap = await getDoc(doc(db, "users", m.partnerUid));
          return {
            uid: m.partnerUid,
            chatId: m.matchId,
            ...(snap.data() || {}),
          } as UserProfile & { chatId: string };
        })
      );
      setMatchedDevs(devs);
      setLoading(false);
    });
    return unsub;
  }, [profile]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">My Matches</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${matchedDevs.length} teammate${matchedDevs.length !== 1 ? "s" : ""} connected`}
          </p>
        </div>

        {!loading && matchedDevs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💫</div>
            <h3 className="font-display text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground text-sm">Start swiping to find teammates!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchedDevs.map((dev, i) => {
              const initials = dev.name?.split(" ").map(n => n[0]).join("") || "?";
              return (
                <motion.div
                  key={dev.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card-hover rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 cursor-pointer hover:border-primary/60 transition-colors"
                      onClick={() => setModalUserId(dev.uid)}
                    >
                      <span className="font-display font-bold text-primary">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-display font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => setModalUserId(dev.uid)}>{dev.name}</h3>
                        <div className="flex gap-2">
                          {dev.githubLink && (
                            <a href={dev.githubLink} target="_blank" rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-primary transition-colors">
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => navigate(`/chat/${dev.chatId}`)}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Sem {dev.semester}</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {dev.department}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dev.skills?.slice(0, 4).map(s => <span key={s} className="skill-tag text-[10px]">{s}</span>)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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
