import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw } from "lucide-react";
import Button from "../common/Button";
const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const html5QrCodeRef = useRef(null);
  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);
  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);
      const html5QrCode = new Html5Qrcode("qr-scanner-container");
      html5QrCodeRef.current = html5QrCode;
      await html5QrCode.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        (decodedText) => {
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore routine scan errors
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Failed to start camera");
      setIsScanning(false);
      if (onScanError) {
        onScanError(err);
      }
    }
  };
  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current = null;
        })
        .catch(console.error);
    }
  };
  const handleRetry = () => {
    stopScanner();
    setTimeout(() => startScanner(), 100);
  };
  return (
    <div className="space-y-4">
      {" "}
      <div
        id="qr-scanner-container"
        className="rounded-lg overflow-hidden bg-black"
        style={{ minHeight: "300px" }}
      />{" "}
      {error && (
        <div className="text-center">
          {" "}
          <p className="text-red-600 mb-3">{error}</p>{" "}
          <Button onClick={handleRetry} icon={RefreshCw} variant="outline">
            {" "}
            Retry{" "}
          </Button>{" "}
        </div>
      )}{" "}
      {!error && !isScanning && (
        <div className="text-center">
          {" "}
          <Camera className="mx-auto mb-3 text-gray-400" size={48} />{" "}
          <p className="text-gray-600">Starting camera...</p>{" "}
        </div>
      )}{" "}
    </div>
  );
};
export default QRScanner;
