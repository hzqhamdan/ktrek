import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { QrCode, X, Camera, AlertCircle, CheckCircle } from "lucide-react";
import { qrAPI } from "../../api/qr";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { GlassButton } from "../ui/glass-button";
import { useToast } from "../ui/toast-1";
const QRScannerModal = ({
  isOpen = true,
  onClose,
  onSuccess,
  onError,
  attractionId,
}) => {
  const { showToast } = useToast();
  const [error, setError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const html5QrCodeRef = useRef(null);
  useEffect(() => {
    if (isOpen) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);
  const startScanner = async () => {
    try {
      setError(null);
      
      // Check camera permission status first
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });
          console.log("Camera permission status:", permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            setError(
              <div className="space-y-3 text-left">
                <p className="font-semibold text-red-600">🚫 Camera Permission Denied</p>
                <p className="text-sm">You previously blocked camera access. To enable QR scanning:</p>
                <div className="bg-yellow-50 p-3 rounded-lg text-sm space-y-2">
                  <p className="font-semibold">📱 How to fix:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Tap the <strong>🔒 lock icon</strong> in your browser's address bar</li>
                    <li>Find <strong>"Camera"</strong> and change it to <strong>"Allow"</strong></li>
                    <li>Tap <strong>"Reload"</strong> or refresh this page</li>
                  </ol>
                </div>
                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer font-semibold">Browser-specific instructions</summary>
                  <div className="mt-2 space-y-1">
                    <p><strong>Chrome/Edge:</strong> Settings → Privacy → Site Settings → Camera</p>
                    <p><strong>Safari:</strong> Settings → Safari → Camera → Allow</p>
                    <p><strong>Firefox:</strong> Settings → Privacy → Permissions → Camera</p>
                  </div>
                </details>
              </div>
            );
            return;
          }
        } catch (permError) {
          console.log("Permission API not supported:", permError);
        }
      }
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      
      const config = {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
        aspectRatio: 1.0,
      };
      
      // Try to get cameras first
      try {
        const cameras = await Html5Qrcode.getCameras();
        console.log("Available cameras:", cameras);
        
        if (cameras && cameras.length > 0) {
          // Use the last camera (usually back camera on mobile)
          const cameraId = cameras[cameras.length - 1].id;
          await html5QrCode.start(
            cameraId,
            config,
            onScanSuccess,
            onScanError
          );
        } else {
          // Fallback to facingMode if no cameras detected
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
          );
        }
      } catch (cameraError) {
        console.log("Camera enumeration failed, using facingMode:", cameraError);
        // Fallback to facingMode
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanError
        );
      }
    } catch (err) {
      console.error("Scanner start error:", err);
      let errorMessage = "Failed to access camera. ";
      
      if (err.name === "NotAllowedError" || err.message?.includes("NotAllowedError")) {
        errorMessage += "Please allow camera permissions in your browser settings.";
      } else if (err.name === "NotFoundError" || err.message?.includes("NotFoundError")) {
        errorMessage += "No camera found on this device.";
      } else if (err.message?.includes("https") || err.message?.includes("secure")) {
        errorMessage += "Camera requires HTTPS connection.";
      } else {
        errorMessage += "Please check camera permissions and try again.";
      }
      
      setError(errorMessage);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        // Check if scanner is actually running before stopping
        const state = html5QrCodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error("Scanner stop error:", err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    // Stop scanning immediately after successful scan
    stopScanner();
    setScannedData(decodedText);

    // Verify QR code with backend
    await verifyQRCode(decodedText);
  };

  const onScanError = (errorMessage) => {
    // Ignore scan errors (they happen frequently while scanning)
    // Only log critical errors
    if (errorMessage.includes("NotAllowedError")) {
      setError("Camera permission denied");
    }
  };

  const verifyQRCode = async (qrCode) => {
    setIsVerifying(true);
    setError(null); // Clear previous errors
    try {
      console.log('[QRScanner] Verifying QR code:', qrCode);
      const response = await qrAPI.verifyQR(qrCode);
      console.log('[QRScanner] Verify response:', response);
      
      if (response.success) {
        const task = response.data.task;
        console.log('[QRScanner] Task verified:', task);
        
        // Check if task belongs to this attraction
        if (attractionId && task.attraction_id !== parseInt(attractionId)) {
          console.warn('[QRScanner] Wrong attraction!', { expected: attractionId, got: task.attraction_id });
          showToast("This QR code belongs to a different attraction.", "error");
          setError("Wrong attraction QR code");
          return;
        }
        
        showToast("QR Code verified !", "success");
        console.log('[QRScanner] Calling onSuccess with:', { task, qrCode });
        
        // Call success callback with task + scanned QR code
        if (onSuccess) {
          onSuccess({ task, qrCode });
        }
      } else {
        const msg = response.message || "Invalid QR code";
        console.error('[QRScanner] Verification failed:', msg, response);
        showToast(msg, "error");
        setError(msg);
        onError?.(msg);
      }
    } catch (error) {
      console.error("[QRScanner] QR verification error:", error);
      console.error("[QRScanner] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to verify QR code";
      showToast(errorMessage, "error");
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualEntry = () => {
    stopScanner();
    setShowManualInput(true);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      verifyQRCode(manualCode.trim());
      setShowManualInput(false);
      setManualCode("");
    } else {
      showToast("Please enter a QR code.", "error");
    }
  };

  const handleCancelManual = () => {
    setShowManualInput(false);
    setManualCode("");
    startScanner();
  };

  const handleRetry = () => {
    setError(null);
    setScannedData(null);
    startScanner();
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan QR Code" size="md">
      {" "}
      <div className="space-y-4">
        {" "}
        {/* Manual Input Form */}
        {showManualInput ? (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#F1EEE7' }}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <QrCode className="text-primary-600" size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Enter QR Code Manually
                  </h4>
                  <p className="text-sm text-gray-700">
                    Paste or type the QR code string from the attraction
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="manual-qr-code" className="block text-sm font-medium text-gray-700 mb-2">
                QR Code
              </label>
              <input
                id="manual-qr-code"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter or paste QR code here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
                disabled={isVerifying}
              />
            </div>

            <div className="flex gap-3">
              <GlassButton
                onClick={handleManualSubmit}
                disabled={isVerifying || !manualCode.trim()}
                className="flex-1"
                contentClassName="flex items-center justify-center gap-2"
              >
                {isVerifying ? "Verifying..." : "Verify Code"}
              </GlassButton>
              <GlassButton
                onClick={handleCancelManual}
                disabled={isVerifying}
                className="flex-1"
                contentClassName="flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Instead</span>
              </GlassButton>
            </div>
          </div>
        ) : (
          <>
            {/* Instructions */}{" "}
            <div className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#F1EEE7' }}>
              {" "}
              <div className="flex items-start space-x-3">
                {" "}
                <div className="flex-shrink-0">
                  {" "}
                  <QrCode className="text-primary-600" size={24} />{" "}
                </div>{" "}
                <div className="flex-1">
                  {" "}
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {" "}
                    How to scan{" "}
                  </h4>{" "}
                  <ul className="text-sm text-gray-700 space-y-1">
                    {" "}
                    <li>• Point your camera at the QR code</li>{" "}
                    <li>• Make sure the QR code is well-lit</li>{" "}
                    <li>• Hold steady until it scans automatically</li>{" "}
                  </ul>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Scanner Area */}{" "}
            <div className="relative">
              {" "}
              <div
                id="qr-reader"
                className="rounded-lg overflow-hidden bg-black"
                style={{ minHeight: "300px" }}
              />{" "}
          {/* Overlay when verifying */}{" "}
          {isVerifying && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
              {" "}
              <div className="text-center text-white">
                {" "}
                <div className="spinner mb-3"></div>{" "}
                <p className="font-medium">Verifying QR Code...</p>{" "}
              </div>{" "}
            </div>
          )}{" "}
          {/* Success Overlay */}{" "}
          {scannedData && !isVerifying && !error && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center rounded-lg">
              {" "}
              <div className="text-center text-white">
                {" "}
                <CheckCircle size={64} className="mx-auto mb-3" />{" "}
                <p className="font-bold text-xl">QR Code Scanned!</p>{" "}
                <p className="text-sm">Verifying...</p>{" "}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
        {/* Error Message */}{" "}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            {" "}
            <div className="flex items-start space-x-3">
              {" "}
              <AlertCircle
                className="text-red-600 flex-shrink-0"
                size={24}
              />{" "}
              <div className="flex-1">
                {" "}
                <h4 className="text-sm font-semibold text-red-900 mb-1">
                  {" "}
                  Scan Failed{" "}
                </h4>{" "}
                <p className="text-sm text-red-700">{error}</p>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
            {/* Action Buttons */}{" "}
            <div className="flex justify-between items-center">
              {" "}
              {error ? (
                <>
                  {" "}
                  <GlassButton
                    onClick={handleRetry}
                    className="w-48"
                    contentClassName="flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Try Again</span>
                  </GlassButton>
                  <GlassButton 
                    onClick={handleManualEntry}
                    className="w-48"
                    contentClassName="flex items-center justify-center"
                  >
                    Enter Manually
                  </GlassButton>
                </>
              ) : (
                <>
                  {" "}
                  <GlassButton 
                    onClick={handleManualEntry}
                    className="w-48"
                    contentClassName="flex items-center justify-center"
                  >
                    Enter Code Manually
                  </GlassButton>
                  <GlassButton 
                    onClick={handleClose}
                    className="w-48"
                    contentClassName="flex items-center justify-center"
                  >
                    Cancel
                  </GlassButton>
                </>
              )}{" "}
            </div>{" "}
            {/* Camera Permission Note */}{" "}
            <p className="text-xs text-gray-500 text-center">
              {" "}
              Camera access is required to scan QR codes. Your privacy is protected
              - no images are stored.{" "}
            </p>{" "}
          </>
        )}
      </div>{" "}
    </Modal>
  );
};
export default QRScannerModal;
