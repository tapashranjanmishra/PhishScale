import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  MousePointerClick,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function Simulation() {
  const { campaignId, targetId } = useParams();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // RECORD OPEN EVENT
  // ---------------------------------------------------------

  async function recordOpen() {
    try {
      await fetch(
        `${API_URL}/api/tracking/open/${campaignId}/${targetId}`
      );
    } catch (err) {
      console.error("Open tracking failed:", err);
    }
  }

  // ---------------------------------------------------------
  // RECORD CLICK EVENT
  // ---------------------------------------------------------

  async function handleClick() {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/tracking/click/${campaignId}/${targetId}`
      );

      if (!response.ok) {
        throw new Error("Unable to record click event");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to record this simulation event.");
    }
  }

  // ---------------------------------------------------------
  // RECORD SUBMISSION EVENT
  // ---------------------------------------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/tracking/submit/${campaignId}/${targetId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to record submission event");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Unable to record this simulation event.");
    } finally {
      setLoading(false);
    }
  }

  // Record open when page is loaded
  useState(() => {
    recordOpen();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

      <div className="w-full max-w-lg">

        {/* Security Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          <div className="bg-indigo-600 px-6 py-5 text-white">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h1 className="font-bold text-lg">
                  PhishScale Security Simulation
                </h1>

                <p className="text-indigo-100 text-xs mt-1">
                  Security awareness training environment
                </p>
              </div>

            </div>

          </div>

          {!submitted ? (

            <div className="p-7">

              {/* Simulation Notice */}
              <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">

                <AlertTriangle
                  size={19}
                  className="text-amber-600 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    This is a simulated security exercise
                  </p>

                  <p className="text-xs text-amber-700 leading-5 mt-1">
                    This page is part of an authorized security
                    awareness simulation. Do not enter real
                    passwords or sensitive information.
                  </p>
                </div>

              </div>

              {/* Fake Email */}
              <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">

                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">

                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-slate-500" />

                    <span className="text-sm font-semibold text-slate-800">
                      Security Notification
                    </span>
                  </div>

                </div>

                <div className="p-5">

                  <p className="text-xs text-slate-500">
                    Subject
                  </p>

                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    Action Required: Your password expires in 24 hours
                  </p>

                  <div className="border-t border-slate-100 my-5" />

                  <p className="text-sm text-slate-700 leading-6">
                    Your account password is scheduled to expire.
                    Please review your account security settings
                    to avoid interruption.
                  </p>

                  <button
                    type="button"
                    onClick={handleClick}
                    className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    <MousePointerClick size={16} />
                    Review Account
                  </button>

                </div>

              </div>

              {/* Simulated Form */}
              <form
                onSubmit={handleSubmit}
                className="mt-6"
              >

                <h2 className="text-base font-semibold text-slate-900">
                  Security Verification
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  This form is simulated. Never enter your real
                  credentials.
                </p>

                <div className="mt-4">

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Simulation Username
                  </label>

                  <input
                    type="text"
                    placeholder="demo-user"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />

                </div>

                <div className="mt-4">

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Simulation Password
                  </label>

                  <input
                    type="password"
                    placeholder="Never enter a real password"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />

                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium"
                >
                  {loading
                    ? "Recording simulation..."
                    : "Continue Simulation"}
                </button>

              </form>

            </div>

          ) : (

            /* Training Result */
            <div className="p-8 text-center">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>

              <h2 className="text-xl font-bold text-slate-950 mt-5">
                Simulation Complete
              </h2>

              <p className="text-sm text-slate-500 mt-2 leading-6">
                This was a simulated phishing exercise.
                No credentials were collected or stored.
              </p>

              <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-5 text-left">

                <p className="text-sm font-semibold text-indigo-900">
                  What to look for next time
                </p>

                <ul className="mt-3 space-y-2 text-xs text-indigo-800">

                  <li>
                    • Verify the sender before clicking links.
                  </li>

                  <li>
                    • Be cautious of urgent password requests.
                  </li>

                  <li>
                    • Check links before opening them.
                  </li>

                  <li>
                    • Never enter credentials into suspicious pages.
                  </li>

                </ul>

              </div>

              <button
                onClick={() => navigate("/")}
                className="mt-6 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                Return to Dashboard
              </button>

            </div>

          )}

        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          PhishScale · Authorized Security Awareness Simulation
        </p>

      </div>

    </div>
  );
}

export default Simulation;