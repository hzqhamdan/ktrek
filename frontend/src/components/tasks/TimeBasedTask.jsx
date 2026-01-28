import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";

const TimeBasedTask = ({ task, onComplete }) => {
  const [currentTime, setCurrentTime] = useState('');
  const [serverTime, setServerTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState(null);
  const [isWithinWindow, setIsWithinWindow] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (task.task_config) {
      const cfg = JSON.parse(task.task_config);
      console.log('📝 Parsed config:', cfg);
      
      // Normalize time format to HH:mm:ss
      if (cfg.start_time && cfg.start_time.length === 5) {
        cfg.start_time = cfg.start_time + ':00';
      }
      if (cfg.end_time && cfg.end_time.length === 5) {
        cfg.end_time = cfg.end_time + ':00';
      }
      
      console.log('📝 Normalized config:', cfg);
      setConfig(cfg);
    }
    
    // Set initial server time from task response
    if (task.server_time) {
      setServerTime(task.server_time);
    }
    
    // Fetch updated server time periodically
    const fetchServerTime = async () => {
      try {
        const response = await tasksAPI.getById(task.id);
        if (response.success && response.data.server_time) {
          setServerTime(response.data.server_time);
        } else if (response.server_time) {
          setServerTime(response.server_time);
        }
      } catch (error) {
        console.error('Failed to fetch server time:', error);
      }
    };
    
    const serverTimeInterval = setInterval(fetchServerTime, 5000); // Update every 5 seconds
    
    return () => clearInterval(serverTimeInterval);
  }, [task]);

  // Update current time display every second (for smooth UI)
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().slice(0, 8));
    };
    
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if server time is within window
  useEffect(() => {
    if (!config || !serverTime) return;

    const isWithin = serverTime >= config.start_time && serverTime <= config.end_time;
    console.log('⏰ Time Check:', {
      serverTime: serverTime,
      startTime: config.start_time,
      endTime: config.end_time,
      isAfterStart: serverTime >= config.start_time,
      isBeforeEnd: serverTime <= config.end_time,
      isWithin: isWithin
    });
    setIsWithinWindow(isWithin);
  }, [config, serverTime]);

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      console.log('🔍 Submitting time-based task:', task.id);
      const response = await tasksAPI.submitTimeBased(task.id);
      console.log('🔍 Response:', response);
      
      if (response.success) {
        setResult(response.data);
        setTimeout(() => onComplete(response.data), 2500);
      } else {
        console.error('❌ Task submission failed:', response);
        alert(response.message || 'Failed to check in');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('❌ Error during check in:', error);
      alert('Failed to check in: ' + (error.message || 'Unknown error'));
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card padding="xl" className="text-center bg-green-50 border-green-200">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
              <CheckCircle className="w-24 h-24 mx-auto text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4 text-green-800">Perfect Timing!</h2>
            <p className="text-lg text-gray-700 mb-6">{result.message}</p>
            {result.rewards && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="mt-6 p-4 bg-white rounded-lg border-2 border-primary-200">
                <p className="text-sm font-semibold text-primary-800 mb-2">Rewards Earned:</p>
                <div className="flex justify-center gap-6">
                  <div><p className="text-2xl font-bold text-primary-600">+{result.rewards.xp_earned || 0}</p><p className="text-xs text-gray-600">XP</p></div>
                  <div><p className="text-2xl font-bold text-primary-600">+{result.rewards.ep_earned || 0}</p><p className="text-xs text-gray-600">EP</p></div>
                </div>
              </motion.div>
            )}
            <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card padding="xl" gradient>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Clock className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold">{task.name}</h2>
          <p className="text-gray-600">{task.description}</p>
        </div>

        {task.guide && (
          <Card className="mb-8 bg-blue-50 border-blue-200" padding="md">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Guide</h3>
            <div className="text-sm text-blue-800 space-y-1">
              {task.guide.split('\n').map((line, idx) => <p key={idx}>{line}</p>)}
            </div>
          </Card>
        )}

        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" padding="lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Current Time</p>
            {currentTime ? (
              <p className="text-5xl font-bold text-blue-600">{currentTime}</p>
            ) : (
              <p className="text-3xl text-gray-400">Loading...</p>
            )}
            {serverTime && (
              <p className="text-xs text-gray-500 mt-2">
                Server time: {serverTime} (validation reference)
              </p>
            )}
          </div>
        </Card>

        {config && (
          <Card className="mb-6 bg-purple-50 border-purple-200" padding="md">
            <p className="text-center text-gray-700">
              Valid time window: <span className="font-bold text-purple-900">{config.start_time} - {config.end_time}</span>
            </p>
          </Card>
        )}

        {isWithinWindow ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <Card className="mb-6 bg-green-50 border-green-200" padding="md">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="text-green-600" />
                <p className="text-green-800 font-semibold">You're within the time window! Check in now!</p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <Card className="mb-6 bg-orange-50 border-orange-200" padding="md">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="text-orange-600" />
              <p className="text-orange-800 text-center">
                Please visit during the valid time window
              </p>
            </div>
          </Card>
        )}

        <Button variant="glass" onClick={handleCheckIn}
          disabled={!isWithinWindow || isSubmitting}
          isLoading={isSubmitting} className="w-full py-4 text-lg">
          {isSubmitting ? 'Checking In...' : 'Check In Now'}
        </Button>
      </Card>
    </div>
  );
};

export default TimeBasedTask;
