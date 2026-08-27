import { useEffect, useState } from "react";

import {
  BarChart3,
  Mail,
  MousePointerClick,
  KeyRound,
  Send,
  ShieldAlert,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


function Analytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState(1);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


 // --------------------------------------------------
// FETCH CAMPAIGNS
// --------------------------------------------------

useEffect(() => {
  async function fetchCampaigns() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/campaigns"
      );

      if (!response.ok) {
        throw new Error("Failed to load campaigns");
      }

      const data = await response.json();

      setCampaigns(data);

      // Select the first campaign if none is selected
      if (data.length > 0) {
        setCampaignId((currentId) => {
          const exists = data.some(
            (campaign) => campaign.id === currentId
          );

          return exists ? currentId : data[0].id;
        });
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load campaigns.");
    }
  }

  fetchCampaigns();
}, []);


// --------------------------------------------------
// FETCH ANALYTICS
// --------------------------------------------------

useEffect(() => {
  if (!campaignId) return;

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/analytics/${campaignId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load analytics");
      }

      const data = await response.json();

      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load analytics. Make sure the backend is running."
      );
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }

  fetchAnalytics();
}, [campaignId]);


  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900">
            Loading analytics...
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Fetching data from PostgreSQL
          </p>
        </div>
      </div>
    );
  }


  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center max-w-md">
          <ShieldAlert
            size={30}
            className="text-red-500 mx-auto"
          />

          <h2 className="font-semibold text-slate-900 mt-3">
            Analytics unavailable
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            {error || "No analytics data found."}
          </p>
        </div>
      </div>
    );
  }


  // --------------------------------------------------
  // REAL DATABASE DATA
  // --------------------------------------------------

  const campaign = analytics.campaign;
  const stats = analytics.stats;
  const departmentData = analytics.department_risk || [];


  // --------------------------------------------------
  // CALCULATE RATES
  // --------------------------------------------------

  const openRate =
    stats.sent > 0
      ? Math.round((stats.opened / stats.sent) * 100)
      : 0;

  const clickRate =
    stats.sent > 0
      ? Math.round((stats.clicked / stats.sent) * 100)
      : 0;

  const compromiseRate =
    stats.sent > 0
      ? Math.round((stats.submitted / stats.sent) * 100)
      : 0;


  // --------------------------------------------------
  // EVENT CHART DATA
  // --------------------------------------------------

  const eventData = [
    {
      name: "Opened",
      value: stats.opened,
    },
    {
      name: "Clicked",
      value: stats.clicked,
    },
    {
      name: "Submitted",
      value: stats.submitted,
    },
  ];


  // --------------------------------------------------
  // HIGHEST RISK DEPARTMENT
  // --------------------------------------------------

  const highestRiskDepartment =
    departmentData.length > 0
      ? departmentData.reduce((highest, current) =>
          current.risk > highest.risk ? current : highest
        )
      : null;


  // --------------------------------------------------
  // TRAINING NEEDED
  // --------------------------------------------------

  const trainingNeeded = stats.submitted;


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">

      {/* --------------------------------------------- */}
      {/* HEADER */}
      {/* --------------------------------------------- */}

      <header className="bg-white border-b border-slate-200 px-7 py-7">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-[11px] font-semibold tracking-[2px] text-indigo-600 uppercase">
              Phase 4 · Analytics
            </p>

            <h1 className="text-3xl font-bold text-slate-950 mt-2">
              Analytics & Reporting
            </h1>

            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Real-time breakdown of open, click, and compromise
              rates — including department-level risk analysis.
            </p>

          </div>


          {/* Campaign selector */}
          <select
  value={campaignId}
  onChange={(e) => setCampaignId(Number(e.target.value))}
  className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 outline-none cursor-pointer"
>
  {campaigns.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
  ))}
</select>

        </div>

      </header>


      <main className="p-7">

        {/* --------------------------------------------- */}
        {/* OVERVIEW CARDS */}
        {/* --------------------------------------------- */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <MetricCard
            icon={Send}
            title="Emails Sent"
            value={stats.sent}
            description="Simulation recipients"
            iconStyle="bg-slate-50 text-slate-600"
          />


          <MetricCard
            icon={Mail}
            title="Open Rate"
            value={`${openRate}%`}
            description={`${stats.opened} recipients opened`}
            iconStyle="bg-blue-50 text-blue-600"
          />


          <MetricCard
            icon={MousePointerClick}
            title="Click Rate"
            value={`${clickRate}%`}
            description={`${stats.clicked} recipients clicked`}
            iconStyle="bg-amber-50 text-amber-600"
          />


          <MetricCard
            icon={KeyRound}
            title="Compromise Rate"
            value={`${compromiseRate}%`}
            description={`${stats.submitted} simulated submissions`}
            iconStyle="bg-red-50 text-red-600"
          />

        </div>


        {/* --------------------------------------------- */}
        {/* CHARTS */}
        {/* --------------------------------------------- */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">


          {/* EVENT CHART */}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">

            <div className="flex items-start justify-between">

              <div>

                <h2 className="font-semibold text-slate-950">
                  Campaign Engagement
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Recipient interaction throughout the simulation.
                </p>

              </div>


              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">

                <BarChart3 size={18} />

              </div>

            </div>


            <div className="h-[280px] mt-6">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart data={eventData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* DEPARTMENT RISK */}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">

            <div className="flex items-start justify-between">

              <div>

                <h2 className="font-semibold text-slate-950">
                  Department Risk
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Percentage of simulated targets requiring
                  additional awareness training.
                </p>

              </div>


              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">

                <ShieldAlert size={18} />

              </div>

            </div>


            <div className="mt-6 space-y-5">

              {departmentData.length === 0 ? (

                <p className="text-sm text-slate-500">
                  No department risk data available.
                </p>

              ) : (

                departmentData.map((item) => (

                  <div key={item.department}>

                    <div className="flex justify-between text-sm mb-2">

                      <span className="font-medium text-slate-700">
                        {item.department}
                      </span>

                      <span className="font-semibold text-slate-900">
                        {item.risk}%
                      </span>

                    </div>


                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{
                          width: `${Math.min(item.risk, 100)}%`,
                        }}
                      />

                    </div>

                  </div>

                ))

              )}

            </div>

          </div>

        </div>


        {/* --------------------------------------------- */}
        {/* SUMMARY */}
        {/* --------------------------------------------- */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">


          {/* HIGHEST RISK */}

          <SummaryCard
            icon={TrendingUp}
            title="Highest Risk"
            value={
              highestRiskDepartment
                ? highestRiskDepartment.department
                : "None"
            }
            description={
              highestRiskDepartment
                ? `${highestRiskDepartment.risk}% interaction risk`
                : "No risk data available"
            }
          />


          {/* TARGETS TESTED */}

          <SummaryCard
            icon={UsersRound}
            title="Targets Tested"
            value={stats.sent}
            description="Across the selected campaign"
          />


          {/* TRAINING NEEDED */}

          <SummaryCard
            icon={ShieldAlert}
            title="Training Needed"
            value={trainingNeeded}
            description="Recipients who submitted simulated data"
          />

        </div>


        {/* --------------------------------------------- */}
        {/* SECURITY INSIGHT */}
        {/* --------------------------------------------- */}

        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-5">

          <div className="flex items-start gap-4">

            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">

              <ShieldAlert size={19} />

            </div>


            <div>

              <h2 className="font-semibold text-slate-950">
                Security Awareness Insight
              </h2>


              <p className="text-sm text-slate-600 leading-6 mt-2">

                The selected simulation recorded a{" "}

                <span className="font-semibold text-slate-900">
                  {clickRate}% click rate
                </span>

                {" "}and a{" "}

                <span className="font-semibold text-slate-900">
                  {compromiseRate}% simulated submission rate
                </span>

                . Consider targeted awareness training for
                departments with elevated interaction rates.

              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}


// ==================================================
// METRIC CARD
// ==================================================

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
  iconStyle,
}) {

  return (

    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">

      <div className="flex items-start justify-between">

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconStyle}`}
        >
          <Icon size={18} />
        </div>


        <BarChart3
          size={16}
          className="text-slate-300"
        />

      </div>


      <div className="text-3xl font-bold text-slate-950 mt-4">
        {value}
      </div>


      <div className="text-sm font-medium text-slate-700 mt-1">
        {title}
      </div>


      <div className="text-xs text-slate-400 mt-1">
        {description}
      </div>

    </div>
  );
}


// ==================================================
// SUMMARY CARD
// ==================================================

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
}) {

  return (

    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex items-center gap-4">

      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">

        <Icon size={19} />

      </div>


      <div>

        <p className="text-xs text-slate-500">
          {title}
        </p>


        <p className="text-lg font-bold text-slate-950 mt-0.5">
          {value}
        </p>


        <p className="text-xs text-slate-400 mt-0.5">
          {description}
        </p>

      </div>

    </div>
  );
}


export default Analytics;