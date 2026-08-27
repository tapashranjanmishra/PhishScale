import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UsersRound,
  Mail,
  FileText,
  ArrowRight,
  FilePlus2,
  Send,
  KeyRound,
  Sparkles,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const steps = [
  {
    number: "STEP 1",
    title: "Build target groups",
    description:
      "Import employee lists via CSV and organize by department.",
    icon: UsersRound,
  },
  {
    number: "STEP 2",
    title: "Prepare pretexts",
    description:
      "Choose or craft convincing email scenarios with placeholders.",
    icon: FilePlus2,
  },
  {
    number: "STEP 3",
    title: "Launch a campaign",
    description:
      "Send tracked phishing simulations — each with a unique ID.",
    icon: Send,
  },
  {
    number: "STEP 4",
    title: "Review results",
    description:
      "See open, click, and compromise rates in real time.",
    icon: KeyRound,
  },
];

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState([
    {
      title: "Target Groups",
      value: 0,
      icon: UsersRound,
      iconStyle: "bg-violet-50 text-violet-600",
    },
    {
      title: "Tracked Targets",
      value: 0,
      icon: Mail,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      title: "Pretext Templates",
      value: 0,
      icon: FileText,
      iconStyle: "bg-amber-50 text-amber-600",
    },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        setLoading(true);

        // Get target groups
        const groupsResponse = await fetch(
          `${API_BASE}/api/target-groups`
        );

        if (!groupsResponse.ok) {
          throw new Error("Failed to fetch target groups");
        }

        const groups = await groupsResponse.json();

        // Get templates
        const templatesResponse = await fetch(
          `${API_BASE}/api/templates`
        );

        if (!templatesResponse.ok) {
          throw new Error("Failed to fetch templates");
        }

        const templates = await templatesResponse.json();

        // Get targets from every target group
        let totalTargets = 0;

        if (Array.isArray(groups)) {
          const targetRequests = groups.map(async (group) => {
            try {
              const response = await fetch(
                `${API_BASE}/api/target-groups/${group.id}/targets`
              );

              if (!response.ok) {
                return [];
              }

              return await response.json();
            } catch {
              return [];
            }
          });

          const targetsByGroup = await Promise.all(targetRequests);

          targetsByGroup.forEach((targets) => {
            if (Array.isArray(targets)) {
              totalTargets += targets.length;
            }
          });
        }

        setStats([
          {
            title: "Target Groups",
            value: Array.isArray(groups) ? groups.length : 0,
            icon: UsersRound,
            iconStyle: "bg-violet-50 text-violet-600",
          },
          {
            title: "Tracked Targets",
            value: totalTargets,
            icon: Mail,
            iconStyle: "bg-blue-50 text-blue-600",
          },
          {
            title: "Pretext Templates",
            value: Array.isArray(templates) ? templates.length : 0,
            icon: FileText,
            iconStyle: "bg-amber-50 text-amber-600",
          },
        ]);
      } catch (error) {
        console.error("Dashboard loading error:", error);

        setStats([
          {
            title: "Target Groups",
            value: 0,
            icon: UsersRound,
            iconStyle: "bg-violet-50 text-violet-600",
          },
          {
            title: "Tracked Targets",
            value: 0,
            icon: Mail,
            iconStyle: "bg-blue-50 text-blue-600",
          },
          {
            title: "Pretext Templates",
            value: 0,
            icon: FileText,
            iconStyle: "bg-amber-50 text-amber-600",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-7 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[2px] text-indigo-600 uppercase">
              Security Console
            </p>

            <h1 className="text-3xl font-bold text-slate-950 mt-2">
              Welcome back
            </h1>

            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Launch safe, simulated phishing attacks against your
              workforce and turn every click into a teachable moment.
            </p>
          </div>

          {/* Simulation badge */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
            <ShieldIcon />
            Simulation Mode
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-7">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconStyle}`}
                  >
                    <Icon size={18} />
                  </div>

                  <ArrowRight
                    size={17}
                    className="text-slate-500"
                  />
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-bold text-slate-950">
                    {loading ? "..." : stat.value}
                  </div>

                  <div className="text-xs text-slate-500 mt-1">
                    {stat.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-950">
            How PhishScale works
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Four phases, from targets to teachable moments.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon size={18} />
                    </div>

                    <span className="text-[10px] tracking-wider text-indigo-600 font-semibold">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-950 mt-4">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-500 leading-6 mt-2">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-7 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sparkles size={19} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  Ready to send the bait?
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Import your first employee list, pick a pretext,
                  and PhishScale will generate a unique tracking ID
                  for every recipient.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/templates")}
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Browse templates
              </button>

              <button
                onClick={() => navigate("/target-groups")}
                className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                Add targets
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3l7 4v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V7l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export default Dashboard;