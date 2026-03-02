import React from "react";
import { getMatchColor } from "@/utils/matchEngine";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MatchBadgeProps {
  percent: number;
  size?: number;
  onClick?: () => void;
}

const MatchBadge = React.memo(({ percent, size = 56, onClick }: MatchBadgeProps) => {
  const { text, ring } = getMatchColor(percent);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`relative inline-flex items-center justify-center transition-transform hover:scale-110 ${onClick ? "cursor-pointer" : "cursor-default"}`}
          style={{ width: size, height: size }}
          aria-label={`${percent}% match`}
        >
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className="stroke-border"
              strokeWidth={3}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={ring}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <span className={`absolute text-xs font-bold ${text}`}>{percent}%</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        Calculated based on skills, interests, availability, and role compatibility
      </TooltipContent>
    </Tooltip>
  );
});

MatchBadge.displayName = "MatchBadge";
export default MatchBadge;
