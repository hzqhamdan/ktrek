// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// Layout
import Layout from "./components/layout/Layout";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ModernLoginPage from "./pages/ModernLoginPage";
import ModernRegisterPage from "./pages/ModernRegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardHomePage from "./pages/DashboardHomePage";
import AttractionsPage from "./pages/AttractionsPage";
import AttractionDetailPage from "./pages/AttractionDetailPage";
import TaskPage from "./pages/TaskPage";
import CheckinTaskPage from "./pages/CheckinTaskPage";
import QuizTaskPage from "./pages/QuizTaskPage";
import CountConfirmTaskPage from "./pages/CountConfirmTaskPage";
import DirectionTaskPage from "./pages/DirectionTaskPage";
import RiddleTaskPage from "./pages/RiddleTaskPage";
import MemoryRecallTaskPage from "./pages/MemoryRecallTaskPage";
import ObservationMatchTaskPage from "./pages/ObservationMatchTaskPage";
import RouteCompletionTaskPage from "./pages/RouteCompletionTaskPage";
import TimeBasedTaskPage from "./pages/TimeBasedTaskPage";
import ProgressPage from "./pages/ProgressPage";
import RewardsPage from "./pages/RewardsPage";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import AvatarOnboardingPage from "./pages/AvatarOnboardingPage";
import NotFoundPage from "./pages/NotFoundPage";
import SignInFlowDemoPage from "./pages/SignInFlowDemoPage";
import SignUpDemoPage from "./pages/SignUpDemoPage";
import GlassButtonDemo from "./pages/GlassButtonDemo";
import QRCheckInSuccessPage from "./pages/QRCheckInSuccessPage";
import TierUnlockTestPage from "./pages/TierUnlockTestPage";
// Auth
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ backgroundColor: '#F1EEE7' }}>
        <Routes>
          {" "}
          {/* PUBLIC ROUTES */} <Route path="/" element={<HomePage />} />{" "}
          <Route path="/login" element={<ModernLoginPage />} />{" "}
          <Route path="/register" element={<ModernRegisterPage />} />{" "}
          {/* Public attraction details (no login required) */}
          <Route path="/attractions/:id" element={<AttractionDetailPage />} />{" "}
          <Route
            path="/onboarding/avatar"
            element={
              <ProtectedRoute>
                <AvatarOnboardingPage />
              </ProtectedRoute>
            }
          />{" "}
          {/* Old pages for reference */}
          <Route path="/login-old" element={<LoginPage />} />{" "}
          <Route path="/register-old" element={<RegisterPage />} />{" "}
          <Route path="/reset-password" element={<ResetPasswordPage />} />{" "}
          <Route path="/sign-in-flow-demo" element={<SignInFlowDemoPage />} />
          <Route path="/sign-up-demo" element={<SignUpDemoPage />} />
          <Route path="/glass" element={<GlassButtonDemo />} />
          <Route path="/tier-unlock-test" element={<TierUnlockTestPage />} />
          {/* QR Check-in - Can be accessed without full login (semi-public) */}
          <Route path="/qr-checkin" element={<QRCheckInSuccessPage />} />
          {/* PROTECTED ROUTES */}{" "}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardHomePage />} />
            <Route path="dashboard/attractions" element={<AttractionsPage />} />
            <Route path="dashboard/attractions/:id" element={<AttractionDetailPage />} />
            <Route path="dashboard/tasks/:taskId" element={<TaskPage />} />
            <Route path="dashboard/tasks/checkin/:taskId" element={<CheckinTaskPage />} />
            
            <Route path="dashboard/tasks/:taskId/quiz" element={<QuizTaskPage />} />
            <Route path="dashboard/tasks/:taskId/count-confirm" element={<CountConfirmTaskPage />} />
            <Route path="dashboard/tasks/:taskId/direction" element={<DirectionTaskPage />} />
            <Route path="dashboard/tasks/:taskId/riddle" element={<RiddleTaskPage />} />
            <Route path="dashboard/tasks/:taskId/memory-recall" element={<MemoryRecallTaskPage />} />
            <Route path="dashboard/tasks/:taskId/observation-match" element={<ObservationMatchTaskPage />} />
            <Route path="dashboard/tasks/:taskId/route-completion" element={<RouteCompletionTaskPage />} />
            <Route path="dashboard/tasks/:taskId/time-based" element={<TimeBasedTaskPage />} />
            <Route path="dashboard/progress" element={<ProgressPage />} />
            <Route path="dashboard/rewards" element={<RewardsPage />} />
            <Route path="dashboard/profile" element={<ProfilePage />} />
            <Route path="dashboard/reports" element={<ReportsPage />} />
          </Route>
          {/* 404 PAGE */} <Route path="*" element={<NotFoundPage />} />{" "}
        </Routes>{" "}
      </div>{" "}
    </Router>
  );
}

export default App;
