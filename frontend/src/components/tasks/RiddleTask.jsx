import React, { useState, useEffect } from "react";
import { HelpCircle, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";
import Loading from "../common/Loading";

const RiddleTask = ({ task, onComplete }) => {
  const [riddleData, setRiddleData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiddle();
  }, [task.id]);

  const loadRiddle = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getQuiz(task.id);
      
      if (response.success) {
        setRiddleData(response.data);
      } else {
        alert('Failed to load riddle');
      }
    } catch (error) {
      console.error('Error loading riddle:', error);
      alert('Failed to load riddle');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionId) => {
    if (!isSubmitting && !result) {
      setSelectedOption(optionId);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost/backend/api/tasks/submit-riddle.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          task_id: task.id,
          selected_option_id: selectedOption
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
        alert(data.message || 'Failed to submit riddle');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting riddle:', error);
      alert('Failed to submit riddle');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!riddleData || !riddleData.questions || riddleData.questions.length === 0) {
    return (
      <Card padding="xl" className="text-center">
        <p className="text-gray-600">Riddle data not available</p>
      </Card>
    );
  }

  const riddle = riddleData.questions[0];

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

              {!result.is_correct && result.correct_option && (
                <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Correct Answer:</p>
                  <p className="text-lg font-bold text-green-700">{result.correct_option.text}</p>
                </div>
              )}

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
            <HelpCircle className="w-8 h-8 text-primary-600" />
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

        {/* Riddle */}
        <Card className="mb-8 bg-purple-50 border-purple-200" padding="lg">
          <div className="flex items-start gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-purple-900 mb-2 text-lg">Riddle</h3>
              <p className="text-purple-800 text-lg leading-relaxed italic">
                "{riddle.question_text}"
              </p>
            </div>
          </div>
        </Card>

        {/* Answer Options */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Select Your Answer:</h3>
          <div className="space-y-3">
            {riddle.options.map((option, index) => {
              const isSelected = selectedOption === option.option_id;
              
              return (
                <motion.button
                  key={option.option_id}
                  type="button"
                  onClick={() => handleSelectOption(option.option_id)}
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50 shadow-lg scale-105' 
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 bg-white rounded-full"
                        />
                      )}
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                      {option.option_text}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            variant="glass"
            onClick={handleSubmit}
            disabled={!selectedOption || isSubmitting}
            isLoading={isSubmitting}
            className="w-full sm:w-auto px-12 py-4 text-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>

          {!selectedOption && (
            <p className="mt-3 text-sm text-gray-500">
              Please select an answer before submitting
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RiddleTask;
