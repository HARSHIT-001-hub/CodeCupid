import React from "react";
import { Project } from "@/services/firestore";
import { Users, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DiscoverProjectCardProps {
  project: Project;
}

const DiscoverProjectCard = React.memo(({ project }: DiscoverProjectCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="glass-card-hover rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold truncate">{project.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">by {project.ownerName}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ml-2 ${
          project.status === "open"
            ? "bg-primary/10 text-primary border border-primary/20"
            : "bg-muted text-muted-foreground border border-border"
        }`}>
          {project.status}
        </span>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {project.requiredSkills?.map((s) => (
          <span key={s} className="skill-tag text-[11px]">{s}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          {project.teamMembers?.length || 1}/{project.maxTeamSize}
        </div>
        <button
          onClick={() => navigate(`/projects/${project.id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> View Project
        </button>
      </div>
    </div>
  );
});

DiscoverProjectCard.displayName = "DiscoverProjectCard";
export default DiscoverProjectCard;
