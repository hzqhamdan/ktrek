import React, { useState } from "react";
import { Compass, Navigation, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../common/Card";
import Button from "../common/Button";

const DirectionTask = ({ task, onComplete }) => {
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Compass directions with angles for visual positioning
  const directions = [
    { name: "North", short: "N", angle: 0, color: "#ef4444" },
    { name: "Northeast", short: "NE", angle: 45, color: "#f97316" },
    { name: "East", short: "E", angle: 90, color: "#eab308" },
    { name: "Southeast", short: "SE", angle: 135, color: "#84cc16" },
    { name: "South", short: "S", angle: 180, color: "#22c55e" },
    { name: "Southwest", short: "SW", angle: 225, color: "#14b8a6" },
    { name: "West", short: "W", angle: 270, color: "#3b82f6" },
    { name: "Northwest", short: "NW", angle: 315, color: "#8b5cf6" },
  ];

  const handleSelectDirection = (direction) => {
    setSelectedDirection(direction);
  };

  const handleSubmit = async () => {
    if (!selectedDirection) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost/backend/api/tasks/submit-direction.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          task_id: task.id,
          selected_direction: selectedDirection
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);

        // Wait 2.5 seconds to show result, then call onComplete
        setTimeout(() => {
          onComplete(data.data);
        }, 2500);
      } else {
        alert(data.message || 'Failed to submit direction');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting direction:', error);
      alert('Failed to submit direction');
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Card
            padding="xl"
            className={`text-center ${result.is_correct ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              {result.is_correct ? (
                <CheckCircle className="w-24 h-24 mx-auto text-green-600" />
              ) : (
                <XCircle className="w-24 h-24 mx-auto text-orange-600" />
              )}
            </motion.div>

            <h2 className={`text-3xl font-bold mb-4 ${result.is_correct ? 'text-green-800' : 'text-orange-800'}`}>
              {result.is_correct ? 'Correct!' : 'Not Quite!'}
            </h2>

            <div className="space-y-3 mb-6">
              <p className="text-lg text-gray-700">
                {result.message}
              </p>

              <div className="flex justify-center gap-8 text-center">
                <div>
                  <p className="text-sm text-gray-600">Your Answer</p>
                  <p className="text-2xl font-bold text-gray-800">{result.selected_direction}</p>
                </div>

                {!result.is_correct && (
                  <div>
                    <p className="text-sm text-gray-600">Correct Direction</p>
                    <p className="text-2xl font-bold text-green-600">{result.correct_direction}</p>
                  </div>
                )}
              </div>

              {result.rewards && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-white rounded-lg border-2 border-primary-200"
                >
                  <p className="text-sm font-semibold text-primary-800 mb-2">Rewards Earned:</p>
                  <div className="flex justify-center gap-6">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">+{result.rewards.xp_earned || 0}</p>
                      <p className="text-xs text-gray-600">XP</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-600">+{result.rewards.ep_earned || 0}</p>
                      <p className="text-xs text-gray-600">EP</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <p className="text-sm text-gray-500">Redirecting...</p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card padding="xl" gradient>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Compass className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{task.name}</h2>
          <p className="text-gray-600">{task.description}</p>
        </div>

        {/* Guide */}
        {task.guide && (
          <Card className="mb-8 bg-blue-50 border-blue-200" padding="md">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span className="text-blue-600">📋</span> Guide
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              {task.guide.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </Card>
        )}

        {/* Compass Interface */}
        <div className="mb-8">
          <div className="relative w-80 h-80 mx-auto">
            {/* Compass Rose */}
            <div className="absolute inset-0 rounded-full border-8 border-gray-300 bg-white shadow-2xl flex items-center justify-center">
              {/* Center compass icon */}
              <div className="absolute">
                <Navigation className="w-12 h-12 text-gray-400" style={{ transform: 'rotate(45deg)' }} />
              </div>

              {/* Direction buttons positioned around the compass */}
              {directions.map((direction, index) => {
                const isSelected = selectedDirection === direction.name;
                const radius = 120; // Distance from center
                const angleRad = (direction.angle - 90) * (Math.PI / 180);
                const x = Math.cos(angleRad) * radius;
                const y = Math.sin(angleRad) * radius;

                return (
                  <motion.button
                    key={direction.name}
                    onClick={() => handleSelectDirection(direction.name)}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`absolute w-16 h-16 rounded-full font-bold text-sm flex flex-col items-center justify-center transition-all shadow-lg disabled:opacity-50
                      ${isSelected 
                        ? 'bg-primary-600 text-white ring-4 ring-primary-300 scale-110' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <span className="text-xs font-semibold">{direction.short}</span>
                    {direction.short.length === 1 && (
                      <span className="text-[10px] opacity-70 mt-1">{direction.name}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Cardinal direction labels */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-red-600 font-bold text-lg">
              ↑ North
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-gray-600 font-bold text-lg">
              ↓ South
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-10 text-gray-600 font-bold text-lg">
              → East
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10 text-gray-600 font-bold text-lg">
              ← West
            </div>
          </div>

          {selectedDirection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6"
            >
              <p className="text-lg text-gray-700">
                Selected: <span className="font-bold text-primary-600">{selectedDirection}</span>
              </p>
            </motion.div>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            variant="glass"
            onClick={handleSubmit}
            disabled={!selectedDirection || isSubmitting}
            isLoading={isSubmitting}
            className="w-full sm:w-auto px-12 py-4 text-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Direction'}
          </Button>

          {!selectedDirection && (
            <p className="mt-3 text-sm text-gray-500">
              Please select a direction before submitting
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DirectionTask;
