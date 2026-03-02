import React from "react";
import { UserProfile } from "@/context/AuthContext";
import { Flame } from "lucide-react";
import MatchBadge from "./MatchBadge";

interface TrendingSectionProps {
  developers: UserProfile[];
  matchPercents: Record<string, number>;
  onViewProfile: (uid: string) => void;
}

const TrendingSection = React.memo(({ developers, matchPercents, onViewProfile }: TrendingSectionProps) => {
  if (developers.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-400" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Trending This Week</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {developers.map((dev) => {
          const initials = dev.name?.split(" ").map((n) => n[0]).join("") || "?";
          return (
            <button
              key={dev.uid}
              onClick={() => onViewProfile(dev.uid)}
              className="flex-shrink-0 glass-card rounded-xl p-3 w-32 text-center hover:border-primary/30 transition-all group"
            >
              <div className="relative mx-auto w-12 h-12 mb-2">
                {dev.photoURL ? (
                  <img src={dev.photoURL} alt={dev.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="font-display text-sm font-bold text-primary">{initials}</span>
                  </div>
                )}
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <Flame className="w-3 h-3 text-orange-400" />
                </span>
              </div>
              <p className="text-xs font-medium truncate">{dev.name}</p>
              <div className="flex justify-center mt-1.5">
                <MatchBadge percent={matchPercents[dev.uid] || 0} size={36} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

TrendingSection.displayName = "TrendingSection";
export default TrendingSection;
