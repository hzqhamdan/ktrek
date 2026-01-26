// src/pages/CountConfirmTaskPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { tasksAPI } from "../api/tasks";
import { rewardsAPI } from "../api/rewards";
import CountConfirmTask from "../components/tasks/CountConfirmTask";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { useToast } from "../components/ui/toast-1";
import Loading from "../components/common/Loading";
import RewardNotificationModal from "../components/rewards/RewardNotificationModal";
import TierUnlockModal from "../components/rewards/TierUnlockModal";
import useRewardStore from "../store/rewardStore";
import { useTierUnlockDetection } from "../hooks/useTierUnlockDetection";

const CountConfirmTaskPage = () => {
  const { showToast } = useToast();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  
  // Tier unlock detection
  const { currentTierUnlock, checkForTierUnlock, clearTierUnlock, initializePreviousProgress } = useTierUnlockDetection();
  
  // Initialize tier progress on mount to prevent false notifications
  useEffect(() => {
    const initializeTierTracking = async () => {
      try {
        const response = await rewardsAPI.getUserStats();
        if (response.success && response.data.categories) {
          initializePreviousProgress(response.data.categories);
        }
      } catch (error) {
        console.error('Failed to initialize tier tracking:', error);
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
      const taskData = response.data || response;
      setTask(taskData);
    } catch (error) {
      console.error("Failed to load task:", error);
      showToast("Failed to load task details", "error");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (responseData) => {
    showToast(responseData.is_correct ? "Count submitted successfully!" : "Task completed", "success");
    
    // Handle reward notifications
    if (responseData?.rewards) {
      const { rewards } = responseData;
      
      // Update reward store with new stats
      useRewardStore.getState().updateStatsFromTaskCompletion(rewards);
      
      // Check for tier unlock FIRST (priority notification)
      checkForTierUnlock(responseData);
      
      // Show reward modal
      setRewardData(rewards);
      setShowRewardModal(true);
    } else {
      // If no rewards data, navigate immediately
      setTimeout(() => {
        navigate("/dashboard/progress");
      }, 1500);
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
          <h2 className="text-2xl font-bold bg-clip-text text-transparent mb-2">
            Task Not Found
          </h2>
          <p className="text-gray-600">This task does not exist.</p>
          <div className="cta-stack">
            <Button variant="glass" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light">
      {/* Tier Unlock Modal (Priority - shows first) */}
      {currentTierUnlock && (
        <TierUnlockModal
          isOpen={true}
          onClose={() => {
            clearTierUnlock();
            // After closing tier modal, show regular reward modal
            if (rewardData) {
              setShowRewardModal(true);
            }
          }}
          tier={currentTierUnlock.tier}
          category={currentTierUnlock.category}
          epEarned={currentTierUnlock.epEarned}
          completionPercentage={currentTierUnlock.completionPercentage}
        />
      )}
      
      {/* Reward Notification Modal */}
      <RewardNotificationModal 
        rewards={rewardData} 
        isOpen={showRewardModal && !currentTierUnlock}
        onClose={() => {
          setShowRewardModal(false);
          setRewardData(null);
          navigate("/dashboard/progress");
        }}
      />
      
      {/* Header */}
      <div className="backdrop-blur-md border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="glass-button px-4 py-2 rounded-full font-medium inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <CountConfirmTask task={task} onComplete={handleComplete} />
      </div>
    </div>
  );
};

export default CountConfirmTaskPage;
