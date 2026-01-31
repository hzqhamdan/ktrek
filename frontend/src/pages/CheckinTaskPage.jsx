// src/pages/CheckinTaskPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, QrCode, MapPin } from "lucide-react";
import { tasksAPI } from "../api/tasks";
import { rewardsAPI } from "../api/rewards";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { GlassButton } from "../components/ui/glass-button";
import QRScannerModal from "../components/qr/QRScannerModal";
import { useToast } from "../components/ui/toast-1";
import RewardNotificationModal from "../components/rewards/RewardNotificationModal";
import TierUnlockModal from "../components/rewards/TierUnlockModal";
import useRewardStore from "../store/rewardStore";
import { useTierUnlockDetection } from "../hooks/useTierUnlockDetection";
import Loading from "../components/common/Loading";

const CheckinTaskPage = () => {
  const { showToast } = useToast();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [checkingInViaQR, setCheckingInViaQR] = useState(false);
  const [checkingInViaLocation, setCheckingInViaLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
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
    console.log('CheckinTaskPage mounted', { taskId, locationState: location.state });
    
    // Check if task was passed via state (from QR scan or task start)
    if (location.state?.task) {
      console.log('Task received from state:', location.state.task);
      setTask(location.state.task);
      setLoading(false);
      
      // Do not auto-open scanner; user should choose method explicitly
      // (Scan QR Code or Use Live Location)

    } else {
      console.log('No task in state, loading from API');
      loadTask();
    }
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
  const handleComplete = (response) => {
    console.log('[CheckIn] handleComplete called with response:', response);
    showToast("Check-in completed successfully!", "success");
    
    // Handle reward notifications
    const responseData = response?.data || response;
    console.log('[CheckIn] responseData:', responseData);
    
    if (responseData?.rewards) {
      const { rewards } = responseData;
      console.log('[CheckIn] rewards:', rewards);
      
      // Update reward store with new stats
      useRewardStore.getState().updateStatsFromTaskCompletion(rewards);
      
      // Check for tier unlock FIRST (priority notification)
      console.log('[CheckIn] Calling checkForTierUnlock with responseData:', responseData);
      checkForTierUnlock(responseData);
      
      // Show reward modal with all reward data
      console.log('[CheckIn] Setting rewardData:', rewards);
      console.log('[CheckIn] currentTierUnlock:', currentTierUnlock);
      setRewardData(rewards);
      setShowRewardModal(true);
      console.log('[CheckIn] showRewardModal set to true');
    } else {
      console.log('[CheckIn] No rewards in response');
      // If no rewards data, navigate immediately
      setTimeout(() => {
        navigate("/dashboard/progress");
      }, 1500);
    }
  };

  const handleQRSuccess = async ({ qrCode }) => {
    console.log('[CheckIn] handleQRSuccess called with qrCode:', qrCode);
    // QR scanned & verified: submit check-in immediately using qr_code
    try {
      setCheckingInViaQR(true);
      setShowScanner(false);

      console.log('[CheckIn] Submitting check-in with taskId:', taskId, 'qrCode:', qrCode);
      const response = await tasksAPI.submitCheckin(taskId, { qr_code: qrCode });
      console.log('[CheckIn] Submit response:', response);
      
      if (response.success) {
        const v = response.data?.verification;
        const distanceText = v?.distance_m != null ? ` Distance: ${Math.round(v.distance_m)}m.` : "";
        showToast(`Check-in successful via QR!${distanceText}`, "success");
        console.log('[CheckIn] Calling handleComplete with response');
        handleComplete(response); // Pass full response, not just response.data
      } else {
        console.error('[CheckIn] Submit failed:', response);
        showToast(response.message || "Check-in failed", "error");
      }
    } catch (error) {
      console.error('[CheckIn] Submit error:', error);
      console.error('[CheckIn] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const msg = error.response?.data?.message || error.message || "QR check-in failed";
      showToast(msg, "error");
    } finally {
      setCheckingInViaQR(false);
    }
  };

  const handleQRError = (error) => {
    showToast(error || "Invalid QR code", "error");
  };

  const formatDistance = (distanceM) => {
    if (distanceM == null || Number.isNaN(distanceM)) return null;

    const m = Number(distanceM);
    if (m >= 500) {
      const km = m / 1000;
      const rounded = Math.round(km * 10) / 10; // 1 decimal
      // drop trailing .0
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}km`;
    }

    return `${Math.round(m)}m`;
  };

  const handleLocationCheckin = async () => {
    setLocationError(null);

    try {
      setCheckingInViaLocation(true);

      if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser", "error");
        return;
      }

      const getPosition = () =>
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        });

      const position = await getPosition();

      // If accuracy is extremely large, the browser/device is likely providing an approximate
      // (non-GPS) location. Avoid calling the backend with a bad fix.
      const acc = Number(position.coords.accuracy);

      // Strict accuracy requirement: must be <= 150m to attempt location check-in
      const MAX_ALLOWED_ACCURACY_M = 150;
      if (!Number.isFinite(acc) || acc > MAX_ALLOWED_ACCURACY_M) {
        const accText = formatDistance(acc);
        const msg =
          `We couldn’t get a precise enough location${accText ? ` (accuracy: ${accText})` : ""}. ` +
          "Please enable Precise Location / GPS and try again outdoors.\n\n" +
          "iPhone: Settings → Privacy & Security → Location Services → (Your browser) → Precise Location ON\n" +
          "Android: Site settings → Location → Allow → Use precise location ON";
        showToast("Location is not accurate enough. Please enable Precise Location and try again.", "error");
        setLocationError(msg);
        return;
      }

      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: acc,
      };

      const response = await tasksAPI.submitCheckin(task.id, payload);
      if (response.success) {
        const v = response.data?.verification;

        const formattedDistance = formatDistance(v?.distance_m);
        const distanceText = formattedDistance ? ` You were ${formattedDistance} away.` : "";
        const radiusText = v?.allowed_radius_m != null ? ` Allowed radius: ${Math.round(v.allowed_radius_m)}m.` : "";
        const accuracyText = v?.gps_accuracy_m != null ? ` GPS accuracy: ${Math.round(v.gps_accuracy_m)}m.` : "";

        showToast(`Check-in successful via location!${distanceText}${radiusText}${accuracyText}`, "success");
        handleComplete(response); // Pass full response, not just response.data
      } else {
        showToast(response.message || "Check-in failed", "error");
      }
    } catch (error) {
      // Normalize geolocation errors vs API errors
      if (typeof error?.code === "number") {
        let errorMsg = "Unable to get your location. ";
        let helpText = "";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += "Please enable location permissions.";
            helpText = "Go to your browser/device settings and allow location access for this site.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += "Location information unavailable.";
            helpText = "Make sure GPS is enabled on your device and you have a clear view of the sky.";
            break;
          case error.TIMEOUT:
            errorMsg += "Location request timed out.";
            helpText = "Try again in a location with better GPS signal.";
            break;
          default:
            errorMsg += "Unknown error occurred.";
            helpText = "Please try again.";
        }

        showToast(errorMsg, "error");
        setLocationError(`${errorMsg} ${helpText}`);
      } else {
        const msg = error.response?.data?.message || error.message || "Check-in failed. Please try again.";
        showToast(msg, "error");
        setLocationError(msg);
      }
    } finally {
      setCheckingInViaLocation(false);
    }
  };
  console.log('Render state:', { loading, task, showScanner, checkingInViaQR });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center">
        {" "}
        <Loading message="Loading task..." />{" "}
      </div>
    );
  }
  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light flex items-center justify-center p-4">
        {" "}
        <Card padding="lg" className="max-w-md w-full text-center" gradient>
          {" "}
          <h2 className="text-2xl font-bold bg-clip-text text-transparent mb-2">
            Task Not Found
          </h2>{" "}
          <p className="text-gray-600">This task does not exist.</p>{" "}
          <div className="cta-stack">
            <Button variant="glass" onClick={() => navigate(-1)}>
              Go Back
            </Button>{" "}
          </div>
        </Card>{" "}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light ">
      {" "}
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
      {console.log('[CheckIn] Rendering RewardNotificationModal with:', {
        rewardData,
        showRewardModal,
        currentTierUnlock,
        isOpen: showRewardModal && !currentTierUnlock
      })}
      <RewardNotificationModal 
        rewards={rewardData} 
        isOpen={showRewardModal && !currentTierUnlock}
        onClose={() => {
          console.log('[CheckIn] Reward modal onClose called');
          setShowRewardModal(false);
          setRewardData(null);
          navigate("/dashboard/progress");
        }}
      />
      
      {/* Header */}{" "}
      <div className="backdrop-blur-md border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
        {" "}
        <div className="max-w-4xl mx-auto px-4 py-4">
          {" "}
          <GlassButton
            onClick={() => navigate(-1)}
            size="sm"
            className="inline-flex"
            contentClassName="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> <span>Back</span>
          </GlassButton>
        </div>{" "}
      </div>{" "}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {" "}
        
        {/* Unified check-in card (QR OR Location) */}
        <Card padding="lg" className="mb-4 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">How would you like to check in?</h2>
          <p className="text-gray-600 mb-4">
            Choose one method to verify you’re at <span className="font-semibold">{task?.attraction_name || "this attraction"}</span>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassButton
              onClick={() => setShowScanner(true)}
              disabled={checkingInViaQR || checkingInViaLocation}
              className="w-full"
              contentClassName="flex items-center justify-center gap-3 w-full"
            >
              <QrCode className="w-5 h-5" />
              <span>Scan QR Code</span>
            </GlassButton>

            <GlassButton
              onClick={handleLocationCheckin}
              disabled={checkingInViaQR || checkingInViaLocation}
              className="w-full"
              contentClassName="flex items-center justify-center gap-3 w-full"
            >
              {checkingInViaLocation ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Checking in...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>Use Live Location</span>
                </>
              )}
            </GlassButton>
          </div>

          {/* Location Error Message */}
          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 text-left">
              <p className="text-red-800 text-sm">{locationError}</p>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Tip: For best accuracy, enable GPS and try outdoors.
          </p>
        </Card>
        
        {/* QR Scanner Modal */}
        {showScanner && (
          <QRScannerModal
            isOpen={showScanner}
            onClose={() => setShowScanner(false)}
            onSuccess={handleQRSuccess}
            onError={handleQRError}
            attractionId={task?.attraction_id}
          />
        )}
      </div>{" "}
    </div>
  );
};
export default CheckinTaskPage;
