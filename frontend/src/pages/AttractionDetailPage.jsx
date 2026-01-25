// src/pages/AttractionDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminSidebarIcon } from "../components/ui/admin-sidebar-icon";
import { MapPin, Clock, Users, Award, ArrowLeft, Navigation } from "lucide-react";
import { attractionsAPI } from "../api/attractions";
import { useAuthStore } from "../store/authStore";
import ProxyImage from "../components/common/ProxyImage";
import { getImageUrl, getPlaceholderImage } from "../utils/constants";
import { useToast } from "../components/ui/toast-1";
const AttractionDetailPage = () => {
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [attraction, setAttraction] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildGoogleMapsUrl = (a) => {
    if (!a) return null;

    // 1) Explicit link from admin
    const explicit = (a.navigation_link || a.navigationLink || "").trim();
    if (explicit) return explicit;

    // 2) Coordinates
    const lat = a.latitude != null ? Number(a.latitude) : null;
    const lng = a.longitude != null ? Number(a.longitude) : null;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${lat},${lng}`
      )}`;
    }

    // 3) Fallback to a query using name + location
    const query = [a.name, a.location].filter(Boolean).join(" ").trim();
    if (query) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query
      )}`;
    }

    return null;
  };

  useEffect(() => {
    const loadAttractionDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(
          "Loading attraction:",
          id,
          "Authenticated:",
          isAuthenticated
        );
        let attractionData, tasksData;
        if (isAuthenticated) {
          // Authenticated user - get full details with progress
          attractionData = await attractionsAPI.getById(id);
          tasksData = await attractionsAPI.getTasks(id);
        } else {
          // Public user - get basic details only
          attractionData = await attractionsAPI.getPublicById(id);
          tasksData = await attractionsAPI.getPublicTasks(id);
        }
        console.log("Attraction data:", attractionData);
        console.log("Tasks data:", tasksData);
        // Handle nested response formats
        const attraction = attractionData?.data || attractionData;
        const tasksList = tasksData?.data || tasksData;
        // Ensure tasks is always an array
        const tasksArray = Array.isArray(tasksList) ? tasksList : [];
        console.log("Processed attraction:", attraction);
        console.log("Processed tasks:", tasksArray);
        setAttraction(attraction);
        setTasks(tasksArray);
      } catch (err) {
        console.error("Failed to load attraction:", err);
        setError("Failed to load attraction details");
        showToast("Could not load attraction details", "error");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      loadAttractionDetails();
    }
  }, [id, isAuthenticated]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center">
        {" "}
        <div className="text-center">
          {" "}
          <div className="inline-block w-14 h-14 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>{" "}
          <p className="text-gray-600 font-medium">
            Loading attraction...
          </p>{" "}
        </div>{" "}
      </div>
    );
  }
  if (error || !attraction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center p-4">
        {" "}
        <div className="backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
          {" "}
          <div className="text-6xl mb-4">
            <AdminSidebarIcon name="attractions" className="w-12 h-12 text-[#120c07]" />
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent mb-2">
            {" "}
            Attraction Not Found{" "}
          </h2>{" "}
          <p className="text-gray-600 mb-6">
            {error || "This attraction does not exist or has been removed."}
          </p>{" "}
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
            className="glass-button px-6 py-3 rounded-full font-medium"
          >
            {" "}
            Back to Home{" "}
          </button>{" "}
        </div>{" "}
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
      {/* Back Button */}{" "}
      <div className="backdrop-blur-md border-b-2 border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
        {" "}
        <div className="max-w-7xl mx-auto px-4 py-4">
          {" "}
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
            className="glass-button px-4 py-2 rounded-full font-medium inline-flex items-center gap-2"
          >
            {" "}
            <ArrowLeft className="w-5 h-5" /> <span>Back</span>{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Attraction Header */}{" "}
      <div className="backdrop-blur-md shadow-lg" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
        {" "}
        <div className="max-w-7xl mx-auto">
          {" "}
          <div className="grid md:grid-cols-2 gap-8">
            {" "}
            {/* Image */}{" "}
            <div className="h-96 md:h-full relative overflow-hidden">
              {" "}
              <ProxyImage
                src={getImageUrl(attraction.image)}
                alt={attraction.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                fallbackSrc={getPlaceholderImage(800, 600, "No Image")}
              />{" "}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />{" "}
            </div>{" "}
            {/* Details */}{" "}
            <div className="p-8">
              {" "}
              <h1 className="text-4xl font-bold bg-clip-text text-transparent mb-4">
                {" "}
                {attraction.name}{" "}
              </h1>{" "}
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                {" "}
                <MapPin className="w-5 h-5 text-gray-700" />{" "}
                <span className="text-lg">{attraction.location}</span>{" "}
              </div>{" "}
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                {" "}
                {attraction.description}{" "}
              </p>{" "}

              {/* Stats (only for authenticated users) */}{" "}
              {isAuthenticated && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {" "}
                  <div className=" rounded-2xl p-4 text-center border border-gray-200/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {" "}
                    <Clock className="w-6 h-6 text-gray-700 mx-auto mb-2" />{" "}
                    <div className="text-2xl font-bold text-gray-700">
                      {" "}
                      {tasks.length || 0}{" "}
                    </div>{" "}
                    <div className="text-sm text-gray-600">Tasks</div>{" "}
                  </div>{" "}
                  <div className=" rounded-2xl p-4 text-center border border-gray-200/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {" "}
                    <Award className="w-6 h-6 text-gray-700 mx-auto mb-2" />{" "}
                    <div className="text-2xl font-bold text-gray-700">
                      {" "}
                      {attraction.completed_tasks || 0}{" "}
                    </div>{" "}
                    <div className="text-sm text-gray-600">Completed</div>{" "}
                  </div>{" "}
                  <div className=" rounded-2xl p-4 text-center border border-gray-200/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {" "}
                    <Users className="w-6 h-6 text-gray-700 mx-auto mb-2" />{" "}
                    <div className="text-2xl font-bold text-gray-700">
                      {" "}
                      {attraction.progress_percentage || 0}%{" "}
                    </div>{" "}
                    <div className="text-sm text-gray-600">Progress</div>{" "}
                  </div>{" "}
                </div>
              )}{" "}
              {/* CTA (public + authenticated) */}{" "}
              <div className="cta-stack">{" "}
                {tasks.length > 0 ? (
                  <>
                    {" "}
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          showToast("Please login to start tasks", "error");
                          navigate("/login", {
                            state: {
                              from: `/attractions/${id}`,
                            },
                          });
                          return;
                        }

                        // Find first incomplete task
                        const firstIncompleteTask = tasks.find(
                          (t) => !t.is_completed
                        );
                        if (firstIncompleteTask) {
                          navigate(`/dashboard/tasks/${firstIncompleteTask.id}`);
                        } else {
                          // All tasks completed, scroll to tasks section
                          document
                            .getElementById("tasks-section")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="glass-button w-full py-3 rounded-xl font-medium inline-flex items-center justify-center gap-2"
                    >
                      {tasks.some((t) => !t.is_completed)
                        ? "Start Next Mission"
                        : "View All Missions"}
                    </button>
                    {(() => {
                      const mapsUrl = buildGoogleMapsUrl(attraction);
                      if (!mapsUrl) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
                          className="glass-button w-full py-3 rounded-xl font-medium inline-flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-5 h-5" />
                          Navigate in Google Maps
                        </button>
                      );
                    })()}{" "}
                  </>
                ) : (
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-4 text-center text-gray-600 border border-gray-200">
                    {" "}
                    No missions available yet{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Tasks Preview (Public & Authenticated) */}{" "}
      <div id="tasks-section">
        {" "}
        {tasks && Array.isArray(tasks) && tasks.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            {" "}
            <div className="flex items-center justify-between mb-6">
              {" "}
              <h2 className="text-3xl font-bold bg-clip-text text-transparent">
                {isAuthenticated
                  ? "Available Missions"
                  : "Mission Preview"}
              </h2>
              {isAuthenticated && (
                <div className="text-sm text-gray-600 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
                  {" "}
                  {tasks.filter((t) => t.is_completed).length} of {tasks.length}{" "}
                  completed{" "}
                </div>
              )}{" "}
            </div>{" "}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {" "}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-gray-200 ${
                    isAuthenticated && !task.is_completed
                      ? "hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                      : "cursor-default"
                  }`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      showToast("Please login to start tasks", "error");
                      navigate("/login");
                    } else if (!task.is_completed) {
                      navigate(`/dashboard/tasks/${task.id}`);
                    }
                  }}
                >
                  {" "}
                  <div className="h-2"></div>{" "}
                  <div className="p-6">
                    {" "}
                    <div className="flex items-center justify-between mb-3">
                      {" "}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.type === "quiz"
                            ? "text-gray-700"
                            : "text-gray-700"
                        }`}
                      >
                        {" "}
                        {task.type ? task.type.toUpperCase() : "TASK"}{" "}
                      </span>{" "}
                      {task.is_completed ? (
                        <span className="text-green-600 text-sm font-semibold">Completed</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Not completed</span>
                      )}{" "}
                    </div>{" "}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {" "}
                      {task.name}{" "}
                    </h3>{" "}
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {" "}
                      {task.description}{" "}
                    </p>{" "}
                    {!isAuthenticated && (
                      <div className="mt-4 text-gray-400 text-sm flex items-center gap-2">
                        Login required
                      </div>
                    )}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
      {/* No tasks message */}{" "}
      {(!tasks || tasks.length === 0) && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          {" "}
          <div className="backdrop-blur-md rounded-2xl p-8 text-center border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <p className="text-gray-600">
              No missions available for this attraction yet.
            </p>
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
};
export default AttractionDetailPage;
