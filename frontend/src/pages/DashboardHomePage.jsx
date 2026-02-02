// src/pages/DashboardHomePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, MapPin, TrendingUp, Target } from "lucide-react";
import { AdminSidebarIcon } from "../components/ui/admin-sidebar-icon";
import { SegmentedProgress } from "../components/ui/progress-bar";
import { attractionsAPI } from "../api/attractions";
import { useAuthStore } from "../store/authStore";
import AttractionFeatureSection from "../components/attractions/AttractionFeatureSection";
import AttractionMap from "../components/map/AttractionMap";
import { useToast } from "../components/ui/toast-1";
import Loading from "../components/common/Loading";
const DashboardHomePage = () => {
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [attractions, setAttractions] = useState([]);
  const [stats, setStats] = useState({
    totalAttractions: 0,
    completedAttractions: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadDashboardData();
  }, []);
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load attractions with progress
      const attractionsData = await attractionsAPI.getAll();
      const attractionsArray = attractionsData.data || attractionsData || [];
      
      // Remove duplicates based on ID (keep first occurrence)
      const uniqueAttractions = attractionsArray.reduce((acc, current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Log warning if duplicates found
      if (uniqueAttractions.length < attractionsArray.length) {
        console.warn(`Dashboard: Found ${attractionsArray.length - uniqueAttractions.length} duplicate attraction(s)`);
      }
      
      setAttractions(uniqueAttractions);
      
      // Calculate stats
      const totalAttractions = uniqueAttractions.length;
      const completedAttractions = uniqueAttractions.filter(
        (a) => Number(a.progress_percentage || 0) === 100
      ).length;
      const totalTasks = uniqueAttractions.reduce(
        (sum, a) => sum + (a.total_tasks || 0),
        0
      );
      const completedTasks = uniqueAttractions.reduce(
        (sum, a) => sum + (a.completed_tasks || 0),
        0
      );
      setStats({
        totalAttractions,
        completedAttractions,
        totalTasks,
        completedTasks,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      showToast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  };
  const overallProgress =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center">
        {" "}
        <Loading message="Loading your dashboard..." />{" "}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light relative overflow-hidden">
      {" "}
      {/* Decorative blur circles */}{" "}
      <div className="fixed top-20 right-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float" style={{ backgroundColor: 'rgba(241, 238, 231, 0.4)' }} />{" "}
      <div className="fixed bottom-20 left-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float-delayed" style={{ backgroundColor: 'rgba(241, 238, 231, 0.4)' }} />{" "}
      <div className="fixed top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ backgroundColor: 'rgba(241, 238, 231, 0.3)' }} />{" "}
      {/* Welcome Header */}{" "}
      <div className="py-12">
        {" "}
        <div className="container-custom">
          {" "}
          <h1 className="text-4xl font-bold mb-2">
            {user?.is_first_login ? (
              <>Welcome, {user?.full_name || user?.username}! 🎉</>
            ) : (
              <>Welcome back, {user?.full_name || user?.username}!</>
            )}
          </h1>
          <p className="text-xl text-gray-700">
            {user?.is_first_login
              ? "Begin your K-Trek adventure across Kelantan"
              : "Continue your K-Trek adventure across Kelantan"}
          </p>
        </div>{" "}
      </div>{" "}
      {/* Stats Dashboard */}{" "}
      <div className="container-custom">
        {" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {" "}
          {/* Overall Progress */}{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <TrendingUp className="w-6 h-6 text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {overallProgress}%
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Overall Progress</span>
              <AdminSidebarIcon name="userProgress" className="w-6 h-6 sm:w-7 sm:h-7 text-[#120c07]" />
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats.completedTasks} of {stats.totalTasks} tasks
            </p>
            <div className="mt-4">
              <SegmentedProgress
                value={overallProgress}
                segments={20}
                showDemo={false}
                showPercentage={false}
              />
            </div>
          </div>{" "}
          {/* Attractions Visited */}{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <MapPin className="w-6 h-6 text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {" "}
                {stats.completedAttractions}{" "}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Completed</span>
              <AdminSidebarIcon name="tasks" className="w-6 h-6 sm:w-7 sm:h-7 text-[#120c07]" />
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {" "}
              of {stats.totalAttractions} attractions{" "}
            </p>{" "}
          </div>{" "}
          {/* Tasks Completed */}{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <Target className="w-6 h-6 text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {" "}
                {stats.completedTasks}{" "}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Tasks Done</span>
              <AdminSidebarIcon name="tasks" className="w-6 h-6 sm:w-7 sm:h-7 text-[#120c07]" />
            </h3>
            <p className="text-sm text-gray-500 mt-1">Keep going!</p>{" "}
          </div>{" "}
          {/* Rewards Earned */}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                <Award className="w-6 h-6 text-gray-700" />
              </div>
              <span className="text-3xl font-bold text-gray-700">
                {stats.completedAttractions}
              </span>
            </div>
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Badges Earned</span>
              <AdminSidebarIcon name="rewards" className="w-6 h-6 sm:w-7 sm:h-7 text-[#120c07]" />
            </h3>
            <p className="text-sm text-gray-500 mt-1">Great work!</p>
          </div>
        </div>{" "}
      </div>{" "}

      {/* Map Section */}
      <div className="relative z-10 pb-12 px-6 pt-8">
        <div className="container-custom">
          <div className="mb-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Explore on the Map
          </h2>
          <p className="text-gray-700">
            Click a marker to view an attraction, then open it to start missions.
          </p>
        </div>
          <AttractionMap
            attractions={attractions}
            mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN}
          />
        </div>
      </div>

      {/* Attractions Section */}{" "}
      <div className="container-custom pb-12">
        {" "}
        <div className="mb-8">
          {" "}
          <h2 className="text-3xl font-bold bg-clip-text text-transparent mb-2">
            Attractions Available
          </h2>
          <p className="text-gray-600">
            {" "}
            Click on any attraction to continue your missions{" "}
          </p>{" "}
        </div>{" "}
        <AttractionFeatureSection
          attractions={attractions}
          isAuthenticated={true}
        />{" "}
      </div>{" "}
      {/* Quick Actions */}{" "}
      <div className="container-custom pb-12">
        {" "}
        <div className="backdrop-blur-xl rounded-3xl p-8 text-center shadow-lg border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
          {" "}
          <h3 className="text-2xl font-bold bg-clip-text text-transparent mb-4">
            Ready for More Adventures?
          </h3>
          <div className="cta-row">
            {" "}
            <button
              onClick={() => navigate("/dashboard/attractions")}
              className="glass-button px-6 py-3 rounded-full font-medium"
            >
              Explore All Attractions
            </button>
            <button
              onClick={() => navigate("/dashboard/progress")}
              className="glass-button px-6 py-3 rounded-full font-medium"
              style={{ backgroundColor: '#F1EEE7' }}
            >
              View Progress
            </button>
            <button
              onClick={() => navigate("/dashboard/rewards")}
              className="glass-button px-6 py-3 rounded-full font-medium"
            >
              View Rewards
            </button>
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
export default DashboardHomePage;
