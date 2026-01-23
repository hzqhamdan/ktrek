// src/pages/TaskPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { tasksAPI } from "../api/tasks";
import { guidesAPI } from "../api/guides";
import { useToast } from "../components/ui/toast-1";
const TaskPage = () => {
  const { showToast } = useToast();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    loadTask();
  }, [taskId]);
  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getById(taskId);
      const taskData = response.data || response;
      setTask(taskData);
      
      // Load guides for the specific task
      try {
        const guidesResponse = await guidesAPI.getByTask(taskId);
        setGuides(guidesResponse.data || guidesResponse || []);
      } catch (guideError) {
        console.warn("No guides available for this task:", guideError);
        setGuides([]);
      }
    } catch (error) {
      console.error("Failed to load task:", error);
      showToast("Failed to load task", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Handle different task types
      if (task.type === "quiz") {
        // Navigate to quiz page (must match route: /dashboard/tasks/:taskId/quiz)
        navigate(`/dashboard/tasks/${taskId}/quiz`);
      } else if (task.type === "checkin") {
        // For check-in, show options (QR or live location)
        navigate(`/dashboard/tasks/checkin/${taskId}`, {
          state: { task }
        });
      } else if (task.type === "count_confirm") {
        // Navigate to count & confirm page
        navigate(`/dashboard/tasks/${taskId}/count-confirm`);
      } else if (task.type === "direction") {
        // Navigate to direction page
        navigate(`/dashboard/tasks/${taskId}/direction`);
      } else if (task.type === "riddle") {
        // Navigate to riddle page
        navigate(`/dashboard/tasks/${taskId}/riddle`);
      } else if (task.type === "memory_recall") {
        // Navigate to memory recall page
        navigate(`/dashboard/tasks/${taskId}/memory-recall`);
      } else if (task.type === "observation_match") {
        // Navigate to observation match page
        navigate(`/dashboard/tasks/${taskId}/observation-match`);
      } else if (task.type === "route_completion") {
        // Navigate to route completion page
        navigate(`/dashboard/tasks/${taskId}/route-completion`);
      } else if (task.type === "time_based") {
        // Navigate to time-based page
        navigate(`/dashboard/tasks/${taskId}/time-based`);
      }
    } catch (error) {
      console.error("Task submission error:", error);
      showToast("Failed to submit task", "error");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center">
        {" "}
        <div className="text-center">
          {" "}
          <div className="inline-block w-14 h-14 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>{" "}
          <p className="text-gray-600 font-medium">Loading task...</p>{" "}
        </div>{" "}
      </div>
    );
  }
  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center p-4">
        {" "}
        <div className="backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
          {" "}
          <XCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />{" "}
          <h2 className="text-2xl font-bold bg-clip-text text-transparent mb-2">
            Task Not Found
          </h2>{" "}
          <p className="text-gray-600">This task does not exist.</p>{" "}
          <div className="cta-stack">
            <button
              onClick={() => navigate(-1)}
              className="glass-button px-6 py-3 rounded-full font-medium"
            >
              Go Back
            </button>
          </div>
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
      {/* Header */}{" "}
      <div className="backdrop-blur-md border-b-2 border-gray-200 sticky top-0 z-10" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
        {" "}
        <div className="max-w-4xl mx-auto px-4 py-4">
          {" "}
          <button
            onClick={() => navigate(-1)}
            className="glass-button px-4 py-2 rounded-full font-medium inline-flex items-center gap-2"
          >
            {" "}
            <ArrowLeft className="w-5 h-5" />{" "}
            <span>Back to Attraction</span>{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Task Content */}{" "}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {" "}
        {/* Task Header */}{" "}
        <div className="backdrop-blur-xl rounded-2xl shadow-lg p-8 mb-6 border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
          {" "}
          <div className="flex items-start justify-between mb-4">
            {" "}
            <div>
              {" "}
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  task.type === "quiz"
                    ? "text-gray-700"
                    : task.type === "photo"
                      ? "text-gray-700"
                      : "text-gray-700"
                }`}
              >
                {" "}
                {String(task.type || "TASK").replace(/\d+$/, "").toUpperCase()}{" "}
              </span>{" "}
              {Boolean(task.is_completed) && (
                <span className="ml-3 inline-flex items-center gap-1 text-green-600">
                  {" "}
                  <CheckCircle className="w-5 h-5" />{" "}
                  <span className="text-sm font-medium">Completed</span>{" "}
                </span>
              )}{" "}
            </div>{" "}
          </div>{" "}
          <h1 className="text-3xl font-bold bg-clip-text text-transparent mb-4">
            {" "}
            {task.name}{" "}
          </h1>{" "}
          <p className="text-gray-700 text-lg leading-relaxed">
            {" "}
            {task.description}{" "}
          </p>{" "}
        </div>{" "}
        {/* Guides Section */}
        {guides && guides.length > 0 && (
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-8 mb-6 border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            <h3 className="text-xl font-bold text-[#120c07] mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Guides & Tips
            </h3>
            <div className="space-y-4">
              {guides.map((guide) => (
                <div 
                  key={guide.id}
                  className="bg-white bg-opacity-50 rounded-lg p-4 border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{guide.title}</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{guide.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Task Actions */}{" "}
        <div className="backdrop-blur-xl rounded-2xl shadow-lg p-8 border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
          {" "}
          {task.is_completed ? (
            <div className="text-center">
              {" "}
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />{" "}
              <h3 className="text-xl font-bold bg-clip-text text-transparent mb-2">
                {" "}
                Task Completed!{" "}
              </h3>{" "}
              <p className="text-gray-600 mb-6">
                {" "}
                Great job! You've already completed this task.{" "}
              </p>{" "}
              <button
                onClick={() => navigate(-1)}
                className="glass-button px-6 py-3 rounded-full font-medium"
              >
                {" "}
                Back to Attraction{" "}
              </button>{" "}
            </div>
          ) : (
            <div>
              {" "}
              <h3 className="text-xl font-bold bg-clip-text text-transparent mb-4">
                {" "}
                Ready to start?{" "}
              </h3>{" "}
              <div className="flex flex-col gap-6">
                {" "}
                {task.type === "quiz" && (
                  <p className="text-gray-600">
                    {" "}
                    This task contains a quiz. Click below to begin answering
                    questions.{" "}
                  </p>
                )}{" "}
                {task.type === "checkin" && (
                  <p className="text-gray-600">
                    {" "}
                    Check in at this location to complete the task.{" "}
                  </p>
                )}{" "}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`glass-button w-full py-3 rounded-xl font-medium inline-flex items-center justify-center transition-all duration-300 ${
                    submitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {" "}
                  {submitting ? "Loading..." : "Start Task"}{" "}
                </button>{" "}
                <button
                  onClick={() => navigate(-1)}
                  className="glass-button w-full py-3 rounded-xl font-medium inline-flex items-center justify-center"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
export default TaskPage;
