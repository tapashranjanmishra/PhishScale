import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  X,
  Trash2,
  Mail,
  Tag,
} from "lucide-react";

import API_URL from "../api";

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    subject: "",
    sender: "",
    body: "",
  });

  // ==================================================
  // LOAD TEMPLATES FROM BACKEND
  // ==================================================

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/templates`);

      if (!response.ok) {
        throw new Error("Failed to load templates");
      }

      const data = await response.json();

      setTemplates(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load templates from the server.");
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // FORM HANDLING
  // ==================================================

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // ==================================================
  // CREATE TEMPLATE
  // ==================================================

  async function createTemplate(e) {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      !form.subject.trim() ||
      !form.sender.trim() ||
      !form.body.trim()
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/api/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          subject: form.subject,
          sender: form.sender,
          provider: "Custom",
          body: form.body,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to create template"
        );
      }

      const newTemplate = await response.json();

      setTemplates((current) => [...current, newTemplate]);

      setForm({
        name: "",
        category: "",
        subject: "",
        sender: "",
        body: "",
      });

      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to create template.");
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // DELETE TEMPLATE
  // ==================================================

  async function deleteTemplate(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this template?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/templates/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Failed to delete template"
        );
      }

      setTemplates((current) =>
        current.filter((template) => template.id !== id)
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to delete template.");
    }
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-7 py-7">
        <div className="flex items-start justify-between">

          <div>
            <p className="text-[11px] font-semibold tracking-[2px] text-indigo-600 uppercase">
              Pretext Library
            </p>

            <h1 className="text-3xl font-bold text-slate-950 mt-2">
              Templates
            </h1>

            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Pre-built phishing-awareness scenarios with dynamic
              placeholders. Each becomes the bait for a campaign.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <Plus size={17} />
            New Template
          </button>

        </div>
      </header>

      {/* Content */}
      <main className="p-7">

        {/* Error */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
            <div className="text-sm text-slate-500">
              Loading templates...
            </div>
          </div>
        ) : templates.length === 0 ? (

          /* Empty state */
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-14 text-center">

            <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={22} />
            </div>

            <h2 className="font-semibold text-slate-950 mt-4">
              No templates yet
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Create a template to use in your simulations.
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="mt-5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Create Template
            </button>

          </div>

        ) : (

          /* Template cards */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">

            {templates.map((template) => (

              <div
                key={template.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >

                {/* Card top */}
                <div className="p-5">

                  <div className="flex items-center justify-between">

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 text-[11px] font-medium">
                      <Tag size={11} />
                      {template.category}
                    </span>

                    <button
                      onClick={() =>
                        deleteTemplate(template.id)
                      }
                      className="text-slate-400 hover:text-red-500 transition"
                      title="Delete template"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                  <h2 className="text-base font-semibold text-slate-950 mt-4">
                    {template.name}
                  </h2>

                  <p className="text-sm font-medium text-slate-700 mt-2">
                    {template.subject}
                  </p>

                  <p className="text-xs text-slate-500 leading-5 mt-2 line-clamp-3">
                    {template.body}
                  </p>

                </div>

                {/* Card footer */}
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">

                  <span className="text-xs text-slate-500">
                    From:{" "}
                    <span className="text-slate-700">
                      {template.sender}
                    </span>
                  </span>

                  <span className="text-xs text-slate-400">
                    {template.provider}
                  </span>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

      {/* Create Template Modal */}
      {showModal && (

        <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50 overflow-y-auto">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">

              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Create Template
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Create a safe phishing-awareness simulation
                  scenario.
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
              onSubmit={createTemplate}
              className="p-6"
            >

              {/* Name + Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Template Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. IT Security Alert"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="">
                      Select category
                    </option>

                    <option value="Password Expiry">
                      Password Expiry
                    </option>

                    <option value="HR Policy">
                      HR Policy
                    </option>

                    <option value="Delivery">
                      Delivery
                    </option>

                    <option value="Finance">
                      Finance
                    </option>

                    <option value="IT Security">
                      IT Security
                    </option>

                    <option value="Custom">
                      Custom
                    </option>

                  </select>
                </div>

              </div>

              {/* Subject */}
              <div className="mt-4">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Subject
                </label>

                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Important security notification"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

              </div>

              {/* Sender */}
              <div className="mt-4">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sender Name
                </label>

                <input
                  type="text"
                  name="sender"
                  value={form.sender}
                  onChange={handleChange}
                  placeholder="e.g. IT Support Team"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

              </div>

              {/* Body */}
              <div className="mt-4">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Body
                </label>

                <textarea
                  name="body"
                  value={form.body}
                  onChange={handleChange}
                  rows={9}
                  placeholder={`Hello {first_name},

Please review this important notification.

Click here: {tracking_url}`}
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3">

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Mail size={14} />
                    Available placeholders
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">

                    <code className="px-2 py-1 rounded bg-white border border-slate-200 text-xs text-indigo-600">
                      {"{first_name}"}
                    </code>

                    <code className="px-2 py-1 rounded bg-white border border-slate-200 text-xs text-indigo-600">
                      {"{department}"}
                    </code>

                    <code className="px-2 py-1 rounded bg-white border border-slate-200 text-xs text-indigo-600">
                      {"{tracking_url}"}
                    </code>

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
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Creating..." : "Create Template"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Templates;