import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20 md:pb-0 md:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <DesktopSidebar currentPath={location.pathname} />
    </div>
  );
};

import { Link } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, CalendarDays, Settings } from "lucide-react";
import logo from "@/assets/logo.jpg";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const DesktopSidebar = ({ currentPath }: { currentPath: string }) => {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col z-50">
      <div className="p-6 border-b border-border">
        <img src={logo} alt="Perfect Plumbing" className="h-10 object-contain" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.to || (item.to !== "/" && currentPath.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AppLayout;
