import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { MatchBreakdown, getMatchPercent, getMatchColor } from "@/utils/matchEngine";

interface CompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: MatchBreakdown | null;
  userName: string;
}

const Bar = ({ label, value }: { label: string; value: number }) => {
  const pct = Math.round(value * 100);
  const { text } = getMatchColor(pct);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${text}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

const CompatibilityModal = React.memo(({ isOpen, onClose, breakdown, userName }: CompatibilityModalProps) => {
  if (!breakdown) return null;

  const percent = getMatchPercent(breakdown);
  const { text } = getMatchColor(percent);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative glass-card rounded-2xl p-6 w-full max-w-sm space-y-5 z-10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Match with {userName}</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center">
              <span className={`font-display text-4xl font-bold ${text}`}>{percent}%</span>
              <p className="text-xs text-muted-foreground mt-1">Overall Compatibility</p>
            </div>

            <div className="space-y-4">
              <Bar label="Skill Complement" value={breakdown.skillComplement} />
              <Bar label="Interest Overlap" value={breakdown.interestOverlap} />
              <Bar label="Availability Match" value={breakdown.availabilityMatch} />
              <Bar label="Role Balance" value={breakdown.roleFit} />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground text-center">
                Weighted: Skills 40% · Interests 20% · Availability 20% · Role 20%
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CompatibilityModal.displayName = "CompatibilityModal";
export default CompatibilityModal;
