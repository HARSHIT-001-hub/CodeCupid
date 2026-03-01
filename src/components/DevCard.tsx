import React from "react";
import { UserProfile } from "@/context/AuthContext";
import { Github, GraduationCap, Building2 } from "lucide-react";

interface DevCardProps {
  developer: UserProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onViewProfile?: () => void;
}

const DevCard = React.memo(({ developer, onSwipeLeft, onSwipeRight, onViewProfile }: DevCardProps) => {
  const initials = developer.name?.split(" ").map(n => n[0]).join("") || "?";

  return (
    <div
      className="glass-card rounded-2xl p-6 w-full max-w-sm mx-auto"
      style={{ willChange: "transform", transform: "translate3d(0,0,0)" }}
    >
      {/* Avatar — clickable to open profile */}
      <div className="flex justify-center mb-5 cursor-pointer" onClick={onViewProfile}>
        {developer.photoURL ? (
          <img
            src={developer.photoURL}
            alt={developer.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-primary/30 hover:border-primary/60 transition-colors"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/15 border-2 border-primary/30 hover:border-primary/60 transition-colors flex items-center justify-center">
            <span className="font-display text-2xl font-bold text-primary">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-bold">{developer.name}</h3>
        <div className="flex items-center justify-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Sem {developer.semester}</span>
          <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {developer.department}</span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-muted-foreground text-center mb-4 leading-relaxed">{developer.bio}</p>

      {/* Skills */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Skills</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {developer.skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
        </div>
      </div>

      {/* Interests */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Interests</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {developer.interests?.map(i => <span key={i} className="interest-tag">{i}</span>)}
        </div>
      </div>

      {/* GitHub */}
      {developer.githubLink && (
        <a href={developer.githubLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <Github className="w-4 h-4" /> GitHub Profile
        </a>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button onClick={onSwipeLeft}
          className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors text-xl">
          ✕
        </button>
        <button onClick={onSwipeRight}
          className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors text-xl btn-primary-glow">
          ♥
        </button>
      </div>
    </div>
  );
});

DevCard.displayName = "DevCard";

export default DevCard;
