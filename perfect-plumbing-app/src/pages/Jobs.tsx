import { useState } from "react";
import { Link } from "react-router-dom";
import { useJobs, useCustomers, useCreateJob } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, MapPin } from "lucide-react";
import JobStatusBadge from "@/components/JobStatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";

const statusFilters = [
  { value: "all", label: "All Jobs" },
  { value: "draft", label: "Draft" },
  { value: "quoted", label: "Quoted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
  { value: "invoiced", label: "Invoiced" },
  { value: "archived", label: "Archived" },
];

const Jobs = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: jobs, isLoading } = useJobs(filter);
  const { data: customers } = useCustomers();
  const createJob = useCreateJob();

  const [form, setForm] = useState({ customer_id: "", job_address: "", description: "", scheduled_date: new Date().toISOString().split("T")[0], scheduled_time: "" });

  const filtered = jobs?.filter((j) =>
    [j.customers?.full_name, j.job_address, j.description].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    if (!form.customer_id || !form.job_address || !form.description || !form.scheduled_date) {
      toast.error("Fill in all required fields"); return;
    }
    try {
      await createJob.mutateAsync({ ...form, scheduled_time: form.scheduled_time || undefined });
      setDialogOpen(false);
      setForm({ customer_id: "", job_address: "", description: "", scheduled_date: new Date().toISOString().split("T")[0], scheduled_time: "" });
      toast.success("Job created");
    } catch { toast.error("Failed to create job"); }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-foreground font-semibold" size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Job</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.customer_id} onValueChange={(v) => {
                const cust = customers?.find((c) => c.id === v);
                setForm({ ...form, customer_id: v, job_address: cust?.address ?? form.job_address });
              }}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Customer *" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Job Address *" value={form.job_address} onChange={(e) => setForm({ ...form, job_address: e.target.value })} className="bg-secondary border-border" />
              <Textarea placeholder="Description of Work *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" />
              <Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="bg-secondary border-border" />
              <Input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} className="bg-secondary border-border" placeholder="Time (optional)" />
              <Button onClick={handleCreate} className="w-full gold-gradient text-primary-foreground font-semibold" disabled={createJob.isPending}>
                {createJob.isPending ? "Creating..." : "Create Job"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.value ? "gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-card rounded-lg h-20 animate-pulse" />)}</div>
      ) : filtered?.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center card-glow">
          <p className="text-muted-foreground">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map((j) => (
            <Link key={j.id} to={`/jobs/${j.id}`}>
              <div className="bg-card rounded-lg p-4 card-glow hover:border-primary/30 border border-transparent transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{j.customers?.full_name ?? "Unknown"}</span>
                  <JobStatusBadge status={j.status} />
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {j.job_address}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{format(new Date(j.scheduled_date), "MMM d, yyyy")}</span>
                  {j.scheduled_time && <span>{j.scheduled_time}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
