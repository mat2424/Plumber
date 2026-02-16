import { useState } from "react";
import { Link } from "react-router-dom";
import { useJobs } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { statusDotColor } from "@/components/JobStatusBadge";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: jobs } = useJobs("all");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) { days.push(day); day = addDays(day, 1); }

  const getJobsForDay = (date: Date) =>
    jobs?.filter((j) => isSameDay(new Date(j.scheduled_date + "T00:00:00"), date)) ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-5 h-5" /></Button>
        <h2 className="font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-5 h-5" /></Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-xs text-muted-foreground font-medium py-2">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const dayJobs = getJobsForDay(d);
          const inMonth = isSameMonth(d, currentMonth);
          return (
            <div
              key={i}
              className={`min-h-[60px] md:min-h-[80px] rounded-lg p-1.5 text-sm ${
                isToday(d) ? "bg-primary/10 border border-primary/30" : inMonth ? "bg-card" : "bg-background"
              }`}
            >
              <span className={`text-xs ${inMonth ? "text-foreground" : "text-muted-foreground/40"} ${isToday(d) ? "text-primary font-bold" : ""}`}>
                {format(d, "d")}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {dayJobs.slice(0, 3).map((j) => (
                  <Link key={j.id} to={`/jobs/${j.id}`} className="block">
                    <div className={`w-2 h-2 rounded-full ${statusDotColor[j.status]}`} title={j.customers?.full_name} />
                  </Link>
                ))}
                {dayJobs.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayJobs.length - 3}</span>}
              </div>
              {/* Show names on larger screens */}
              <div className="hidden md:block space-y-0.5 mt-1">
                {dayJobs.slice(0, 2).map((j) => (
                  <Link key={j.id} to={`/jobs/${j.id}`}>
                    <div className={`text-[10px] leading-tight truncate px-1 py-0.5 rounded ${statusDotColor[j.status].replace("bg-", "bg-")}/20 text-foreground`}>
                      {j.customers?.full_name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
