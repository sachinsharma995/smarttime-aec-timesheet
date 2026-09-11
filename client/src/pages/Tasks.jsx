import { CheckSquare2, Edit3, Filter, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import {
  createTask,
  deleteTask,
  getProjects,
  getTasks,
  updateTask,
} from "../services/api";

const initialForm = {
  title: "",
  description: "",
  project: "",
  assignedTo: "",
  priority: "medium",
  status: "todo",
  dueDate: "",
};
const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const priorityStyles = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-rose-50 text-rose-700",
};
const statusStyles = {
  todo: "bg-slate-100 text-slate-600",
  "in-progress": "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
};
const errorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "-";

function Badge({ value, styles }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[value]}`}
    >
      {value.replace("-", " ")}
    </span>
  );
}

function TaskModal({ form, projects, saving, onChange, onClose, onSubmit }) {
  const project = projects.find((item) => item._id === form.project);
  const members = project?.members || [];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">Work planning</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {form.id ? "Edit task" : "Create task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Title
            </span>
            <input
              className={inputClassName}
              name="title"
              value={form.title}
              onChange={onChange}
              required
              placeholder="Review structural drawings"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Description
            </span>
            <textarea
              className={`${inputClassName} min-h-24 resize-y`}
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Add task context"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Project
            </span>
            <select
              className={inputClassName}
              name="project"
              value={form.project}
              onChange={(event) => {
                onChange(event);
              }}
              required
            >
              <option value="">Select a project</option>
              {projects.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Assigned user
            </span>
            <select
              className={inputClassName}
              name="assignedTo"
              value={form.assignedTo}
              onChange={onChange}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Due date
            </span>
            <input
              className={inputClassName}
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={onChange}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Priority
            </span>
            <select
              className={`${inputClassName} capitalize`}
              name="priority"
              value={form.priority}
              onChange={onChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Status
            </span>
            <select
              className={`${inputClassName} capitalize`}
              name="status"
              value={form.status}
              onChange={onChange}
            >
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader inline />}
              {saving ? "Saving..." : form.id ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    project: "",
    status: "",
    priority: "",
  });
  const [form, setForm] = useState(initialForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data.projects || []);
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to load projects."));
    }
  };
  const loadTasks = async () => {
    try {
      const response = await getTasks(filters);
      setTasks(response.data.tasks || []);
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to load tasks."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);
  useEffect(() => {
    loadTasks();
  }, [filters.project, filters.status, filters.priority]);

  const openModal = (task = null) => {
    setForm(
      task
        ? {
            id: task._id,
            title: task.title,
            description: task.description || "",
            project: task.project?._id || task.project,
            assignedTo: task.assignedTo?._id || task.assignedTo || "",
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate
              ? new Date(task.dueDate).toISOString().slice(0, 10)
              : "",
          }
        : {
            ...initialForm,
            project: filters.project || projects[0]?._id || "",
          },
    );
    setModalOpen(true);
    setError("");
  };

  const handleChange = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
      ...(event.target.name === "project" ? { assignedTo: "" } : {}),
    }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || undefined,
        assignedTo: form.assignedTo || undefined,
      };
      if (form.id) await updateTask(form.id, payload);
      else await createTask(payload);
      setModalOpen(false);
      const message = form.id
        ? "Task updated successfully."
        : "Task created successfully.";
      setSuccess(message);
      toast.success(message);
      await loadTasks();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to save task."));
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget);
      setSuccess("Task deleted successfully.");
      toast.success("Task deleted successfully.");
      setDeleteTarget(null);
      await loadTasks();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to delete task."));
      toast.error(errorMessage(requestError, "Unable to delete task."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Work planning</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Tasks
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Turn project scope into clear, accountable next steps.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        >
          <Plus size={17} /> Create task
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Filter size={17} className="text-blue-600" /> Filter tasks
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select
            className={inputClassName}
            value={filters.project}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                project: event.target.value,
              }))
            }
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            className={`${inputClassName} capitalize`}
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="">All statuses</option>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className={`${inputClassName} capitalize`}
            value={filters.priority}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                priority: event.target.value,
              }))
            }
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">Task list</h2>
            <p className="mt-1 text-sm text-slate-500">
              Track delivery across your accessible projects.
            </p>
          </div>
          <CheckSquare2 className="text-slate-300" size={22} />
        </div>
        {loading ? (
          <Loader />
        ) : tasks.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <CheckSquare2 size={23} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              No tasks found
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Create a task or adjust your filters to see work here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task</th>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Assigned to</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Due date</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task._id} className="text-sm text-slate-600">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">{task.title}</p>
                      <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                        {task.description || "No description"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      {task.project?.name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      {task.assignedTo?.name || "Unassigned"}
                    </td>
                    <td className="px-6 py-5">
                      <Badge value={task.priority} styles={priorityStyles} />
                    </td>
                    <td className="px-6 py-5">
                      <Badge value={task.status} styles={statusStyles} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openModal(task)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                          aria-label="Edit task"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(task._id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Delete task"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modalOpen && (
        <TaskModal
          form={form}
          projects={projects}
          saving={saving}
          onChange={handleChange}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        busy={deleting}
      />
    </div>
  );
}
