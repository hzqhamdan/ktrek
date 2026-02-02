import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { qrAPI } from '../api/qr';
import { tasksAPI } from '../api/tasks';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useToast } from "../components/ui/toast-1";
import Loading from "../components/common/Loading";

const QRCheckInSuccessPage = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  
  const qrCode = searchParams.get('code');
  const taskId = searchParams.get('task');

  useEffect(() => {
    verifyQRCode();
  }, [qrCode]);

  const verifyQRCode = async () => {
    if (!qrCode) {
      setError('Invalid QR code. No code provided.');
      setVerifying(false);
      setLoading(false);
      return;
    }

    try {
      setVerifying(true);
      
      // Verify QR code with backend
      const response = await qrAPI.verifyQR(qrCode);
      
      if (response.success && response.data) {
        setTask(response.data);
        setError(null);
      } else {
        setError(response.message || 'Invalid QR code');
      }
    } catch (err) {
      console.error('QR verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify QR code');
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    if (task) {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Not logged in - redirect to login with return path
        showToast("Please login to complete check-in.", "error");
        navigate('/login', { 
          state: { 
            returnTo: `/dashboard/tasks/checkin/${task.id}`,
            fromQR: true,
            task: task 
          } 
        });
      } else {
        // Logged in - proceed to check-in
        navigate(`/dashboard/tasks/checkin/${task.id}`, {
          state: { task }
        });
      }
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light relative overflow-hidden flex items-center justify-center p-4">
        <Card padding="lg" className="max-w-md w-full text-center">
          <Loading message="Verifying QR Code..." size="lg" />
          <p className="text-gray-600 mt-2">Please wait while we verify your check-in.</p>
        </Card>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-light relative overflow-hidden flex items-center justify-center p-4">
        <Card padding="lg" className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid QR Code</h2>
          <p className="text-gray-600 mb-6">{error || 'This QR code is not valid or has expired.'}</p>
          <Button variant="glass" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light relative overflow-hidden flex items-center justify-center p-4">
      <Card padding="lg" className="max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">QR Code Verified!</h1>
          <p className="text-gray-600">Ready to check in at this location</p>
        </div>

        {/* Task Info */}
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#F1EEE7' }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F1EEE7' }}>
              <MapPin className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">{task.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{task.description || 'Check in at this location'}</p>
              {task.attraction_name && (
                <div className="flex items-center gap-1 text-sm text-primary-700 font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>{task.attraction_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6" style={{ backgroundColor: '#F1EEE7' }}>
          <h4 className="font-semibold text-gray-900 mb-2">Next Step:</h4>
          <p className="text-sm text-gray-700">
            {localStorage.getItem('token') 
              ? "Tap the button below to continue. You can complete check-in using QR or your live location."
              : "You'll need to login first, then we'll bring you back to finish your check-in."}
          </p>
        </div>

        <div className="cta-stack">
          {/* Check In Button */}
          <Button 
            variant="glass" 
            onClick={handleCheckIn}
            className="w-full"
            icon={ArrowRight}
          >
            Complete Check-In
          </Button>

          {/* Cancel */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-gray-600 font-medium py-2"
          >
            Cancel
          </button>
        </div>
      </Card>
    </div>
  );
};

export default QRCheckInSuccessPage;
