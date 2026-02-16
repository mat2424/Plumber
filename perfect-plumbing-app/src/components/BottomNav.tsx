import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, CalendarDays, MoreHorizontal } from "lucide-react";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/settings", icon: MoreHorizontal, label: "More" },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
