import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/context/AuthContext";
import { getUsers } from "@/services/firestore";
import {
  PROJECT_TYPE_ROLES, suggestTeamMembers, CandidateSuggestion,
} from "@/utils/scoring";
import { SKILLS } from "@/data/constants";
import { Sparkles, Users, Send, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface SmartTeamBuilderProps {
  projectId: string;
  existingMembers: string[];
  onInvite: (uid: string) => void;
}

const projectTypes = Object.keys(PROJECT_TYPE_ROLES);

const SmartTeamBuilder = ({ projectId, existingMembers, onInvite }: SmartTeamBuilderProps) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [projectType, setProjectType] = useState("Web App");
  const [preferredStack, setPreferredStack] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, CandidateSuggestion[]>>({});
  const [loading, setLoading] = useState(false);
  const [invitedUids, setInvitedUids] = useState<Set<string>>(new Set());

  const handleBuild = async () => {
    setLoading(true);
    try {
      const allUsers = await getUsers();
      const result = suggestTeamMembers(
        projectType,
        preferredStack,
        allUsers,
        existingMembers
      );
      setSuggestions(result);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const handleInvite = (uid: string) => {
    onInvite(uid);
    setInvitedUids((prev) => new Set([...prev, uid]));
    toast.success("Invite sent!");
  };

  const toggleSkill = (skill: string) => {
    setPreferredStack((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20"
      >
        <Sparkles className="w-4 h-4" />
        Auto Build My Dream Team
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Smart Team Builder
                </h4>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Project Type */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Project Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {projectTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setProjectType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        projectType === type
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-secondary text-muted-foreground border border-border hover:border-accent/30"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Stack */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Preferred Tech Stack</label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.slice(0, 12).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        preferredStack.includes(skill)
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleBuild}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {loading ? "Analyzing..." : "Find Dream Team"}
              </button>

              {/* Results */}
              {Object.keys(suggestions).length > 0 && (
                <div className="space-y-3 pt-2">
                  {Object.entries(suggestions).map(([role, candidates]) => (
                    <div key={role}>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {role}
                      </p>
                      {candidates.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground/50 pl-4">No matches found</p>
                      ) : (
                        <div className="space-y-1">
                          {candidates.map((c) => {
                            const invited = invitedUids.has(c.user.uid);
                            return (
                              <div
                                key={c.user.uid}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-primary">
                                      {c.user.name?.charAt(0) || "?"}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{c.user.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {Math.round(c.matchScore * 100)}% match · {c.user.department}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleInvite(c.user.uid)}
                                  disabled={invited}
                                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    invited
                                      ? "bg-primary/10 text-primary cursor-default"
                                      : "bg-primary text-primary-foreground hover:brightness-110"
                                  }`}
                                >
                                  {invited ? "Invited ✓" : "Invite"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartTeamBuilder;
