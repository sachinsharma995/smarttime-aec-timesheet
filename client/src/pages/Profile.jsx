import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "-";

export default function Profile() {
  const { user } = useAuth();
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <p className="text-sm font-semibold text-blue-600">Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your SmartTime workspace identity.
        </p>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="bg-slate-950 px-6 py-8 sm:px-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500 text-2xl font-bold text-white shadow-lg shadow-blue-950/40">
              {initials || "ST"}
            </div>
            <div className="text-white">
              <p className="text-2xl font-bold tracking-tight">
                {user?.name || "SmartTime user"}
              </p>
              <p className="mt-1 text-sm capitalize text-slate-400">
                {user?.role || "employee"} account
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <Mail size={15} /> Email
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {user?.email || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <ShieldCheck size={15} /> Role
            </div>
            <p className="mt-3 text-sm font-semibold capitalize text-slate-800">
              {user?.role || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <CalendarDays size={15} /> Account created
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {formatDate(user?.createdAt)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <UserRound size={15} /> Workspace access
            </div>
            <p className="mt-3 text-sm font-semibold text-emerald-600">
              Active
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
