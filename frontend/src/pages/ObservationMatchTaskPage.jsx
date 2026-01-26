import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { tasksAPI } from "../api/tasks";
import ObservationMatchTask from "../components/tasks/ObservationMatchTask";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { useToast } from "../components/ui/toast-1";
import Loading from "../components/common/Loading";
import RewardNotificationModal from "../components/rewards/RewardNotificationModal";
import TierUnlockModal from "../components/rewards/TierUnlockModal";
import useRewardStore from "../store/rewardStore";
import { useTierUnlockDetection } from "../hooks/useTierUnlockDetection";

const ObservationMatchTaskPage = () => {
  const { showToast } = useToast();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  const { currentTierUnlock, checkForTierUnlock, clearTierUnlock, initializePreviousProgress } = useTierUnlockDetection();

  useEffect(() => {
    const initializeTierTracking = async () => {
      try {
        const response = await fetch('http://localhost/backend/api/rewards/get-user-stats.php', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success && data.data?.categories) {
          initializePreviousProgress(data.data.categories);
        }
      } catch (error) {
        // Silently fail - tier unlock detection is a nice-to-have feature
      }
    };
    initializeTierTracking();
  }, [initializePreviousProgress]);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getById(taskId);
      setTask(response.data || response);
    } catch (error) {
      console.error("Failed to load task:", error);
      showToast("Failed to load task details", "error");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (responseData) => {
    showToast(responseData.is_correct ? "Perfect matches!" : "Task completed", "success");

    if (responseData?.rewards) {
      useRewardStore.getState().updateStatsFromTaskCompletion(responseData.rewards);
      checkForTierUnlock(responseData);
      setRewardData(responseData.rewards);
      setShowRewardModal(true);
    } else {
      setTimeout(() => navigate("/dashboard/progress"), 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center">
        <Loading message="Loading task..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center p-4">
        <Card padding="lg" className="max-w-md w-full text-center" gradient>
          <h2 className="text-2xl font-bold">Task Not Found</h2>
          <p className="text-gray-600">This task does not exist.</p>
          <Button variant="glass" onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light">
      {currentTierUnlock && (
        <TierUnlockModal
          isOpen={true}
          onClose={() => {
            clearTierUnlock();
            if (rewardData) setShowRewardModal(true);
          }}
          tier={currentTierUnlock.tier}
          category={currentTierUnlock.category}
          epEarned={currentTierUnlock.epEarned}
          completionPercentage={currentTierUnlock.completionPercentage}
        />
      )}

      <RewardNotificationModal
        rewards={rewardData}
        isOpen={showRewardModal && !currentTierUnlock}
        onClose={() => {
          setShowRewardModal(false);
          setRewardData(null);
          navigate("/dashboard/progress");
        }}
      />

      <div className="backdrop-blur-md border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="glass-button px-4 py-2 rounded-full font-medium inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <ObservationMatchTask task={task} onComplete={handleComplete} />
      </div>
    </div>
  );
};

export default ObservationMatchTaskPage;
