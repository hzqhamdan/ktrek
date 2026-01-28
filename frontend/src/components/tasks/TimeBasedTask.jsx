import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";

const TimeBasedTask = ({ task, onComplete }) => {
  const [currentTime, setCurrentTime] = useState('');
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
  }, [task]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8);
      setCurrentTime(timeStr);

      if (config) {
        console.log('⏰ Time Check:', {
          currentTime: timeStr,
          startTime: config.start_time,
          endTime: config.end_time,
          isAfterStart: timeStr >= config.start_time,
          isBeforeEnd: timeStr <= config.end_time,
          isWithin: timeStr >= config.start_time && timeStr <= config.end_time
        });
        setIsWithinWindow(timeStr >= config.start_time && timeStr <= config.end_time);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [config]);

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const response = await tasksAPI.submitTimeBased(task.id);
      
      if (response.success) {
        setResult(response.data);
        setTimeout(() => onComplete(response.data), 2500);
      } else {
        alert(response.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check in');
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
            <p className="text-5xl font-bold text-blue-600">{currentTime}</p>
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
