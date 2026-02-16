import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type JobStatus = Database["public"]["Enums"]["job_status"];

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  quoted: { label: "Quoted", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  confirmed: { label: "Confirmed", className: "bg-info/20 text-info border-info/30" },
  in_progress: { label: "In Progress", className: "bg-warning/20 text-warning border-warning/30" },
  complete: { label: "Complete", className: "bg-success/20 text-success border-success/30" },
  invoiced: { label: "Invoiced", className: "bg-primary/20 text-primary border-primary/30" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export const statusDotColor: Record<JobStatus, string> = {
  draft: "bg-muted-foreground",
  quoted: "bg-yellow-400",
  confirmed: "bg-info",
  in_progress: "bg-warning",
  complete: "bg-success",
  invoiced: "bg-primary",
  archived: "bg-muted-foreground",
};

const JobStatusBadge = ({ status }: { status: JobStatus }) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`${config.className} text-xs font-medium border`}>
      {config.label}
    </Badge>
  );
};

export default JobStatusBadge;
