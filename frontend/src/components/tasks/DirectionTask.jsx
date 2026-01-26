import React, { useState } from "react";
import { Compass, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";

const DirectionTask = ({ task, onComplete }) => {
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Direction options (simplified list format like Quiz task)
  const directions = [
    { name: "North", icon: "↑" },
    { name: "Northeast", icon: "↗" },
    { name: "East", icon: "→" },
    { name: "Southeast", icon: "↘" },
    { name: "South", icon: "↓" },
    { name: "Southwest", icon: "↙" },
    { name: "West", icon: "←" },
    { name: "Northwest", icon: "↖" },
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
      const response = await tasksAPI.submitDirection(task.id, selectedDirection);

      if (response.success) {
        setResult(response.data);

        // Wait 2.5 seconds to show result, then call onComplete
        setTimeout(() => {
          onComplete(response.data);
        }, 2500);
      } else {
        console.error('Backend error response:', response);
        alert(response.message || 'Failed to submit direction');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting direction - Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to submit direction: ${errorMessage}`);
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

        {/* Direction Options (Simple List Format) */}
        <div className="space-y-3 mb-8">
          {directions.map((direction, index) => {
            const isSelected = selectedDirection === direction.name;
            
            return (
              <motion.div
                key={direction.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  type="button"
                  onClick={() => handleSelectDirection(direction.name)}
                  disabled={isSubmitting}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                    ${isSelected 
                      ? 'border-primary-500 bg-orange-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 hover:border-primary-300 bg-white hover:shadow-md'
                    }
                    ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{direction.icon}</span>
                    <span className={`font-medium text-lg ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                      {direction.name}
                    </span>
                  </div>
                </button>
              </motion.div>
            );
          })}
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
