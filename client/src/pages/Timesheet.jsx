import {
  Check,
  Clock3,
  Edit3,
  FileClock,
  Pause,
  Play,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import {
  createTimesheet,
  deleteTimesheet,
  getProjects,
  getTasks,
  getMyTimesheets,
  generateAITimesheet,
  startTimer,
  stopTimer,
  submitTimesheet,
  updateTimesheet,
} from "../services/api";

const statusStyles = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

const getToday = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "";
  const hours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
  return hours > 0 ? String(Math.round(hours * 100) / 100) : "";
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "-";

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

const formatElapsed = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

const initialForm = {
  date: getToday(),
  project: "",
  task: "",
  description: "",
  startTime: "",
  endTime: "",
  duration: "",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function FormField({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const dateTimeInputClassName = `${inputClassName} appearance-auto`;

export default function Timesheet() {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timerLoading, setTimerLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTimesheets = async () => {
    try {
      const response = await getMyTimesheets();
      const records = response.data.timesheets || [];
      setTimesheets(records);
      setActiveTimer(
        records.find(
          (timesheet) =>
            timesheet.status === "draft" &&
            timesheet.startTime &&
            !timesheet.endTime,
        ) || null,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to load your timesheets."),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data.projects || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load projects."));
    }
  };

  const loadTasks = async (projectId) => {
    if (!projectId) {
      setTasks([]);
      return;
    }
    try {
      const response = await getTasks({ project: projectId });
      setTasks(response.data.tasks || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load project tasks."));
    }
  };

  useEffect(() => {
    loadTimesheets();
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks(form.project);
  }, [form.project]);

  useEffect(() => {
    if (!activeTimer?.startTime) {
      setElapsed(0);
      return undefined;
    }

    const updateElapsed = () => {
      setElapsed(
        Math.max(0, Date.now() - new Date(activeTimer.startTime).getTime()),
      );
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  const showMessage = (message, type = "success") => {
    if (type === "success") {
      setSuccess(message);
      setError("");
    } else {
      setError(message);
      setSuccess("");
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "project") {
        next.task = "";
      }
      if (name === "startTime" || name === "endTime") {
        next.duration = getDuration(next.startTime, next.endTime);
      }
      return next;
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const toPayload = () => ({
    date: new Date(`${form.date}T00:00:00`).toISOString(),
    description: form.description.trim(),
    project: form.project || undefined,
    task: form.task || undefined,
    startTime: form.startTime
      ? new Date(form.startTime).toISOString()
      : undefined,
    endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
    duration: Number(form.duration) || 0,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (
        form.startTime &&
        form.endTime &&
        !getDuration(form.startTime, form.endTime)
      ) {
        throw new Error("End time must be after start time.");
      }
      if (editingId) {
        await updateTimesheet(editingId, toPayload());
        showMessage("Timesheet updated successfully.");
        toast.success("Timesheet updated successfully.");
      } else {
        await createTimesheet(toPayload());
        showMessage("Timesheet saved successfully.");
        toast.success("Timesheet created successfully.");
      }
      resetForm();
      await loadTimesheets();
    } catch (requestError) {
      showMessage(
        requestError.response
          ? getErrorMessage(requestError, "Unable to save timesheet.")
          : requestError.message,
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (timesheet) => {
    setEditingId(timesheet._id);
    setForm({
      date: toDateInput(timesheet.date),
      project: timesheet.project?._id || timesheet.project || "",
      task: timesheet.task?._id || timesheet.task || "",
      description: timesheet.description || "",
      startTime: toDateTimeInput(timesheet.startTime),
      endTime: toDateTimeInput(timesheet.endTime),
      duration: timesheet.duration ? String(timesheet.duration) : "",
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTimesheet(deleteTarget);
      showMessage("Timesheet deleted successfully.");
      toast.success("Timesheet deleted successfully.");
      setDeleteTarget(null);
      await loadTimesheets();
    } catch (requestError) {
      showMessage(
        getErrorMessage(requestError, "Unable to delete timesheet."),
        "error",
      );
      toast.error(getErrorMessage(requestError, "Unable to delete timesheet."));
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitTimesheet = async (id) => {
    try {
      await submitTimesheet(id);
      showMessage("Timesheet submitted for approval.");
      toast.success("Timesheet submitted for approval.");
      await loadTimesheets();
    } catch (requestError) {
      showMessage(
        getErrorMessage(requestError, "Unable to submit timesheet."),
        "error",
      );
    }
  };

  const handleStartTimer = async () => {
    setTimerLoading(true);
    try {
      const response = await startTimer();
      setActiveTimer(response.data.timesheet);
      showMessage("Timer started.");
      toast.success("Timer started.");
      await loadTimesheets();
    } catch (requestError) {
      showMessage(
        getErrorMessage(requestError, "Unable to start timer."),
        "error",
      );
    } finally {
      setTimerLoading(false);
    }
  };

  const handleStopTimer = async () => {
    setTimerLoading(true);
    try {
      await stopTimer();
      setActiveTimer(null);
      showMessage("Timer stopped and timesheet saved.");
      toast.success("Timer stopped and timesheet saved.");
      await loadTimesheets();
    } catch (requestError) {
      showMessage(
        getErrorMessage(requestError, "Unable to stop timer."),
        "error",
      );
    } finally {
      setTimerLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    const description = aiDescription.trim();
    if (!description) {
      setAiError("Describe the work you completed first.");
      return;
    }
    if (description.length > 2000) {
      setAiError("Keep the work description to 2000 characters or fewer.");
      return;
    }

    setAiLoading(true);
    setAiError("");
    try {
      const response = await generateAITimesheet(description);
      setAiResult(response.data.result);
      toast.success("AI suggestion generated.");
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "AI service is temporarily unavailable. You can still enter your timesheet manually.",
      );
      setAiError(message);
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseAIEntry = async () => {
    if (!aiResult) return;

    const suggestedProject = projects.find(
      (project) =>
        aiResult.project &&
        project.name.toLowerCase() === aiResult.project.toLowerCase(),
    );
    let availableTasks = tasks;
    if (suggestedProject) {
      try {
        const response = await getTasks({ project: suggestedProject._id });
        availableTasks = response.data.tasks || [];
        setTasks(availableTasks);
      } catch {
        availableTasks = [];
      }
    }
    const suggestedTask = availableTasks.find(
      (task) =>
        aiResult.task &&
        task.title.toLowerCase() === aiResult.task.toLowerCase(),
    );

    setForm((current) => ({
      ...current,
      description: aiResult.description || aiDescription,
      duration:
        aiResult.estimatedHours > 0
          ? String(aiResult.estimatedHours)
          : current.duration,
      project: suggestedProject?._id || "",
      task: suggestedTask?._id || "",
    }));
    setAiError("");
    setSuccess("AI suggestion added to the form. Review it before saving.");
    toast.success("AI suggestion added to the form.");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Time and attendance
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Timesheet
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Capture project hours accurately and keep your week moving.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("timesheet-form")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={17} /> Add timesheet
        </button>
      </section>

      {(error || success) && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
        >
          <span className="flex-1">{error || success}</span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60 shadow-sm shadow-blue-100/60">
        <div className="border-b border-blue-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <Sparkles size={19} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                AI Timesheet Assistant
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Describe what you worked on and let AI structure your timesheet.
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Work description
              </span>
              <textarea
                value={aiDescription}
                onChange={(event) => {
                  setAiDescription(event.target.value);
                  setAiError("");
                }}
                className="min-h-24 w-full resize-y rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="Example: Worked on login API, fixed JWT authentication issues and tested the endpoints for 2 hours."
                maxLength={2000}
              />
            </label>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiLoading ? <Loader inline /> : <Sparkles size={17} />}
              {aiLoading ? "Generating..." : "Generate with AI"}
            </button>
          </div>
          {aiError && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {aiError}
            </p>
          )}
          {aiResult && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-white p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                    Generated preview
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the suggestion before adding it to your timesheet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseAIEntry}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Use This Entry
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Category
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {aiResult.category || "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Project
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {aiResult.project || "No suggestion"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Task
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {aiResult.task || "No suggestion"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Estimated hours
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {Number(aiResult.estimatedHours || 0).toFixed(2)}h
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-slate-100 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Description
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {aiResult.description || "-"}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-slate-950 shadow-xl shadow-slate-300/30">
        <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-300">
              <span
                className={`h-2 w-2 rounded-full ${activeTimer ? "animate-pulse bg-emerald-400" : "bg-slate-600"}`}
              />
              {activeTimer ? "Timer Running" : "Ready to track"}
            </div>
            <p className="mt-5 font-mono text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              {formatElapsed(elapsed)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              {activeTimer
                ? `Started at ${formatDateTime(activeTimer.startTime)}`
                : "Start a timer when you begin working."}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-blue-200">
              <Clock3 size={24} />
            </div>
            {activeTimer ? (
              <button
                type="button"
                onClick={handleStopTimer}
                disabled={timerLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                <Pause size={17} />
                {timerLoading ? "Stopping..." : "Stop Timer"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTimer}
                disabled={timerLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-400 disabled:opacity-60"
              >
                <Play size={17} />
                {timerLoading ? "Starting..." : "Start Timer"}
              </button>
            )}
          </div>
        </div>
      </section>

      <section
        id="timesheet-form"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">
              {editingId ? "Edit timesheet" : "Add timesheet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Record time manually when you need to fill in the details.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"
            >
              <X size={15} /> Cancel
            </button>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-7 lg:items-end"
        >
          <FormField label="Date">
            <input
              className={dateTimeInputClassName}
              type="date"
              name="date"
              value={form.date}
              onChange={handleFormChange}
              required
            />
          </FormField>
          <FormField label="Project">
            <select
              className={inputClassName}
              name="project"
              value={form.project}
              onChange={handleFormChange}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Task">
            <select
              className={inputClassName}
              name="task"
              value={form.task}
              onChange={handleFormChange}
              disabled={!form.project}
            >
              <option value="">No task</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Description"
            className="md:col-span-2 lg:col-span-1"
          >
            <input
              className={inputClassName}
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="What did you work on?"
            />
          </FormField>
          <FormField label="Start time">
            <input
              className={dateTimeInputClassName}
              type="datetime-local"
              name="startTime"
              value={form.startTime}
              onChange={handleFormChange}
            />
          </FormField>
          <FormField label="End time">
            <input
              className={dateTimeInputClassName}
              type="datetime-local"
              name="endTime"
              value={form.endTime}
              onChange={handleFormChange}
            />
          </FormField>
          <FormField label="Duration (hours)">
            <input
              className={inputClassName}
              type="number"
              name="duration"
              min="0"
              step="0.25"
              value={form.duration}
              onChange={handleFormChange}
              placeholder="0.00"
            />
          </FormField>
          <div className="md:col-span-2 lg:col-span-7 lg:flex lg:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 lg:w-auto"
            >
              {saving ? <Loader inline /> : <Check size={17} />}
              {saving
                ? "Saving..."
                : editingId
                  ? "Update timesheet"
                  : "Save timesheet"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h3 className="font-bold text-slate-900">Your timesheets</h3>
            <p className="mt-1 text-sm text-slate-500">
              Review, edit, and submit your time entries.
            </p>
          </div>
          <FileClock className="text-slate-300" size={21} />
        </div>
        {loading ? (
          <Loader />
        ) : timesheets.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <FileClock size={23} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              No timesheets yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Start a timer or add your first time entry above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-260 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Task</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timesheets.map((timesheet) => {
                  const editable = ["draft", "rejected"].includes(
                    timesheet.status,
                  );
                  return (
                    <tr key={timesheet._id} className="text-sm text-slate-600">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">
                        {formatDate(timesheet.date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {timesheet.project?.name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {timesheet.task?.title || "-"}
                      </td>
                      <td className="max-w-xs truncate px-6 py-4">
                        <p>{timesheet.description || "Untitled entry"}</p>
                        {timesheet.status === "rejected" &&
                          timesheet.managerComment && (
                            <p
                              className="mt-1 max-w-56 truncate text-xs text-rose-600"
                              title={timesheet.managerComment}
                            >
                              Reason: {timesheet.managerComment}
                            </p>
                          )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-800">
                        {Number(timesheet.duration || 0).toFixed(2)}h
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={timesheet.status} />
                        {timesheet.status === "submitted" && (
                          <p className="mt-1 text-xs font-medium text-blue-600">
                            Pending Approval
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={!editable}
                            onClick={() => handleEdit(timesheet)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Edit timesheet"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={!editable}
                            onClick={() => handleDelete(timesheet._id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Delete timesheet"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          {timesheet.status === "draft" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSubmitTimesheet(timesheet._id)
                              }
                              className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                              aria-label="Submit timesheet"
                              title="Submit"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          {timesheet.status === "approved" && (
                            <span className="px-2 text-xs font-semibold text-emerald-600">
                              Approved
                            </span>
                          )}
                          {timesheet.status === "rejected" && (
                            <span className="px-2 text-xs font-semibold text-rose-600">
                              Edit to resubmit
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete timesheet?"
        message="Are you sure you want to delete this timesheet? This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        busy={deleting}
      />
    </div>
  );
}
