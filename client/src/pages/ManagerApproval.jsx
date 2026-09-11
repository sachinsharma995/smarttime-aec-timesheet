import {
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileClock,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import {
  approveTimesheet,
  getPendingTimesheets,
  rejectTimesheet,
} from "../services/api";

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
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

function DetailModal({ timesheet, onClose }) {
  const details = [
    ["Employee", timesheet.user?.name || "-"],
    ["Email", timesheet.user?.email || "-"],
    ["Project", timesheet.project?.name || "-"],
    ["Task", timesheet.task?.title || "-"],
    ["Date", formatDate(timesheet.date)],
    ["Start time", formatDateTime(timesheet.startTime)],
    ["End time", formatDateTime(timesheet.endTime)],
    ["Duration", `${Number(timesheet.duration || 0).toFixed(2)} hours`],
  ];

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
              Timesheet review
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Submission details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close details"
          >
            <X size={19} />
          </button>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Work Summary
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {timesheet.description || "No description provided."}
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ comment, saving, onChange, onClose, onSubmit }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-rose-600">
              Return for revision
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Reason for rejection
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close rejection modal"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-7">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Reason for rejection
            </span>
            <textarea
              autoFocus
              required
              minLength={2}
              value={comment}
              onChange={(event) => onChange(event.target.value)}
              className="min-h-32 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              placeholder="Explain what needs to be corrected..."
            />
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !comment.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {saving && <Loader inline />}Reject Timesheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagerApproval() {
  const [timesheets, setTimesheets] = useState([]);
  const [summary, setSummary] = useState({
    pendingApproval: 0,
    totalHoursPending: 0,
    approvedThisWeek: 0,
    rejectedThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [approveTarget, setApproveTarget] = useState(null);

  const loadPending = async () => {
    try {
      const response = await getPendingTimesheets();
      setTimesheets(response.data.timesheets || []);
      setSummary(
        response.data.summary || {
          pendingApproval: 0,
          totalHoursPending: 0,
          approvedThisWeek: 0,
          rejectedThisWeek: 0,
        },
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to load pending timesheets."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id) => {
    setApproveTarget(id);
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    const id = approveTarget;
    setActionId(id);
    try {
      await approveTimesheet(id);
      setSuccess("Timesheet approved successfully.");
      toast.success("Timesheet approved successfully.");
      setApproveTarget(null);
      await loadPending();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to approve timesheet."));
    } finally {
      setActionId(null);
    }
  };

  const openReject = (timesheet) => {
    setRejecting(timesheet);
    setComment("");
    setError("");
  };
  const handleReject = async (event) => {
    event.preventDefault();
    setActionId(rejecting._id);
    try {
      await rejectTimesheet(rejecting._id, comment);
      setRejecting(null);
      setSuccess("Timesheet rejected successfully.");
      toast.success("Timesheet rejected successfully.");
      await loadPending();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to reject timesheet."));
    } finally {
      setActionId(null);
    }
  };

  const cards = [
    ["Pending Approval", summary.pendingApproval, FileClock, "blue"],
    [
      "Total Hours Pending",
      `${Number(summary.totalHoursPending || 0).toFixed(2)}h`,
      Clock3,
      "indigo",
    ],
    ["Approved This Week", summary.approvedThisWeek, CheckCircle2, "emerald"],
    ["Rejected This Week", summary.rejectedThisWeek, XCircle, "rose"],
  ];
  const iconStyles = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm font-semibold text-blue-600">Team operations</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Timesheet Approvals
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review and approve your team's submitted timesheets.
        </p>
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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {value}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${iconStyles[tone]}`}>
                <Icon size={20} />
              </div>
            </div>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">Pending timesheets</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submissions from members of projects you manage.
            </p>
          </div>
          <FileCheck2 className="text-slate-300" size={22} />
        </div>
        {loading ? (
          <Loader />
        ) : timesheets.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <FileCheck2 size={23} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              No timesheets pending approval.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              New team submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-280 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Employee</th>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Task</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                  <th className="px-6 py-4 font-semibold">Submitted At</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timesheets.map((timesheet) => (
                  <tr key={timesheet._id} className="text-sm text-slate-600">
                    <td className="whitespace-nowrap px-6 py-5">
                      <p className="font-bold text-slate-900">
                        {timesheet.user?.name || "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {timesheet.user?.email || "-"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      {timesheet.project?.name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      {timesheet.task?.title || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      {formatDate(timesheet.date)}
                    </td>
                    <td className="max-w-48 truncate px-6 py-5">
                      {timesheet.description || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 font-semibold text-slate-800">
                      {Number(timesheet.duration || 0).toFixed(2)}h
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      {formatDateTime(
                        timesheet.submittedAt ||
                          timesheet.updatedAt ||
                          timesheet.createdAt,
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(timesheet)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                          aria-label="View timesheet"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={actionId === timesheet._id}
                          onClick={() => handleApprove(timesheet._id)}
                          className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                          aria-label="Approve timesheet"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={actionId === timesheet._id}
                          onClick={() => openReject(timesheet)}
                          className="rounded-lg p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                          aria-label="Reject timesheet"
                          title="Reject"
                        >
                          <XCircle size={16} />
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
      {viewing && (
        <DetailModal timesheet={viewing} onClose={() => setViewing(null)} />
      )}
      {rejecting && (
        <RejectModal
          comment={comment}
          saving={actionId === rejecting._id}
          onChange={setComment}
          onClose={() => setRejecting(null)}
          onSubmit={handleReject}
        />
      )}
      <ConfirmModal
        open={Boolean(approveTarget)}
        title="Approve timesheet?"
        message="Confirm that this submission accurately reflects the employee's work."
        confirmLabel="Approve"
        onCancel={() => setApproveTarget(null)}
        onConfirm={confirmApprove}
        busy={actionId === approveTarget}
      />
    </div>
  );
}
