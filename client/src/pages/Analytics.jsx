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
import toast from "react-hot-toast";
import { CheckCircle2, Clock3, Sparkles, XCircle } from "lucide-react";
import Loader from "../components/Loader";
import {
  getDashboardStats,
  getAIWeeklySummary,
  getProjectHours,
  getTaskStats,
  getWeeklyHours,
} from "../services/api";

const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#f43f5e"];
const formatHours = (value) => `${Number(value || 0).toFixed(2)}h`;

function AnalyticsCard({ title, description, children, emptyMessage }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
      <div className="mb-6">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {emptyMessage ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </article>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [weeklyHours, setWeeklyHours] = useState([]);
  const [projectHours, setProjectHours] = useState([]);
  const [taskStats, setTaskStats] = useState({
    todo: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [
          dashboardResponse,
          weeklyResponse,
          projectResponse,
          taskResponse,
        ] = await Promise.all([
          getDashboardStats(),
          getWeeklyHours(),
          getProjectHours(),
          getTaskStats(),
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
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Unable to load analytics.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const taskData = [
    { name: "Todo", value: taskStats.todo },
    { name: "In Progress", value: taskStats.inProgress },
    { name: "Completed", value: taskStats.completed },
  ];
  const approvalData = [
    { name: "Approved", value: stats?.approvedTimesheets || 0 },
    { name: "Rejected", value: stats?.rejectedTimesheets || 0 },
  ];

  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setError("");
    try {
      const response = await getAIWeeklySummary();
      setAiSummary(response.data.result);
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "AI service is temporarily unavailable. You can still review your analytics manually.";
      setError(message);
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Performance intelligence
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Analytics
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          A clear view of your time, project mix, and delivery progress.
        </p>
      </section>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60 shadow-sm shadow-blue-100/60">
        <div className="flex flex-col justify-between gap-4 border-b border-blue-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <Sparkles size={19} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                AI Weekly Work Summary
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Turn your current-week work into a concise review.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={aiLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
          >
            {aiLoading ? <Loader inline /> : <Sparkles size={16} />}
            {aiLoading ? "Generating..." : "Generate Weekly Summary"}
          </button>
        </div>
        {aiSummary && (
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                Overall Summary
              </p>
              <p className="mt-2 text-base leading-7 text-slate-700">
                {aiSummary.summary || "No summary was generated."}
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock3 size={16} className="text-blue-600" /> Total Hours:{" "}
                {formatHours(aiSummary.totalHours)}
              </div>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Top Projects
              </p>
              {aiSummary.topProjects?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {aiSummary.topProjects.map((project, index) => (
                    <li
                      key={`${project.project || project.name || project}-${index}`}
                      className="flex gap-2"
                    >
                      <span className="text-blue-600">{index + 1}.</span>
                      {typeof project === "string"
                        ? project
                        : project.project || project.name || "Project"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No project focus identified.
                </p>
              )}
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Key Highlights
              </p>
              {aiSummary.highlights?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {aiSummary.highlights.map((highlight, index) => (
                    <li key={`${highlight}-${index}`} className="flex gap-2">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-500"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No highlights identified.
                </p>
              )}
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                AI Recommendations
              </p>
              {aiSummary.recommendations?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {aiSummary.recommendations.map((recommendation, index) => (
                    <li
                      key={`${recommendation}-${index}`}
                      className="flex gap-2"
                    >
                      <span className="text-blue-600">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No recommendations identified.
                </p>
              )}
            </div>
          </div>
        )}
      </section>
      {loading ? (
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center gap-3 text-blue-700">
                <Clock3 size={20} />
                <span className="text-sm font-semibold">Total Hours</span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {formatHours(stats?.totalHours)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This workspace period
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 size={20} />
                <span className="text-sm font-semibold">
                  Approved Timesheets
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {stats?.approvedTimesheets || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Approved submissions
              </p>
            </article>
            <article className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
              <div className="flex items-center gap-3 text-rose-700">
                <XCircle size={20} />
                <span className="text-sm font-semibold">
                  Rejected Timesheets
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {stats?.rejectedTimesheets || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Returned for revision
              </p>
            </article>
          </section>
          <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <AnalyticsCard
              title="Weekly Hours"
              description="Your logged hours for This Week."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyHours}
                    margin={{ top: 5, right: 10, left: -18, bottom: 0 }}
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
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(2)}h`,
                        "Hours",
                      ]}
                    />
                    <Bar
                      dataKey="hours"
                      fill="#2563eb"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
            <AnalyticsCard
              title="Approved vs Rejected Timesheets"
              description="Your recorded submission outcomes."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={approvalData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={4}
                    >
                      {approvalData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={index === 0 ? "#10b981" : "#f43f5e"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            <AnalyticsCard
              title="Project-wise Hours"
              description="Hours grouped by project."
              emptyMessage={
                !projectHours.length ? "No projects available yet." : null
              }
            >
              {projectHours.length > 0 && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectHours}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 12, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <YAxis
                        dataKey="project"
                        type="category"
                        width={110}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(2)}h`,
                          "Hours",
                        ]}
                      />
                      <Bar
                        dataKey="hours"
                        fill="#14b8a6"
                        radius={[0, 5, 5, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </AnalyticsCard>
            <AnalyticsCard
              title="Task Status"
              description="Current distribution of your assigned tasks."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={4}
                    >
                      {taskData.map((entry, index) => (
                        <Cell key={entry.name} fill={colors[index + 1]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </section>
        </>
      )}
    </div>
  );
}
