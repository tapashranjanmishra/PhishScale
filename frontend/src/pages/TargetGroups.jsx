import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UsersRound,
  Plus,
  Trash2,
  Building2,
  ChevronRight,
  X,
} from "lucide-react";


const API_URL = "http://127.0.0.1:8000";


function TargetGroups() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    department: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  // ----------------------------------------
  // Load target groups from FastAPI
  // ----------------------------------------

  async function loadGroups() {
  try {
    setLoading(true);
    setError("");

    const response = await fetch(
      `${API_URL}/api/target-groups`
    );

    if (!response.ok) {
      throw new Error("Failed to load target groups");
    }

    const data = await response.json();

    // Get target count for every group
    const formattedGroups = await Promise.all(
      data.map(async (group) => {
        try {
          const targetsResponse = await fetch(
            `${API_URL}/api/target-groups/${group.id}/targets`
          );

          if (!targetsResponse.ok) {
            return {
              ...group,
              targets: 0,
            };
          }

          const targets = await targetsResponse.json();

          return {
            ...group,
            targets: targets.length,
          };
        } catch (error) {
          console.error(
            `Failed to load targets for group ${group.id}`,
            error
          );

          return {
            ...group,
            targets: 0,
          };
        }
      })
    );

    setGroups(formattedGroups);
  } catch (err) {
    console.error(err);

    setError(
      "Unable to connect to the PhishScale backend."
    );
  } finally {
    setLoading(false);
  }
}


  // Load groups when page opens
  useEffect(() => {
    loadGroups();
  }, []);


  // ----------------------------------------
  // Form handling
  // ----------------------------------------

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }


  // ----------------------------------------
  // Create group
  // ----------------------------------------

  async function createGroup(e) {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.department.trim()
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/target-groups`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: form.name.trim(),
            department: form.department.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create target group");
      }

      const createdGroup = await response.json();

      setGroups((currentGroups) => [
        {
          ...createdGroup,
          targets: 0,
        },
        ...currentGroups,
      ]);

      setForm({
        name: "",
        department: "",
      });

      setShowModal(false);

    } catch (err) {
      console.error(err);

      setError(
        "Unable to create the target group."
      );
    } finally {
      setSaving(false);
    }
  }


  // ----------------------------------------
  // Delete group
  // ----------------------------------------

  async function deleteGroup(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this target group?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/target-groups/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete target group");
      }

      setGroups((currentGroups) =>
        currentGroups.filter(
          (group) => group.id !== id
        )
      );

    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete the target group."
      );
    }
  }


  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}

      <header className="bg-white border-b border-slate-200 px-7 py-7">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-[11px] font-semibold tracking-[2px] text-indigo-600 uppercase">
              Phase 1 · Target Management
            </p>

            <h1 className="text-3xl font-bold text-slate-950 mt-2">
              Target Groups
            </h1>

            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Upload lists of employees and organize them
              into groups. These are the people you'll test.
            </p>

          </div>


          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <Plus size={17} />
            New Group
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

            <div className="w-10 h-10 mx-auto border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />

            <p className="text-sm text-slate-500 mt-4">
              Loading target groups...
            </p>

          </div>

        ) : groups.length === 0 ? (

          /* Empty state */

          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-14 text-center">

            <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">

              <UsersRound size={22} />

            </div>

            <h2 className="font-semibold text-slate-950 mt-4">
              No target groups yet
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Create your first group to start adding
              simulation targets.
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="mt-5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Create Group
            </button>

          </div>

        ) : (

          /* Groups */

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {groups.map((group) => (

              <div
                key={group.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >

                <div className="flex items-start justify-between">

                  <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">

                    <UsersRound size={18} />

                  </div>


                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="text-slate-400 hover:text-red-500 transition"
                    title="Delete group"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>


                <h2 className="font-semibold text-slate-950 mt-4">
                  {group.name}
                </h2>


                <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">

                  <Building2 size={15} />

                  {group.department}

                </div>


                <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">

                  <span className="text-sm text-slate-500">

                    <span className="font-semibold text-slate-900">
                      {group.targets}
                    </span>{" "}

                    targets

                  </span>


                  <button
                    onClick={() =>
                      navigate(
                        `/target-groups/${group.id}`
                      )
                    }
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >

                    Manage

                    <ChevronRight size={15} />

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>


      {/* Create Group Modal */}

      {showModal && (

        <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            {/* Modal Header */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">

              <div>

                <h2 className="text-lg font-bold text-slate-950">
                  Create Target Group
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Organize simulation targets by department.
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
              onSubmit={createGroup}
              className="p-6"
            >

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Group Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Engineering Team"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

              </div>


              <div className="mt-4">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department
                </label>

                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="e.g. Engineering"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

              </div>


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
                  {saving
                    ? "Creating..."
                    : "Create Group"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default TargetGroups;