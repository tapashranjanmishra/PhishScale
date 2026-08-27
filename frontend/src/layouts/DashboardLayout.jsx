import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  UsersRound,
  FileText,
  Send,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Target Groups",
    path: "/target-groups",
    icon: UsersRound,
  },
  {
    name: "Templates",
    path: "/templates",
    icon: FileText,
  },
  {
    name: "Campaigns",
    path: "/campaigns",
    icon: Send,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
];

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-[230px] bg-[#111625] text-white flex flex-col fixed left-0 top-0 bottom-0">
        {/* Logo */}
        <div className="h-[64px] border-b border-slate-700/70 flex items-center px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-indigo-500/50 bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck
                size={20}
                className="text-indigo-400"
              />
            </div>

            <div>
              <div className="font-bold text-[17px] leading-none">
                PhishScale
              </div>

              <div className="text-[9px] tracking-[2px] text-indigo-300 mt-1">
                SECURITY AWARENESS
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-sm transition-all duration-200
                    ${
                      isActive
                        ? "bg-indigo-500/15 border border-indigo-400/30 text-white font-semibold"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }
                    `
                  }
                >
                  <Icon size={18} strokeWidth={1.8} />

                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Safe Simulation Mode */}
        <div className="p-3">
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck
                size={15}
                className="text-emerald-400"
              />

              <span className="text-xs font-semibold text-white">
                Safe Simulation Mode
              </span>
            </div>

            <p className="text-[11px] leading-5 text-slate-400">
              All credential data from landing pages is discarded
              immediately — never stored.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[230px] flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;