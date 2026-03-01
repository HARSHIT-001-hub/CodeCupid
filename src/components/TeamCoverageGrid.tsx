import { motion } from "framer-motion";
import { TeamCoverage } from "@/utils/scoring";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface TeamCoverageGridProps {
  coverage: TeamCoverage[];
  coverageScore: number;
  strengthIndex: number;
}

const statusConfig = {
  covered: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Covered" },
  partial: { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Partial" },
  missing: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Missing" },
};

const TeamCoverageGrid = ({ coverage, coverageScore, strengthIndex }: TeamCoverageGridProps) => {
  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-semibold font-display">Team Completeness</h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {coverage.map((item, i) => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg p-3 border ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                <span className="text-xs font-medium">{item.category}</span>
              </div>
              <p className={`text-[10px] ${cfg.color}`}>{cfg.label}</p>
              {item.members.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1 truncate">
                  {item.members.join(", ")}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2 border-t border-border">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coverage</p>
          <p className="text-lg font-display font-bold text-primary">
            {Math.round(coverageScore * 100)}%
          </p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Team Strength</p>
          <p className="text-lg font-display font-bold text-accent">
            {Math.round(strengthIndex * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamCoverageGrid;
