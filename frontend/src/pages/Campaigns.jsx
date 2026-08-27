import { useEffect, useState } from "react";

import {
  Send,
  Plus,
  FileText,
  UsersRound,
  Mail,
  MousePointerClick,
  KeyRound,
  X,
  Play,
  Eye,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    templateId: "",
    groupId: "",
  });

  // ---------------------------------------------------------
  // LOAD CAMPAIGNS + TARGET GROUPS + TEMPLATES
  // ---------------------------------------------------------

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        campaignResponse,
        groupResponse,
        templateResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/campaigns`),
        fetch(`${API_URL}/api/target-groups`),
        fetch(`${API_URL}/api/templates`),
      ]);

      if (!campaignResponse.ok) {
        throw new Error("Failed to load campaigns");
      }

      if (!groupResponse.ok) {
        throw new Error("Failed to load target groups");
      }

      if (!templateResponse.ok) {
        throw new Error("Failed to load templates");
      }

      const campaignData = await campaignResponse.json();
      const groupData = await groupResponse.json();
      const templateData = await templateResponse.json();

      // Load statistics for every campaign
      const campaignsWithStats = await Promise.all(
        campaignData.map(async (campaign) => {
          try {
            const statsResponse = await fetch(
              `${API_URL}/api/campaigns/${campaign.id}/stats`
            );

            if (!statsResponse.ok) {
              return {
                ...campaign,
                stats: {
                  sent: 0,
                  opened: 0,
                  clicked: 0,
                  compromised: 0,
                },
              };
            }

            const stats = await statsResponse.json();

            return {
              ...campaign,
              stats,
            };
          } catch {
            return {
              ...campaign,
              stats: {
                sent: 0,
                opened: 0,
                clicked: 0,
                compromised: 0,
              },
            };
          }
        })
      );

      setCampaigns(campaignsWithStats);
      setGroups(groupData);
      setTemplates(templateData);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the PhishScale backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // FORM
  // ---------------------------------------------------------

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // ---------------------------------------------------------
  // CREATE CAMPAIGN
  // ---------------------------------------------------------

  async function createCampaign(e) {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.templateId ||
      !form.groupId
    ) {
      setError(
        "Campaign name, template and target group are required."
      );
      return;
    }

    const template = templates.find(
      (item) => item.id === Number(form.templateId)
    );

    if (!template) {
      setError("Selected template was not found.");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/campaigns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            template_name: template.name,
            group_id: Number(form.groupId),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to create campaign"
        );
      }

      setForm({
        name: "",
        templateId: "",
        groupId: "",
      });

      setShowModal(false);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to create campaign"
      );
    }
  }

  // ---------------------------------------------------------
  // LAUNCH CAMPAIGN
  // ---------------------------------------------------------

  async function launchCampaign(id) {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/campaigns/${id}/launch`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to launch campaign"
        );
      }

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to launch campaign"
      );
    }
  }

  // ---------------------------------------------------------
  // GET TARGETS FOR CAMPAIGN
  // ---------------------------------------------------------

  async function getCampaignTargets(campaign) {
    const response = await fetch(
      `${API_URL}/api/target-groups/${campaign.group_id}/targets`
    );

    if (!response.ok) {
      throw new Error("Failed to load campaign targets");
    }

    return await response.json();
  }

  // ---------------------------------------------------------
  // RECORD CAMPAIGN EVENT
  // ---------------------------------------------------------

  async function recordEvent(campaign, eventType) {
    try {
      setError("");

      if (campaign.status !== "Active") {
        setError("Launch the campaign before recording events.");
        return;
      }

      const targets = await getCampaignTargets(campaign);

      if (!targets.length) {
        setError(
          "This campaign has no targets. Add targets to the group first."
        );
        return;
      }

      const stats = campaign.stats || {
        opened: 0,
        clicked: 0,
        compromised: 0,
      };

      let index = 0;

      if (eventType === "opened") {
        index = stats.opened || 0;
      }

      if (eventType === "clicked") {
        index = stats.clicked || 0;
      }

      if (eventType === "submitted") {
        index = stats.compromised || 0;
      }

      // Keep index inside available target range
      if (index >= targets.length) {
        index = targets.length - 1;
      }

      const target = targets[index];

      const response = await fetch(
        `${API_URL}/api/campaigns/${campaign.id}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_id: target.id,
            event_type: eventType,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to record simulation event"
        );
      }

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to record simulation event"
      );
    }
  }

  // ---------------------------------------------------------
  // SIMULATION ACTIONS
  // ---------------------------------------------------------

  function simulateOpen(campaign) {
    recordEvent(campaign, "opened");
  }

  function simulateClick(campaign) {
    recordEvent(campaign, "clicked");
  }

  function simulateCompromise(campaign) {
    recordEvent(campaign, "submitted");
  }

  // ---------------------------------------------------------
  // FIND GROUP NAME
  // ---------------------------------------------------------

  function getGroupName(groupId) {
    const group = groups.find(
      (item) => item.id === groupId
    );

    return group?.name || "Unknown Group";
  }

  // ---------------------------------------------------------
  // FIND TEMPLATE NAME
  // ---------------------------------------------------------

  function getTemplateName(templateName) {
    return templateName || "Unknown Template";
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-7 py-7">
        <div className="flex items-start justify-between">

          <div>
            <p className="text-[11px] font-semibold tracking-[2px] text-indigo-600 uppercase">
              Phase 2 · Phishing Engine
            </p>

            <h1 className="text-3xl font-bold text-slate-950 mt-2">
              Campaigns
            </h1>

            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Launch safe phishing simulations. Each recipient
              receives a unique simulation tracking ID.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Plus size={17} />
            New Campaign
          </button>

        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-7 mt-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Campaign list */}
      <main className="p-7">

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading campaigns...
            </p>
          </div>

        ) : campaigns.length === 0 ? (

          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-14 text-center">

            <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Send size={22} />
            </div>

            <h2 className="font-semibold text-slate-950 mt-4">
              No campaigns yet
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Create your first campaign using a target group
              and simulation template.
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="mt-5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Create Campaign
            </button>

          </div>

        ) : (

          <div className="space-y-4">

            {campaigns.map((campaign) => {

              const stats = campaign.stats || {
                sent: 0,
                opened: 0,
                clicked: 0,
                compromised: 0,
              };

              return (
                <div
                  key={campaign.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-5"
                >

                  {/* Campaign top */}
                  <div className="flex items-start justify-between">

                    <div>

                      <div className="flex items-center gap-2">

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                            campaign.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {campaign.status}
                        </span>

                      </div>

                      <h2 className="text-lg font-semibold text-slate-950 mt-3">
                        {campaign.name}
                      </h2>

                      <div className="flex items-center gap-5 mt-2 text-sm text-slate-500">

                        <span className="flex items-center gap-1.5">
                          <FileText size={14} />
                          {getTemplateName(
                            campaign.template_name
                          )}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <UsersRound size={14} />
                          {getGroupName(campaign.group_id)}
                        </span>

                      </div>

                    </div>

                    <div className="flex gap-2">

                      {campaign.status === "Draft" && (
                        <button
                          onClick={() =>
                            launchCampaign(campaign.id)
                          }
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                        >
                          <Play size={14} />
                          Launch
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setSelectedCampaign(campaign)
                        }
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
                      >
                        <Eye size={14} />
                        Details
                      </button>

                    </div>

                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 mt-5 pt-5">

                    <Stat
                      icon={Send}
                      value={stats.sent}
                      label="Sent"
                    />

                    <Stat
                      icon={Mail}
                      value={stats.opened}
                      label="Opened"
                    />

                    <Stat
                      icon={MousePointerClick}
                      value={stats.clicked}
                      label="Clicked"
                    />

                    <Stat
                      icon={KeyRound}
                      value={stats.compromised}
                      label="Compromised"
                    />

                  </div>

                  {/* Simulation controls */}
                  {campaign.status === "Active" && (
                    <div className="mt-5 pt-4 border-t border-slate-100">

                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Demo Simulation Controls
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">

                        <button
                          onClick={() =>
                            simulateOpen(campaign)
                          }
                          className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100"
                        >
                          Simulate Open
                        </button>

                        <button
                          onClick={() =>
                            simulateClick(campaign)
                          }
                          className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100"
                        >
                          Simulate Click
                        </button>

                        <button
                          onClick={() =>
                            simulateCompromise(campaign)
                          }
                          className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100"
                        >
                          Simulate Submission
                        </button>

                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </main>

      {/* New Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">

              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Create Campaign
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Connect a target group with a simulation
                  template.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={19} />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={createCampaign}
              className="p-6"
            >

              {/* Campaign name */}
              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Campaign Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Q3 Security Awareness Test"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

              </div>

              {/* Template */}
              <div className="mt-4">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Simulation Template
                </label>

                <select
                  name="templateId"
                  value={form.templateId}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >

                  <option value="">
                    Select a template
                  </option>

                  {templates.map((template) => (
                    <option
                      key={template.id}
                      value={template.id}
                    >
                      {template.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* Target group */}
              <div className="mt-4">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Group
                </label>

                <select
                  name="groupId"
                  value={form.groupId}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >

                  <option value="">
                    Select a target group
                  </option>

                  {groups.map((group) => (
                    <option
                      key={group.id}
                      value={group.id}
                    >
                      {group.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* Info */}
              <div className="mt-5 bg-indigo-50 border border-indigo-100 rounded-xl p-4">

                <div className="flex gap-3">

                  <Send
                    size={17}
                    className="text-indigo-600 mt-0.5"
                  />

                  <div>

                    <p className="text-sm font-semibold text-indigo-900">
                      Safe Simulation
                    </p>

                    <p className="text-xs text-indigo-700 leading-5 mt-1">
                      This campaign records simulation events
                      only. No real credentials are collected or
                      stored.
                    </p>

                  </div>

                </div>

              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-6">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                  Create Campaign
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">

              <h2 className="text-lg font-bold text-slate-950">
                Campaign Details
              </h2>

              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={19} />
              </button>

            </div>

            <div className="p-6">

              <h3 className="font-semibold text-slate-950">
                {selectedCampaign.name}
              </h3>

              <div className="mt-5 space-y-3 text-sm">

                <Detail
                  label="Status"
                  value={selectedCampaign.status}
                />

                <Detail
                  label="Template"
                  value={getTemplateName(
                    selectedCampaign.template_name
                  )}
                />

                <Detail
                  label="Target Group"
                  value={getGroupName(
                    selectedCampaign.group_id
                  )}
                />

                <Detail
                  label="Sent"
                  value={
                    selectedCampaign.stats?.sent || 0
                  }
                />

                <Detail
                  label="Opened"
                  value={
                    selectedCampaign.stats?.opened || 0
                  }
                />

                <Detail
                  label="Clicked"
                  value={
                    selectedCampaign.stats?.clicked || 0
                  }
                />

                <Detail
                  label="Compromised"
                  value={
                    selectedCampaign.stats?.compromised || 0
                  }
                />

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// ---------------------------------------------------------
// STAT COMPONENT
// ---------------------------------------------------------

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3">

      <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
        <Icon size={17} />
      </div>

      <div>

        <div className="text-lg font-bold text-slate-950">
          {value}
        </div>

        <div className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </div>

      </div>

    </div>
  );
}

// ---------------------------------------------------------
// DETAIL COMPONENT
// ---------------------------------------------------------

function Detail({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-medium text-slate-900">
        {value}
      </span>

    </div>
  );
}

export default Campaigns;