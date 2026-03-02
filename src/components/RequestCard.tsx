import { memo } from "react";
import { UserProfile } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { Eye, Check, X, Undo2, GraduationCap, Building2, Clock } from "lucide-react";

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ReceivedCardProps {
  type: "received";
  user: UserProfile;
  matchPercent: number;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date | null;
  projectTitle?: string;
  onAccept: () => void;
  onReject: () => void;
  onViewProfile: () => void;
  isActioning?: boolean;
}

interface SentCardProps {
  type: "sent";
  user: UserProfile;
  matchPercent: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date | null;
  projectTitle?: string;
  onCancel: () => void;
  onViewProfile: () => void;
  isActioning?: boolean;
}

type RequestCardProps = ReceivedCardProps | SentCardProps;

const RequestCard = memo((props: RequestCardProps) => {
  const { user, matchPercent, status, createdAt, projectTitle } = props;
  const initials = user.name?.split(" ").map((n) => n[0]).join("") || "?";

  const matchColor =
    matchPercent >= 80 ? "text-emerald-400" :
    matchPercent >= 60 ? "text-amber-400" :
    "text-muted-foreground";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group rounded-2xl border border-border/60 bg-card p-4 sm:p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_2px_20px_hsl(var(--primary)/0.06)]"
      style={{ willChange: "transform, opacity" }}
    >
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <button
          onClick={props.onViewProfile}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 hover:border-primary/40 transition-colors"
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-xl object-cover" loading="lazy" />
          ) : (
            <span className="font-display font-bold text-primary text-sm sm:text-base">{initials}</span>
          )}
          {/* Match indicator dot */}
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center bg-card border border-border ${matchColor}`}>
            {matchPercent}
          </span>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="font-display font-semibold text-sm leading-tight">{user.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Building2 className="w-3 h-3" />{user.department}</span>
                <span className="flex items-center gap-0.5"><GraduationCap className="w-3 h-3" />Sem {user.semester}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mt-2">
            {user.skills?.slice(0, 3).map((s) => (
              <span key={s} className="skill-tag text-[10px] py-0.5 px-2">{s}</span>
            ))}
            {(user.skills?.length || 0) > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">+{(user.skills?.length || 0) - 3}</span>
            )}
          </div>

          {/* Message (only on received) */}
          {props.type === "received" && props.message && (
            <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg px-3 py-2 border-l-2 border-primary/30 italic">
              "{props.message}"
            </p>
          )}

          {/* Project context */}
          {projectTitle && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              for <span className="text-foreground font-medium">{projectTitle}</span>
            </p>
          )}

          {/* Footer: time + actions */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
            {createdAt && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo(createdAt)}
              </span>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={props.onViewProfile}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Eye className="w-3 h-3" />
                Profile
              </button>

              {props.type === "received" && status === "pending" && (
                <>
                  <button
                    onClick={props.onReject}
                    disabled={props.isActioning}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                  <button
                    onClick={props.onAccept}
                    disabled={props.isActioning}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
                  >
                    <Check className="w-3 h-3" />
                    Accept
                  </button>
                </>
              )}

              {props.type === "sent" && status === "pending" && (
                <button
                  onClick={props.onCancel}
                  disabled={props.isActioning}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  <Undo2 className="w-3 h-3" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

RequestCard.displayName = "RequestCard";
export default RequestCard;
