import {
  BarChart3,
  BriefcaseBusiness,
  CheckSquare2,
  ClipboardList,
  LayoutDashboard,
  UserRound,
  UsersRound,
  LogOut,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Timesheet", to: "/timesheet", icon: ClipboardList },
  { label: "Projects", to: "/projects", icon: BriefcaseBusiness },
  { label: "Tasks", to: "/tasks", icon: CheckSquare2 },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  {
    label: "Manager Approval",
    to: "/manager-approval",
    icon: UsersRound,
    managerOnly: true,
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleNavigation = navigation.filter(
    (item) => !item.managerOnly || user?.role === "manager",
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-200 lg:fixed lg:z-40 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-7">
          <div>
            <p className="text-xl font-bold tracking-tight">SmartTime</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">
              AEC Operations
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-7">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>
          {visibleNavigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <UserRound size={18} strokeWidth={1.8} />
            Profile
          </NavLink>
          <button
            type="button"
            onClick={async () => {
              try {
                await logout();
              } catch {
                toast.error("Unable to sign out. Please try again.");
              } finally {
                navigate("/login");
                onClose();
              }
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={18} strokeWidth={1.8} />
            Logout
          </button>
          <div className="mt-3 rounded-xl bg-white/5 p-4">
            <p className="text-xs font-semibold text-slate-300">
              SmartTime workspace
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Build clarity across every project hour.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
