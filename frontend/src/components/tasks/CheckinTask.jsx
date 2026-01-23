import React, { useState } from "react";
import { MapPin, CheckCircle, Navigation } from "lucide-react";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";
import { useToast } from "../ui/toast-1";
const CheckinTask = ({ task, onComplete }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  const handleCheckin = async () => {
    setIsSubmitting(true);
    setLocationError(null);
    
    try {
      // Get user's current location
      if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser", "error");
        setIsSubmitting(false);
        return;
      }

      // Request permission explicitly first
      navigator.permissions?.query({ name: 'geolocation' })
        .then((permissionStatus) => {
          console.log('Geolocation permission:', permissionStatus.state);
          
          // Proceed with getting location
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const location = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                };

                const response = await tasksAPI.submitCheckin(task.id, location);
                if (response.success) {
                  const v = response.data?.verification;
                  const distanceText = v?.distance_m != null ? ` You were ${Math.round(v.distance_m)}m away.` : "";
                  const radiusText = v?.allowed_radius_m != null ? ` Allowed radius: ${Math.round(v.allowed_radius_m)}m.` : "";
                  const accuracyText = v?.gps_accuracy_m != null ? ` GPS accuracy: ${Math.round(v.gps_accuracy_m)}m.` : "";

                  setIsCheckedIn(true);
                  showToast(`Check-in successful!${distanceText}${radiusText}${accuracyText}`, "success");
                  setTimeout(() => {
                    onComplete(response.data);
                  }, 2000);
                } else {
                  showToast(response.message || "Check-in failed", "error");
                }
              } catch (error) {
                console.error("Error checking in:", error);
                const errorMsg = error.response?.data?.message || error.message || "Check-in failed. Please try again.";
                showToast(errorMsg, "error");
                setLocationError(errorMsg);
              } finally {
                setIsSubmitting(false);
              }
            },
            (error) => {
              console.error("Geolocation error:", error);
              let errorMsg = "Unable to get your location. ";
              let helpText = "";
              
              switch(error.code) {
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
                  helpText = "Please try again or contact support.";
              }
              
              showToast(errorMsg, "error");
              setLocationError(errorMsg + " " + helpText);
              setIsSubmitting(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000, // Increased timeout to 15s
              maximumAge: 0
            }
          );
        })
        .catch(() => {
          // Permissions API not supported, just try to get location
          console.log('Permissions API not supported, proceeding with geolocation');
          
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const location = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                };

                const response = await tasksAPI.submitCheckin(task.id, location);
                if (response.success) {
                  const v = response.data?.verification;
                  const distanceText = v?.distance_m != null ? ` You were ${Math.round(v.distance_m)}m away.` : "";
                  const radiusText = v?.allowed_radius_m != null ? ` Allowed radius: ${Math.round(v.allowed_radius_m)}m.` : "";
                  const accuracyText = v?.gps_accuracy_m != null ? ` GPS accuracy: ${Math.round(v.gps_accuracy_m)}m.` : "";

                  setIsCheckedIn(true);
                  showToast(`Check-in successful!${distanceText}${radiusText}${accuracyText}`, "success");
                  setTimeout(() => {
                    onComplete(response.data);
                  }, 2000);
                } else {
                  showToast(response.message || "Check-in failed", "error");
                }
              } catch (error) {
                console.error("Error checking in:", error);
                const errorMsg = error.response?.data?.message || error.message || "Check-in failed. Please try again.";
                showToast(errorMsg, "error");
                setLocationError(errorMsg);
              } finally {
                setIsSubmitting(false);
              }
            },
            (error) => {
              console.error("Geolocation error:", error);
              let errorMsg = "Unable to get your location. ";
              let helpText = "";
              
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMsg += "Location permission denied.";
                  helpText = "Please enable location in your device settings and reload the page.";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMsg += "Location unavailable.";
                  helpText = "Ensure GPS is enabled.";
                  break;
                case error.TIMEOUT:
                  errorMsg += "Location timeout.";
                  helpText = "Try again with better signal.";
                  break;
                default:
                  errorMsg += "Unknown error.";
              }
              
              showToast(errorMsg, "error");
              setLocationError(errorMsg + " " + helpText);
              setIsSubmitting(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            }
          );
        });
    } catch (error) {
      console.error("Error in check-in process:", error);
      showToast("Check-in failed. Please try again.", "error");
      setIsSubmitting(false);
    }
  };
  if (isCheckedIn) {
    return (
      <div className="max-w-2xl mx-auto">
        {" "}
        <Card className="text-center" padding="lg">
          {" "}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            {" "}
            <CheckCircle className="text-green-600" size={48} />{" "}
          </div>{" "}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Check - in Complete!
          </h2>{" "}
          <p className="text-lg text-gray-600 mb-6">
            {" "}
            You 've successfully checked in at this location.{" "}
          </p>{" "}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            {" "}
            <p className="text-green-800">
              {" "}
              Great job! Your progress has been updated.{" "}
            </p>{" "}
          </div>{" "}
          <Button variant="primary" size="lg" onClick={onComplete}>
            {" "}
            Continue{" "}
          </Button>{" "}
        </Card>{" "}
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto">
      {" "}
      <Card padding="lg">
        {" "}
        {/* Location Icon */}{" "}
        <div className="text-center mb-6">
          {" "}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 rounded-full mb-4">
            {" "}
            <MapPin className="text-[#120c07]" size={48} />{" "}
          </div>{" "}
          <h2 className="text-2xl font-bold text-gray-900 mb-2"> Check In </h2>{" "}
          <p className="text-gray-600"> {task.description} </p>{" "}
        </div>{" "}
        {/* Instructions */}{" "}
        <div className="border border-gray-200 rounded-lg p-4 mb-6" style={{ backgroundColor: '#F1EEE7' }}>
          {" "}
          <h3 className="font-semibold text-gray-900 mb-2">
            How to check in:
          </h3>{" "}
          <ul className="text-sm text-gray-700 space-y-1">
            {" "}
            <li> •Make sure you 're physically present at the location</li>{" "}
            <li> •Click the "Check In Now" button below </li>{" "}
            <li> •Your location will be verified automatically </li>{" "}
          </ul>{" "}
        </div>{" "}
        {/* Check-in Button */}{" "}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={CheckCircle}
          onClick={handleCheckin}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {" "}
          Check In Now{" "}
        </Button>{" "}
        {/* Help Text */}{" "}
        <p className="text-center text-sm text-gray-500 mt-4">
          {" "}
          Having trouble ? Make sure location services are enabled and you 're
          at the correct location.{" "}
        </p>
        {/* Location Error Message */}
        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-red-800 text-sm">{locationError}</p>
          </div>
        )}{" "}
      </Card>{" "}
    </div>
  );
};
export default CheckinTask;
