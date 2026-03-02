import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "accepted" | "rejected";
}

const config = {
  pending: {
    label: "Pending",
    classes: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dot: "bg-amber-400",
  },
  accepted: {
    label: "Accepted",
    classes: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const c = config[status] || config.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border", c.classes)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
};

export default StatusBadge;
