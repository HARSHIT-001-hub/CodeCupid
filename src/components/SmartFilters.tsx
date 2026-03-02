import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, RotateCcw } from "lucide-react";
import { DEPARTMENTS, SKILLS } from "@/data/constants";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";

export interface FilterState {
  skills: string[];
  department: string;
  semester: string;
  minMatch: number;
}

interface SmartFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SmartFilters = React.memo(({ filters, onChange, isOpen, onToggle }: SmartFiltersProps) => {
  const isMobile = useIsMobile();

  const toggleSkill = useCallback((skill: string) => {
    const next = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    onChange({ ...filters, skills: next });
  }, [filters, onChange]);

  const reset = useCallback(() => {
    onChange({ skills: [], department: "", semester: "", minMatch: 0 });
  }, [onChange]);

  const hasFilters = filters.skills.length > 0 || filters.department || filters.semester || filters.minMatch > 0;

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold font-display">Filters</span>
        <div className="flex gap-2">
          {hasFilters && (
            <button onClick={reset} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          {isMobile && (
            <button onClick={onToggle} className="p-1 text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Department */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-1.5 block uppercase tracking-wider">Department</label>
        <select
          value={filters.department}
          onChange={(e) => onChange({ ...filters, department: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">All</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Semester */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-1.5 block uppercase tracking-wider">Semester</label>
        <select
          value={filters.semester}
          onChange={(e) => onChange({ ...filters, semester: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">All</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
        </select>
      </div>

      {/* Min Match */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-1.5 block uppercase tracking-wider">
          Min Match: {filters.minMatch}%
        </label>
        <Slider
          value={[filters.minMatch]}
          onValueChange={([v]) => onChange({ ...filters, minMatch: v })}
          max={100}
          step={5}
        />
      </div>

      {/* Skills Multi-select */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-1.5 block uppercase tracking-wider">Skills</label>
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                filters.skills.includes(skill)
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground border border-border hover:border-primary/20"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter tags */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
          {filters.department && (
            <span className="skill-tag flex items-center gap-1 text-[11px]">
              {filters.department}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onChange({ ...filters, department: "" })} />
            </span>
          )}
          {filters.semester && (
            <span className="skill-tag flex items-center gap-1 text-[11px]">
              Sem {filters.semester}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onChange({ ...filters, semester: "" })} />
            </span>
          )}
          {filters.skills.map((s) => (
            <span key={s} className="skill-tag flex items-center gap-1 text-[11px]">
              {s}
              <X className="w-3 h-3 cursor-pointer" onClick={() => toggleSkill(s)} />
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // Mobile: slide-up drawer
  if (isMobile) {
    return (
      <>
        <button
          onClick={onToggle}
          className={`p-2.5 rounded-xl transition-colors ${isOpen ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          <Filter className="w-5 h-5" />
          {hasFilters && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />}
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onToggle}
              />
              <motion.div
                className="fixed inset-x-0 bottom-0 z-50 glass-card rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                {content}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: sticky sidebar panel
  return (
    <div className="glass-card rounded-xl p-4 sticky top-24">
      {content}
    </div>
  );
});

SmartFilters.displayName = "SmartFilters";
export default SmartFilters;
