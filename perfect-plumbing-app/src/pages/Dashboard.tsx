import { Link } from "react-router-dom";
import { Plus, Briefcase, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/lib/api";
import JobStatusBadge from "@/components/JobStatusBadge";
import { format } from "date-fns";
import logo from "@/assets/logo.jpg";

const Dashboard = () => {
  const { data, isLoading } = useDashboardStats();

  const stats = [
    { label: "This Week", value: data?.weekCount ?? 0, icon: Briefcase },
    { label: "Unpaid Jobs", value: data?.unpaidCount ?? 0, icon: AlertCircle },
    { label: "Pending Quotes", value: data?.pendingQuotes ?? 0, icon: FileText },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hey, Boss 👋</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <img src={logo} alt="Perfect Plumbing" className="h-8 md:hidden rounded" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-lg p-4 card-glow text-center">
            <s.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{isLoading ? "—" : s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's Jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Today's Jobs</h2>
          <Link to="/jobs">
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-lg p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : data?.todayJobs.length === 0 ? (
          <div className="bg-card rounded-lg p-8 text-center card-glow">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No jobs scheduled today</p>
            <Link to="/jobs">
              <Button className="mt-4 gold-gradient text-primary-foreground font-semibold" size="sm">
                <Plus className="w-4 h-4 mr-1" /> New Job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.todayJobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <div className="bg-card rounded-lg p-4 card-glow hover:border-primary/30 border border-transparent transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{job.customers?.full_name}</span>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{job.job_address}</p>
                  {job.scheduled_time && (
                    <p className="text-xs text-primary mt-1">{job.scheduled_time}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/customers">
          <Button variant="outline" className="w-full h-14 border-border">
            <Plus className="w-4 h-4 mr-2" /> New Customer
          </Button>
        </Link>
        <Link to="/jobs">
          <Button className="w-full h-14 gold-gradient text-primary-foreground font-semibold">
            <Plus className="w-4 h-4 mr-2" /> New Job
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
