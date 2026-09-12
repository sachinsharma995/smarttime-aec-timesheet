import {
  CalendarDays,
  Edit3,
  Eye,
  FolderKanban,
  Plus,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  addProjectMember,
  createProject,
  deleteProject,
  getProjects,
  removeProjectMember,
  updateProject,
} from "../services/api";

const initialForm = {
  name: "",
  description: "",
  client: "",
  startDate: "",
  endDate: "",
  status: "active",
};
const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-blue-50 text-blue-700",
  "on-hold": "bg-amber-50 text-amber-700",
};
const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
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
const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}

function ProjectModal({ form, readOnly, saving, onChange, onClose, onSubmit }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Project workspace
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {readOnly
                ? "Project details"
                : form.id
                  ? "Edit project"
                  : "Create project"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close modal"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Project name
            </span>
            <input
              className={inputClassName}
              name="name"
              value={form.name}
              onChange={onChange}
              disabled={readOnly}
              required
              placeholder="Riverside Civic Center"
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
              disabled={readOnly}
              placeholder="What is this project delivering?"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Client
            </span>
            <input
              className={inputClassName}
              name="client"
              value={form.client}
              onChange={onChange}
              disabled={readOnly}
              placeholder="Client or organization"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Start date
            </span>
            <input
              className={inputClassName}
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={onChange}
              disabled={readOnly}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              End date
            </span>
            <input
              className={inputClassName}
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={onChange}
              disabled={readOnly}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Status
            </span>
            <select
              className={`${inputClassName} capitalize`}
              name="status"
              value={form.status}
              onChange={onChange}
              disabled={readOnly}
            >
              <option value="active">Active</option>
              <option value="on-hold">On hold</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader inline />}
                {saving
                  ? "Saving..."
                  : form.id
                    ? "Save changes"
                    : "Create project"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [memberEmails, setMemberEmails] = useState({});
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openModal = (project = null, readOnly = false) => {
    setForm(
      project
        ? {
            id: project._id,
            name: project.name,
            description: project.description || "",
            client: project.client || "",
            startDate: toDateInput(project.startDate),
            endDate: toDateInput(project.endDate),
            status: project.status,
          }
        : initialForm,
    );
    setModal({ readOnly });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("Project end date must be on or after the start date.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (form.id) await updateProject(form.id, payload);
      else await createProject(payload);
      setModal(null);
      const message = form.id
        ? "Project updated successfully."
        : "Project created successfully.";
      setSuccess(message);
      toast.success(message);
      await loadProjects();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to save project."));
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
      await deleteProject(deleteTarget);
      setSuccess("Project deleted successfully.");
      toast.success("Project deleted successfully.");
      setDeleteTarget(null);
      await loadProjects();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to delete project."));
      toast.error(errorMessage(requestError, "Unable to delete project."));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMember = async (projectId) => {
    const email = memberEmails[projectId]?.trim();
    if (!email) return setError("Enter a member email address first.");
    try {
      await addProjectMember(projectId, { email });
      setMemberEmails((current) => ({ ...current, [projectId]: "" }));
      setSuccess("Project member added successfully.");
      toast.success("Project member added successfully.");
      await loadProjects();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to add project member."));
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    if (!window.confirm("Remove this member from the project?")) return;
    try {
      await removeProjectMember(projectId, userId);
      setSuccess("Project member removed.");
      toast.success("Project member removed.");
      await loadProjects();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to remove project member."));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Project portfolio
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Projects
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Keep project scope, people, and delivery dates in view.
          </p>
        </div>
        {isManager && (
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          >
            <Plus size={17} /> Create project
          </button>
        )}
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">Your projects</h2>
            <p className="mt-1 text-sm text-slate-500">
              Projects you created or have been assigned to.
            </p>
          </div>
          <FolderKanban className="text-slate-300" size={22} />
        </div>
        {loading ? (
          <Loader />
        ) : projects.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <FolderKanban size={23} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              No projects yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Create a project to start organizing delivery work.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Schedule</th>
                  <th className="px-6 py-4 font-semibold">Members</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <tr
                    key={project._id}
                    className="align-top text-sm text-slate-600"
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">{project.name}</p>
                      <p className="mt-1 max-w-56 truncate text-xs text-slate-400">
                        {project.description || "No description"}
                      </p>
                    </td>
                    <td className="px-6 py-5">{project.client || "-"}</td>
                    <td className="px-6 py-5">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <CalendarDays size={14} className="text-slate-400" />
                        {formatDate(project.startDate)} -{" "}
                        {formatDate(project.endDate)}
                      </div>
                    </td>
                    <td className="min-w-64 px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {(project.members || []).map((member) => (
                          <span
                            key={member._id}
                            className="group inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                            title={member.email}
                          >
                            {member.name}
                            {isManager && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveMember(project._id, member._id)
                                }
                                className="hidden text-slate-400 hover:text-rose-600 group-hover:block"
                                aria-label={`Remove ${member.name}`}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isManager && (
                        <div className="mt-3 flex gap-2">
                          <input
                            value={memberEmails[project._id] || ""}
                            onChange={(event) =>
                              setMemberEmails((current) => ({
                                ...current,
                                [project._id]: event.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                            placeholder="Member email"
                            type="email"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddMember(project._id)}
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            aria-label="Add project member"
                            title="Add member"
                          >
                            <UserPlus size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openModal(project, true)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                          aria-label="View project"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        {isManager && (
                          <>
                            <button
                              type="button"
                              onClick={() => openModal(project)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                              aria-label="Edit project"
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(project._id)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Delete project"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modal && (
        <ProjectModal
          form={form}
          readOnly={modal.readOnly}
          saving={saving}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              [event.target.name]: event.target.value,
            }))
          }
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete project?"
        message="This project can only be deleted when it has no dependent tasks or timesheets."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        busy={deleting}
      />
    </div>
  );
}
