import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Milestone, addMilestone, updateMilestone, deleteMilestone,
  subscribeMilestones, getMilestoneProgress,
} from "@/services/milestones";
import { Plus, CheckCircle2, Clock, AlertTriangle, Trash2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MilestoneTrackerProps {
  projectId: string;
  teamMembers: string[];
  isOwner: boolean;
}

const statusIcon = {
  pending: <Circle className="w-4 h-4 text-muted-foreground" />,
  "in-progress": <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
};

const MilestoneTracker = ({ projectId, teamMembers, isOwner }: MilestoneTrackerProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    const unsub = subscribeMilestones(projectId, setMilestones);
    return unsub;
  }, [projectId]);

  const progress = getMilestoneProgress(milestones);

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      await addMilestone(projectId, {
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        status: "pending",
        dueDate,
      });
      toast.success("Milestone added");
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      setShowAdd(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const cycleStatus = async (m: Milestone) => {
    if (!isOwner) return;
    const next = m.status === "pending" ? "in-progress" : m.status === "in-progress" ? "completed" : "pending";
    await updateMilestone(projectId, m.id, { status: next });
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold font-display flex items-center gap-2">
          Execution Tracker
          {progress.atRisk && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">
              <AlertTriangle className="w-3 h-3" /> Execution Risk
            </span>
          )}
        </h4>
        {isOwner && (
          <button onClick={() => setShowAdd(!showAdd)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">{progress.completed}/{progress.total} milestones</span>
          <span className="font-medium text-primary">{progress.percent}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <div className="flex gap-2">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium btn-primary-glow">
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone list */}
      <div className="space-y-1.5">
        {milestones.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors group"
          >
            <button onClick={() => cycleStatus(m)} className="shrink-0">
              {statusIcon[m.status]}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${m.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                {m.title}
              </p>
              {m.dueDate && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {m.dueDate}
                </p>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => deleteMilestone(projectId, m.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        ))}
        {milestones.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No milestones yet</p>
        )}
      </div>
    </div>
  );
};

export default MilestoneTracker;
