import React, { useState, useEffect } from "react";
import { getImageUrl } from "../utils/constants";
import {
  MapPin,
  CheckCircle,
  Lightning,
  Trophy,
  Calendar,
  CaretDown,
  CaretUp,
  Target,
} from "@phosphor-icons/react";
import { useAuthStore } from "../store/authStore";
import { useProgressStore } from "../store/progressStore";
import useRewardStore from "../store/rewardStore";
import { progressAPI } from "../api/progress";
import CategoryProgressCard from "../components/rewards/CategoryProgressCard";
import { attractionsAPI } from "../api/attractions";
import Loading from "../components/common/Loading";
import Card from "../components/common/Card";
import ProgressBar from "../components/common/ProgressBar";
import { SegmentedProgress } from "../components/ui/progress-bar";
import { AdminSidebarIcon } from "../components/ui/admin-sidebar-icon";
import Button from "../components/common/Button";
import { GlassButton } from "@/components/ui/glass-button";
import { Button as ShadButton } from "../components/ui/button";
import { formatDate } from "../utils/helpers";
import { useToast } from "../components/ui/toast-1";
import { Link, useNavigate } from "react-router-dom";
const ProgressPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    progress,
    statistics,
    setProgress,
    setStatistics,
    isLoading,
    setLoading,
  } = useProgressStore();
  const { categoryProgress, fetchUserStats } = useRewardStore();
  const [expandedAttractions, setExpandedAttractions] = useState({});
  const [attractionTasks, setAttractionTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});
  useEffect(() => {
    fetchProgress();
    fetchUserStats(); // Fetch category progress
  }, []);
  const fetchProgress = async () => {
    setLoading(true);
    try {
      const response = await progressAPI.getUserProgress();
      if (response.success) {
        setProgress(response.data.progress || []);
        setStatistics(response.data.statistics || {});
      } else {
        showToast("Failed to load progress", "error");
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
      showToast("Failed to load progress data", "error");
    } finally {
      setLoading(false);
    }
  };
  const toggleAttractionExpand = async (attractionId) => {
    const isExpanded = expandedAttractions[attractionId];
    setExpandedAttractions((prev) => ({
      ...prev,
      [attractionId]: !isExpanded,
    }));

    // Fetch tasks if not already loaded and expanding
    if (!isExpanded && !attractionTasks[attractionId]) {
      setLoadingTasks((prev) => ({ ...prev, [attractionId]: true }));
      try {
        const response = await attractionsAPI.getTasks(attractionId);
        const tasks = response.data || response;
        setAttractionTasks((prev) => ({
          ...prev,
          [attractionId]: Array.isArray(tasks) ? tasks : [],
        }));
      } catch (error) {
        console.error("Error fetching tasks:", error);
        showToast("Failed to load tasks", "error");
      } finally {
        setLoadingTasks((prev) => ({ ...prev, [attractionId]: false }));
      }
    }
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case "quiz":
      // photo task removed
        return <AdminSidebarIcon name="tasks" className="w-5 h-5 text-[#120c07]" />;
      case "checkin":
        return <AdminSidebarIcon name="attractions" className="w-5 h-5 text-[#120c07]" />;
      default:
        return <AdminSidebarIcon name="tasks" className="w-5 h-5 text-[#120c07]" />;
    }
  };
  if (isLoading) {
    return <Loading fullScreen message="Loading your progress..." />;
  }
  const stats = statistics || {
    total_attractions_started: 0,
    attractions_completed: 0,
    total_tasks_completed: 0,
    total_rewards_unlocked: 0,
  };
  const overallProgress =
    progress && progress.length > 0
      ? Math.round(
          progress.reduce(
            (sum, p) => sum + parseFloat(p.progress_percentage || 0),
            0
          ) / progress.length
        )
      : 0;
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light relative overflow-hidden">
      {" "}
      {/* Decorative blur circles */}{" "}
      <div className="fixed top-20 right-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float" style={{ backgroundColor: 'rgba(241, 238, 231, 0.4)' }} />{" "}
      <div className="fixed bottom-20 left-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float-delayed" style={{ backgroundColor: 'rgba(241, 238, 231, 0.4)' }} />{" "}
      <div className="fixed top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ backgroundColor: 'rgba(241, 238, 231, 0.3)' }} />{" "}
      {/* Header */}{" "}
      <div className="shadow-lg">
        {" "}
        <div className="container-custom py-12">
          {" "}
          <div className="flex items-center space-x-3 mb-4">
            {" "}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              <span className="inline-flex items-center gap-2">
                <span>Your Progress</span><span>        </span>
                <AdminSidebarIcon name="userProgress" className="w-6 h-6 sm:w-10 sm:h-10 text-[#120c07]" />
              </span>
            </h1>{" "}
          </div>{" "}
          <p className="text-gray-700 text-lg">
            {" "}
            Track your journey through Kelantan's cultural heritage{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="container-custom py-8">
        {" "}
        {/* Overall Stats */}{" "}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <MapPin size={24} className="text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {stats.total_attractions_started || 0}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Started</span>
              <AdminSidebarIcon name="attractions" className="w-4 h-4 text-[#120c07]" />
            </h3>
          </div>{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <CheckCircle size={24} className="text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {stats.attractions_completed || 0}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium">Completed</h3>
          </div>{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <Lightning size={24} className="text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {stats.total_tasks_completed || 0}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Tasks</span>
              <AdminSidebarIcon name="tasks" className="w-4 h-4 text-[#120c07]" />
            </h3>
          </div>{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <Trophy size={24} className="text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {stats.total_rewards_unlocked || 0}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Rewards</span>
              <AdminSidebarIcon name="rewards" className="w-4 h-4 text-[#120c07]" />
            </h3>
          </div>{" "}
        </div>{" "}
        {/* Overall Progress Card */}{" "}
        <Card className="mb-8" padding="lg" gradient>
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <h2 className="text-2xl font-bold bg-clip-text text-transparent">
              Overall Progress
            </h2>{" "}
            <div className="text-3xl font-bold text-gray-700">
              {overallProgress}%
            </div>{" "}
          </div>{" "}
          <div className="mb-3">
            <SegmentedProgress
              value={overallProgress}
              segments={24}
              showDemo={false}
              showPercentage={false}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {" "}
            Average completion across all attractions{" "}
          </p>{" "}
        </Card>{" "}
        
        {/* Category Progress - Moved to Rewards Page as "Category Milestones" */}
        
        {/* Individual Progress */}{" "}
        <div className="mb-6 flex items-center justify-between">
          {" "}
          <h2 className="text-2xl font-bold bg-clip-text text-transparent">
            Attraction Progress
          </h2>{" "}
          <Link
            to="/dashboard/attractions"
            className="text-gray-700 font-medium text-sm transition-colors duration-300"
          >
            {" "}
            View All Attractions →
          </Link>{" "}
        </div>{" "}
        {progress.length > 0 ? (
          <div className="space-y-4">
            {" "}
            {progress
              .sort(
                (a, b) =>
                  parseFloat(b.progress_percentage) -
                  parseFloat(a.progress_percentage)
              )
              .map((item) => (
                <Card key={item.attraction_id} padding="md" gradient>
                  {" "}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    {" "}
                    {/* Image */}{" "}
                    <div className="flex-shrink-0 self-start">
                      {" "}
                      <div
                        className="rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                        style={{
                          width: "96px",
                          height: "96px",
                          minWidth: "96px",
                          minHeight: "96px",
                        }}
                      >
                        {" "}
                        {item.attraction_image ? (
                          <img
                            src={
                              item.attraction_image.startsWith("http")
                                ? item.attraction_image
                                : getImageUrl(item.attraction_image)
                            }
                            alt={item.attraction_name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              const placeholder = document.createElement("div");
                              placeholder.className =
                                "w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center";
                              placeholder.innerHTML = ` <svg class="text-white" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path> <circle cx="12" cy="10" r="3"></circle> </svg> `;
                              e.target.parentElement.appendChild(placeholder);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            {" "}
                            <MapPin className="text-white" size={32} />{" "}
                          </div>
                        )}{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Content */}{" "}
                    <div className="flex-1 min-w-0">
                      {" "}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        {" "}
                        <div className="flex-1">
                          {" "}
                          <Link to={`/dashboard/attractions/${item.attraction_id}`}>
                            {" "}
                            <h3 className="font-semibold text-gray-900 mb-1.5 truncate transition-colors leading-snug">
                              {" "}
                              {item.attraction_name}{" "}
                            </h3>{" "}
                          </Link>{" "}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                            {" "}
                            <span>
                              {item.completed_tasks} / {item.total_tasks} tasks
                            </span>{" "}
                            {item.last_activity && (
                              <span className="flex items-center space-x-1">
                                {" "}
                                <Calendar size={14} />{" "}
                                <span>
                                  {formatDate(item.last_activity)}
                                </span>{" "}
                              </span>
                            )}{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="flex-shrink-0 sm:ml-4">
                          {" "}
                          {item.reward_unlocked ? (
                            <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#F1EEE7' }}>
                              {" "}
                              <Trophy size={16} /> <span>Unlocked</span>{" "}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-gray-700">
                              {" "}
                              {Math.round(item.progress_percentage)}%{" "}
                            </div>
                          )}{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="mt-1">
                        <ProgressBar
                          progress={parseFloat(item.progress_percentage)}
                          showLabel={false}
                          color={item.reward_unlocked ? "green" : "primary"}
                        />
                      </div>{" "}
                      {/* Expand/Collapse Tasks */}{" "}
                      <div className="mt-4">
                        {" "}
                        <div className="inline-block min-w-[300px]">
                          <ShadButton
                            variant="ghost"
                            size="lg"
                            onClick={() => toggleAttractionExpand(item.attraction_id)}
                            aria-expanded={Boolean(expandedAttractions[item.attraction_id])}
                            aria-controls={`tasks-${item.attraction_id}`}
                            className="text-gray-700 px-6 py-3 rounded-full inline-flex items-center gap-2 whitespace-nowrap"
                          >
                          <span className="inline-flex items-center gap-2">
                            <span>{expandedAttractions[item.attraction_id] ? "Hide Tasks" : "Show Tasks"}</span>
                          {expandedAttractions[item.attraction_id] ? (
                            <CaretUp
                              className="-me-1 ms-1"
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          ) : (
                            <CaretDown
                              className="-me-1 ms-1"
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        </ShadButton></div>
                        {/* Tasks List */}
                        {expandedAttractions[item.attraction_id] && (
                          <div id={`tasks-${item.attraction_id}`} className="mt-3 space-y-2">
                            {" "}
                            {loadingTasks[item.attraction_id] ? (
                              <div className="text-sm text-gray-500 py-2">
                                Loading tasks...
                              </div>
                            ) : attractionTasks[item.attraction_id]?.length >
                              0 ? (
                              attractionTasks[item.attraction_id].map(
                                (task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200"
                                  >
                                    {" "}
                                    <div className="flex items-center gap-3 flex-1">
                                      {" "}
                                      <span className="inline-flex items-center">
                                        {getTaskIcon(task.type)}
                                      </span>{" "}
                                      <div className="flex-1">
                                        {" "}
                                        <div className="font-medium text-gray-900">
                                          {task.name}
                                        </div>{" "}
                                        <div className="text-xs text-gray-500 uppercase">
                                          {task.type}
                                        </div>{" "}
                                      </div>{" "}
                                      {Boolean(task.is_completed) && (
                                        <span className="text-gray-700 font-medium text-sm">
                                          Completed
                                        </span>
                                      )}{" "}
                                    </div>{" "}
                                    {!task.is_completed && (
                                      <GlassButton
                                        size="sm"
                                        onClick={() =>
                                          navigate(
                                            `/dashboard/tasks/${task.id}`
                                          )
                                        }
                                        className="ml-3"
                                      >
                                        Start Task
                                      </GlassButton>
                                    )}{" "}
                                  </div>
                                )
                              )
                            ) : (
                              <div className="text-sm text-gray-500 py-2">
                                No tasks available
                              </div>
                            )}{" "}
                          </div>
                        )}{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </Card>
              ))}{" "}
          </div>
        ) : (
          <Card className="text-center py-12" padding="lg" gradient>
            {" "}
            <Target className="mx-auto mb-4 text-gray-700" size={64} />{" "}
            <h3 className="text-xl font-semibold bg-clip-text text-transparent mb-2">
              No Progress Yet
            </h3>{" "}
            <p className="text-gray-600 mb-6">
              {" "}
              Start exploring attractions to track your progress!{" "}
            </p>{" "}
            <Link to="/dashboard/attractions">
              {" "}
              <Button variant="glass">Explore Attractions</Button>{" "}
            </Link>{" "}
          </Card>
        )}{" "}
      </div>{" "}
    </div>
  );
};
export default ProgressPage;
