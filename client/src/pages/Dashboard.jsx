import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileClock,
  FolderKanban,
  UsersRound,
} from "lucide-react";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardStats,
  getManagerStats,
  getMyTimesheets,
  getProjectHours,
  getTaskStats,
  getWeeklyHours,
} from "../services/api";

const chartColors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#f43f5e"];
const statusStyles = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(value))
    : "-";

const getErrorMessage = (error) =>
  error.response?.data?.message || "Unable to load dashboard analytics.";

function MetricSkeleton() {
  return (
    <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
  );
}

function ChartCard({ title, description, children, emptyMessage }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
      <div className="mb-6">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {emptyMessage ? (
        <div className="flex h-64 items-center justify-center text-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </article>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [weeklyHours, setWeeklyHours] = useState([]);
  const [projectHours, setProjectHours] = useState([]);
  const [taskStats, setTaskStats] = useState({
    todo: 0,
    inProgress: 0,
    completed: 0,
  });
  const [recentTimesheets, setRecentTimesheets] = useState([]);
  const [managerStats, setManagerStats] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const managerRequest =
          user?.role === "manager" ? getManagerStats() : Promise.resolve(null);
        const [
          dashboardResponse,
          weeklyResponse,
          projectResponse,
          taskResponse,
          timesheetResponse,
          managerResponse,
        ] = await Promise.all([
          getDashboardStats(),
          getWeeklyHours(),
          getProjectHours(),
          getTaskStats(),
          getMyTimesheets(),
          managerRequest,
        ]);
        setStats(dashboardResponse.data.stats);
        setWeeklyHours(weeklyResponse.data.weeklyHours || []);
        setProjectHours(projectResponse.data.projectHours || []);
        setTaskStats(
          taskResponse.data.taskStats || {
            todo: 0,
            inProgress: 0,
            completed: 0,
          },
        );
        setRecentTimesheets(
          (timesheetResponse.data.timesheets || []).slice(0, 5),
        );
        setManagerStats(managerResponse?.data.stats || null);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [user?.role]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const taskChartData = [
    { name: "Todo", value: taskStats.todo },
    { name: "In Progress", value: taskStats.inProgress },
    { name: "Completed", value: taskStats.completed },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section>
        <p className="text-sm font-medium text-blue-600">This Week</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Good Morning, {firstName} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Here's an overview of your work and productivity.
        </p>
      </section>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <MetricSkeleton key={item} />
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Hours"
            value={`${Number(stats?.totalHours || 0).toFixed(2)}h`}
            detail="All non-rejected entries"
            icon={Clock3}
            tone="blue"
          />
          <StatCard
            label="Active Projects"
            value={stats?.activeProjects || 0}
            detail="Projects accessible to you"
            icon={FolderKanban}
            tone="indigo"
          />
          <StatCard
            label="Total Tasks"
            value={stats?.totalTasks || 0}
            detail="Tasks assigned to you"
            icon={FileClock}
            tone="amber"
          />
          <StatCard
            label="Completed Tasks"
            value={stats?.completedTasks || 0}
            detail="Assigned tasks completed"
            icon={CheckCircle2}
            tone="emerald"
          />
        </section>
      )}

      {managerStats && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <UsersRound className="text-blue-600" size={19} />
            <h2 className="font-bold text-slate-900">Manager overview</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Team Members"
              value={managerStats.teamMembers}
              detail="Across managed projects"
              icon={UsersRound}
              tone="blue"
            />
            <StatCard
              label="Pending Approvals"
              value={managerStats.pendingApprovals}
              detail="Need your review"
              icon={FileClock}
              tone="amber"
            />
            <StatCard
              label="Team Hours"
              value={`${Number(managerStats.totalTeamHours || 0).toFixed(2)}h`}
              detail="Non-rejected team time"
              icon={Clock3}
              tone="indigo"
            />
            <StatCard
              label="Active Projects"
              value={managerStats.activeProjects}
              detail="Managed active work"
              icon={FolderKanban}
              tone="emerald"
            />
            <StatCard
              label="Completed Tasks"
              value={managerStats.completedTasks}
              detail="Across managed projects"
              icon={CheckCircle2}
              tone="blue"
            />
          </div>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartCard
          title="Weekly hours"
          description="Your logged hours from Monday through Sunday."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyHours}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  allowDecimals
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  formatter={(value) => [
                    `${Number(value).toFixed(2)}h`,
                    "Hours",
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard
          title="Project distribution"
          description="Hours spent by project."
          emptyMessage={
            !projectHours.length ? "No projects available yet." : null
          }
        >
          {projectHours.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectHours}
                    dataKey="hours"
                    nameKey="project"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {projectHours.map((entry, index) => (
                      <Cell
                        key={`${entry.project}-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(2)}h`,
                      "Hours",
                    ]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Task status"
          description="Your assigned task distribution."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={taskChartData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  width={78}
                />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar
                  dataKey="value"
                  fill="#14b8a6"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard
          title="Recent timesheets"
          description="Your five latest entries."
          emptyMessage={
            !recentTimesheets.length ? "No timesheet data available yet." : null
          }
        >
          {recentTimesheets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-120 text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Project / Task</th>
                    <th className="pb-3 font-semibold">Hours</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTimesheets.map((timesheet) => (
                    <tr key={timesheet._id}>
                      <td className="whitespace-nowrap py-3 text-slate-600">
                        {formatDate(timesheet.date)}
                      </td>
                      <td className="max-w-36 truncate py-3">
                        <p className="truncate font-medium text-slate-800">
                          {timesheet.project?.name || "Unassigned"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {timesheet.task?.title ||
                            timesheet.description ||
                            "No task"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap py-3 font-semibold text-slate-700">
                        {Number(timesheet.duration || 0).toFixed(2)}h
                      </td>
                      <td className="py-3 text-right">
                        <StatusBadge status={timesheet.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </section>
    </div>
  );
}
