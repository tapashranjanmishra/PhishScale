import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import TargetGroups from "./pages/TargetGroups";
import TargetGroupManage from "./pages/TargetGroupManage";
import Templates from "./pages/Templates";
import Campaigns from "./pages/Campaigns";
import Analytics from "./pages/Analytics";
import Simulation from "./pages/Simulation";

function Placeholder({ title }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-950">
          {title}
        </h1>

        <p className="text-slate-500 mt-2">
          This module is coming next.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Dashboard application routes */}
        <Route element={<DashboardLayout />}>

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/target-groups"
            element={<TargetGroups />}
          />

          <Route
            path="/target-groups/:id"
            element={<TargetGroupManage />}
          />

          <Route
            path="/templates"
            element={<Templates />}
          />

          <Route
            path="/campaigns"
            element={<Campaigns />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

        </Route>

        {/* Safe phishing simulation route */}
        <Route
          path="/simulation/:campaignId/:targetId"
          element={<Simulation />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;