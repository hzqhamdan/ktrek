import React, { useState } from "react";
import { Hash, Plus, Minus, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";

const CountConfirmTask = ({ task, onComplete }) => {
  const [count, setCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  const handleDecrement = () => {
    setCount(prev => Math.max(0, prev - 1));
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setCount(Math.max(0, value));
  };

  const handleSubmit = async () => {
    if (count === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await tasksAPI.submitCountConfirm(task.id, count);

      if (response.success) {
        setResult(response.data);
        
        // Wait 2 seconds to show result, then call onComplete
        setTimeout(() => {
          onComplete(response.data);
        }, 2000);
      } else {
        alert(response.message || 'Failed to submit count');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting count:', error);
      alert('Failed to submit count');
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
                  <p className="text-sm text-gray-600">Your Count</p>
                  <p className="text-2xl font-bold text-gray-800">{result.user_count}</p>
                </div>
                
                {!result.is_correct && (
                  <div>
                    <p className="text-sm text-gray-600">Correct Count</p>
                    <p className="text-2xl font-bold text-green-600">{result.correct_count}</p>
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
            <Hash className="w-8 h-8 text-primary-600" />
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

        {/* Counter Interface */}
        <div className="mb-8">
          <label className="block text-center text-lg font-semibold text-gray-700 mb-6">
            How many do you count?
          </label>

          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Decrement Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleDecrement}
              disabled={count === 0 || isSubmitting}
              className="w-16 h-16 rounded-full bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Minus className="w-8 h-8" />
            </motion.button>

            {/* Count Display */}
            <div className="relative">
              <input
                type="number"
                value={count}
                onChange={handleInputChange}
                disabled={isSubmitting}
                min="0"
                className="w-32 h-20 text-center text-4xl font-bold border-4 border-primary-300 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-200 outline-none transition-all disabled:bg-gray-100"
              />
            </div>

            {/* Increment Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleIncrement}
              disabled={isSubmitting}
              className="w-16 h-16 rounded-full bg-green-100 hover:bg-green-200 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Plus className="w-8 h-8" />
            </motion.button>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex justify-center gap-3 flex-wrap">
            {[5, 10, 20, 50].map((value) => (
              <button
                key={value}
                onClick={() => setCount(prev => prev + value)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                +{value}
              </button>
            ))}
            <button
              onClick={() => setCount(0)}
              disabled={isSubmitting || count === 0}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            variant="glass"
            onClick={handleSubmit}
            disabled={count === 0 || isSubmitting}
            isLoading={isSubmitting}
            className="w-full sm:w-auto px-12 py-4 text-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Count'}
          </Button>

          {count === 0 && (
            <p className="mt-3 text-sm text-gray-500">
              Please enter a count before submitting
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CountConfirmTask;
