import React, { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Github, GraduationCap, Building2, Heart, Zap,
  MessageCircle, FolderOpen,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  /** Controls which action buttons appear */
  context?: "discover" | "matches";
  /** Callbacks for action buttons */
  onLike?: () => void;
  onMessage?: (userId: string) => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

const ProfileModal = React.memo(
  ({ isOpen, onClose, userId, context = "discover", onLike, onMessage }: ProfileModalProps) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user data in real-time
    useEffect(() => {
      if (!isOpen || !userId) {
        setProfile(null);
        setLoading(true);
        return;
      }

      setLoading(true);
      const unsub = onSnapshot(doc(db, "users", userId), (snap) => {
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
        setLoading(false);
      });

      return () => unsub();
    }, [isOpen, userId]);

    // Lock body scroll
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

    // ESC to close
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    const handleOverlayClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      },
      [onClose]
    );

    const initials =
      profile?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "?";

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            style={{ backgroundColor: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {loading ? (
                <div className="p-8 space-y-4 animate-pulse">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-muted" />
                  </div>
                  <div className="h-5 bg-muted rounded-lg w-3/4 mx-auto" />
                  <div className="h-3 bg-muted rounded-lg w-1/2 mx-auto" />
                  <div className="h-16 bg-muted rounded-lg w-full" />
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 w-16 bg-muted rounded-full" />
                    ))}
                  </div>
                </div>
              ) : profile ? (
                <div className="p-6">
                  {/* Header gradient accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-24 rounded-t-2xl opacity-30"
                    style={{ background: "var(--gradient-primary)" }}
                  />

                  {/* Avatar */}
                  <div className="relative flex justify-center mb-4 pt-4">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.name}
                        className="w-24 h-24 rounded-full object-cover border-3 border-primary/40 shadow-lg"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center shadow-lg">
                        <span className="font-display text-2xl font-bold text-primary">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name & meta */}
                  <div className="text-center mb-5">
                    <h2 className="font-display text-xl font-bold">{profile.name}</h2>
                    <div className="flex items-center justify-center gap-3 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Sem {profile.semester}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {profile.department}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground text-center mb-5 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {profile.skills?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((s) => (
                          <span
                            key={s}
                            className="skill-tag transition-all duration-200 hover:scale-105 cursor-default"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {profile.interests?.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                        Interests
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.interests.map((i) => (
                          <span
                            key={i}
                            className="interest-tag transition-all duration-200 hover:scale-105 cursor-default"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GitHub */}
                  {profile.githubLink && (
                    <a
                      href={profile.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5"
                    >
                      <Github className="w-4 h-4" /> GitHub Profile
                    </a>
                  )}

                  {/* Context-specific actions */}
                  <div className="flex items-center justify-center gap-3 pt-2 border-t border-border">
                    {context === "discover" && (
                      <>
                        <button
                          onClick={() => {
                            onLike?.();
                            onClose();
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                          <Heart className="w-4 h-4" /> Like
                        </button>
                        <button
                          onClick={() => {
                            onLike?.();
                            onClose();
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
                        >
                          <Zap className="w-4 h-4" /> Super Like
                        </button>
                      </>
                    )}
                    {context === "matches" && (
                      <>
                        <button
                          onClick={() => {
                            if (userId) onMessage?.(userId);
                            onClose();
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                          <MessageCircle className="w-4 h-4" /> Message
                        </button>
                        <button
                          onClick={onClose}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                        >
                          <FolderOpen className="w-4 h-4" /> Projects
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>User not found.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ProfileModal.displayName = "ProfileModal";

export default ProfileModal;
