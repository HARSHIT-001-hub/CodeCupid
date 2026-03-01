import { motion } from "framer-motion";
import { getRiskLevel } from "@/utils/scoring";
import { AlertTriangle, Shield, ShieldAlert } from "lucide-react";

interface RiskScoreDisplayProps {
  riskScore: number;
  marketSaturation: number;
  techFeasibility: number;
  executionPotential: number;
}

const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{Math.round(value * 100)}%</span>
    </div>
    <div className="h-2 rounded-full bg-secondary overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  </div>
);

const RiskScoreDisplay = ({
  riskScore,
  marketSaturation,
  techFeasibility,
  executionPotential,
}: RiskScoreDisplayProps) => {
  const risk = getRiskLevel(riskScore);
  const Icon = riskScore < 0.35 ? Shield : riskScore < 0.65 ? AlertTriangle : ShieldAlert;

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold font-display">Problem Validation</h4>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${risk.bg} ${risk.color}`}>
          <Icon className="w-3 h-3" />
          {risk.label}
        </span>
      </div>

      <div className="space-y-2.5">
        <ScoreBar label="Market Saturation" value={marketSaturation} color="bg-yellow-500" />
        <ScoreBar label="Tech Feasibility" value={techFeasibility} color="bg-emerald-500" />
        <ScoreBar label="Execution Potential" value={executionPotential} color="bg-blue-500" />
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Overall Risk</span>
          <span className={`text-lg font-display font-bold ${risk.color}`}>
            {Math.round(riskScore * 100)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden mt-1">
          <motion.div
            className={`h-full rounded-full ${
              riskScore < 0.35 ? "bg-emerald-500" : riskScore < 0.65 ? "bg-yellow-500" : "bg-red-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${riskScore * 100}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

export default RiskScoreDisplay;
