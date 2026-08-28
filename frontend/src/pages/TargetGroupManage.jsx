import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  UsersRound,
  UserPlus,
  Upload,
  Trash2,
  Mail,
  Building2,
  X,
} from "lucide-react";


import API_URL from "../api";

function TargetGroupManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);


  // --------------------------------------------------
  // State
  // --------------------------------------------------

  const [group, setGroup] = useState(null);
  const [targets, setTargets] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  // --------------------------------------------------
  // Load group + targets
  // --------------------------------------------------

  async function loadData() {
    try {
      setLoading(true);
      setError("");


      // ----------------------------------------------
      // Load target groups
      // ----------------------------------------------

      const groupsResponse = await fetch(
        `${API_URL}/api/target-groups`
      );

      if (!groupsResponse.ok) {
        throw new Error("Failed to load target groups");
      }

      const groups = await groupsResponse.json();

      const selectedGroup = groups.find(
        (item) => String(item.id) === String(id)
      );


      if (!selectedGroup) {
        throw new Error("Target group not found");
      }


      setGroup(selectedGroup);


      // ----------------------------------------------
      // Load targets
      // ----------------------------------------------

      const targetsResponse = await fetch(
        `${API_URL}/api/target-groups/${id}/targets`
      );

      if (!targetsResponse.ok) {
        throw new Error("Failed to load targets");
      }

      const targetsData = await targetsResponse.json();

      setTargets(targetsData);


    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to load target group."
      );

    } finally {
      setLoading(false);
    }
  }


  // Load data when page opens
  useEffect(() => {
    loadData();
  }, [id]);


  // --------------------------------------------------
  // Form handling
  // --------------------------------------------------

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }


  // --------------------------------------------------
  // Add Target
  // --------------------------------------------------

  async function addTarget(e) {
    e.preventDefault();


    if (
      !form.name.trim() ||
      !form.email.trim()
    ) {
      return;
    }


    try {
      setSaving(true);
      setError("");


      const response = await fetch(
        `${API_URL}/api/target-groups/${id}/targets`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            department: group.department,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to add target"
        );
      }


      // Add real database record to UI
      setTargets((currentTargets) => [
        ...currentTargets,
        data,
      ]);


      // Reset form
      setForm({
        name: "",
        email: "",
      });


      setShowModal(false);


    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to add target."
      );

    } finally {
      setSaving(false);
    }
  }


  // --------------------------------------------------
  // Delete Target
  // --------------------------------------------------

  async function deleteTarget(targetId) {

    const confirmed = window.confirm(
      "Are you sure you want to delete this target?"
    );


    if (!confirmed) {
      return;
    }


    try {
      setError("");


      const response = await fetch(
        `${API_URL}/api/targets/${targetId}`,
        {
          method: "DELETE",
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to delete target"
        );
      }


      // Remove from UI after successful DB deletion
      setTargets((currentTargets) =>
        currentTargets.filter(
          (target) => target.id !== targetId
        )
      );


    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to delete target."
      );
    }
  }


  // --------------------------------------------------
  // CSV Import
  // --------------------------------------------------

  async function handleCSV(event) {

    const file = event.target.files?.[0];


    if (!file) {
      return;
    }


    try {
      setError("");


      const text = await file.text();


      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);


      if (lines.length < 2) {
        throw new Error(
          "CSV must contain a header and at least one target."
        );
      }


      // ----------------------------------------------
      // Read headers
      // ----------------------------------------------

      const headers = lines[0]
        .split(",")
        .map((header) =>
          header.trim().toLowerCase()
        );


      const nameIndex = headers.indexOf("name");
      const emailIndex = headers.indexOf("email");


      if (
        nameIndex === -1 ||
        emailIndex === -1
      ) {
        throw new Error(
          "CSV must contain 'name' and 'email' columns."
        );
      }


      // ----------------------------------------------
      // Parse CSV
      // ----------------------------------------------

      const importedTargets = lines
        .slice(1)
        .map((line) => {

          const values = line
            .split(",")
            .map((value) => value.trim());


          return {
            name: values[nameIndex],
            email: values[emailIndex],
          };
        })
        .filter(
          (target) =>
            target.name &&
            target.email
        );


      if (importedTargets.length === 0) {
        throw new Error(
          "No valid targets found in CSV."
        );
      }


      // ----------------------------------------------
      // Send every target to PostgreSQL
      // ----------------------------------------------

      let addedCount = 0;
      let failedCount = 0;


      for (const target of importedTargets) {

        try {

          const response = await fetch(
            `${API_URL}/api/target-groups/${id}/targets`,
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                name: target.name,
                email: target.email,
                department: group.department,
              }),
            }
          );


          if (response.ok) {
            addedCount++;
          } else {
            failedCount++;
          }

        } catch {
          failedCount++;
        }
      }


      // ----------------------------------------------
      // Reload database records
      // ----------------------------------------------

      await loadData();


      // ----------------------------------------------
      // Result message
      // ----------------------------------------------

      if (failedCount === 0) {

        alert(
          `${addedCount} target(s) imported successfully.`
        );

      } else {

        alert(
          `${addedCount} target(s) imported successfully.\n` +
          `${failedCount} target(s) could not be imported.`
        );
      }


    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Unable to import CSV."
      );

    } finally {

      // Allow selecting the same file again
      event.target.value = "";
    }
  }


  // --------------------------------------------------
  // Loading screen
  // --------------------------------------------------

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-50">

        <main className="p-7">

          <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">

            <div className="w-10 h-10 mx-auto border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />

            <p className="text-sm text-slate-500 mt-4">
              Loading target group...
            </p>

          </div>

        </main>

      </div>
    );
  }


  // --------------------------------------------------
  // Error / group not found
  // --------------------------------------------------

  if (!group) {

    return (
      <div className="min-h-screen bg-slate-50">

        <main className="p-7">

          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">

            <h2 className="font-semibold text-red-700">
              Target group not found
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              {error}
            </p>

            <button
              onClick={() =>
                navigate("/target-groups")
              }
              className="mt-5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Back to Target Groups
            </button>

          </div>

        </main>

      </div>
    );
  }


  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">


      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="bg-white border-b border-slate-200 px-7 py-6">

        <button
          onClick={() =>
            navigate("/target-groups")
          }
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          <ArrowLeft size={16} />
          Back to Target Groups
        </button>


        <div className="flex items-start justify-between">

          <div>

            <p className="text-[11px] font-semibold tracking-[2px] text-indigo-600 uppercase">
              Target Management
            </p>


            <h1 className="text-3xl font-bold text-slate-950 mt-2">
              {group.name}
            </h1>


            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">

              <Building2 size={15} />

              {group.department}

            </div>

          </div>


          {/* Buttons */}

          <div className="flex gap-2">

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
            >

              <Upload size={16} />

              Import CSV

            </button>


            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSV}
              className="hidden"
            />


            <button
              onClick={() =>
                setShowModal(true)
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >

              <UserPlus size={16} />

              Add Target

            </button>

          </div>

        </div>

      </header>


      {/* ==================================================
          CONTENT
      ================================================== */}

      <main className="p-7">


        {/* Error */}

        {error && (

          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">

            {error}

          </div>

        )}


        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">


          {/* Total Targets */}

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">

              <UsersRound size={18} />

            </div>


            <div className="text-3xl font-bold text-slate-950 mt-4">

              {targets.length}

            </div>


            <div className="text-xs text-slate-500 mt-1">

              Total Targets

            </div>

          </div>


          {/* Email Addresses */}

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">

              <Mail size={18} />

            </div>


            <div className="text-3xl font-bold text-slate-950 mt-4">

              {targets.length}

            </div>


            <div className="text-xs text-slate-500 mt-1">

              Email Addresses

            </div>

          </div>


          {/* Department */}

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">

              <Building2 size={18} />

            </div>


            <div className="text-lg font-bold text-slate-950 mt-5">

              {group.department}

            </div>


            <div className="text-xs text-slate-500 mt-1">

              Department

            </div>

          </div>

        </div>


        {/* ==================================================
            TARGET TABLE
        ================================================== */}

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-slate-200">

            <h2 className="font-semibold text-slate-950">
              Targets
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              People included in this simulation group.
            </p>

          </div>


          {targets.length === 0 ? (

            <div className="p-12 text-center">

              <UsersRound
                size={30}
                className="mx-auto text-slate-300"
              />

              <h3 className="font-semibold text-slate-900 mt-3">
                No targets yet
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Add a target manually or import a CSV file.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="bg-slate-50 border-b border-slate-200">

                    <th className="text-left px-5 py-3 font-medium text-slate-500">
                      Name
                    </th>

                    <th className="text-left px-5 py-3 font-medium text-slate-500">
                      Email
                    </th>

                    <th className="text-left px-5 py-3 font-medium text-slate-500">
                      Department
                    </th>

                    <th className="text-right px-5 py-3 font-medium text-slate-500">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {targets.map((target) => (

                    <tr
                      key={target.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >

                      <td className="px-5 py-4 font-medium text-slate-900">
                        {target.name}
                      </td>


                      <td className="px-5 py-4 text-slate-500">
                        {target.email}
                      </td>


                      <td className="px-5 py-4 text-slate-500">
                        {target.department}
                      </td>


                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() =>
                            deleteTarget(target.id)
                          }
                          className="text-slate-400 hover:text-red-500"
                          title="Delete target"
                        >

                          <Trash2 size={16} />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>


      {/* ==================================================
          ADD TARGET MODAL
      ================================================== */}

      {showModal && (

        <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">


            {/* Modal Header */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">

              <div>

                <h2 className="text-lg font-bold text-slate-950">
                  Add Target
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Add a person to this simulation group.
                </p>

              </div>


              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="text-slate-400 hover:text-slate-700"
              >

                <X size={19} />

              </button>

            </div>


            {/* Form */}

            <form
              onSubmit={addTarget}
              className="p-6"
            >

              {/* Name */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>


                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Arjun Das"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

              </div>


              {/* Email */}

              <div className="mt-4">

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>


                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. arjun@example.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

              </div>


              {/* Buttons */}

              <div className="flex justify-end gap-2 mt-6">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                >

                  {saving
                    ? "Adding..."
                    : "Add Target"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default TargetGroupManage;