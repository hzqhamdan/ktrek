import React, { useState, useEffect } from "react";
import { Brain, Clock, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";
import Loading from "../common/Loading";

const MemoryRecallTask = ({ task, onComplete }) => {
  const [memoryData, setMemoryData] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading, memorize, recall, result
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadMemoryTask();
  }, [task.id]);

  const loadMemoryTask = async () => {
    try {
      const response = await tasksAPI.getQuiz(task.id);
      
      if (response.success && response.data.questions) {
        const data = response.data;
        const config = task.task_config ? JSON.parse(task.task_config) : {};
        const duration = config.display_duration_seconds || 10;
        
        setMemoryData({
          memoryContent: data.questions[0], // First question has the content to memorize
          recallQuestion: data.questions[1] || data.questions[0], // Second question is the recall question
          duration: duration
        });
        
        setTimeLeft(duration);
        setPhase('memorize');
      } else {
        alert('Failed to load memory task');
      }
    } catch (error) {
      console.error('Error loading memory task:', error);
      alert('Failed to load memory task');
    }
  };

  // Countdown timer
  useEffect(() => {
    if (phase === 'memorize' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (phase === 'memorize' && timeLeft === 0) {
      // Time's up, move to recall phase
      setTimeout(() => {
        setPhase('recall');
      }, 500);
    }
  }, [phase, timeLeft]);

  const handleSelectOption = (optionId) => {
    if (!isSubmitting) {
      setSelectedOption(optionId);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost/backend/api/tasks/submit-memory-recall.php', {
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
        setPhase('result');

        // Wait 2.5 seconds then call onComplete
        setTimeout(() => {
          onComplete(data.data);
        }, 2500);
      } else {
        alert(data.message || 'Failed to submit answer');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting memory recall:', error);
      alert('Failed to submit answer');
      setIsSubmitting(false);
    }
  };

  if (phase === 'loading' || !memoryData) {
    return <Loading />;
  }

  // RESULT PHASE
  if (phase === 'result' && result) {
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

  // MEMORIZE PHASE
  if (phase === 'memorize') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card padding="xl" gradient>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{task.name}</h2>
            <p className="text-gray-600">{task.description}</p>
          </div>

          {/* Timer */}
          <Card className="mb-6 bg-blue-50 border-blue-200" padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-blue-900">Memorize this information</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{timeLeft}s</span>
              </div>
            </div>
          </Card>

          {/* Memory Content */}
          <Card className="mb-6 bg-purple-50 border-purple-200" padding="lg">
            <motion.div
              key={timeLeft}
              animate={{ scale: timeLeft <= 3 ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
                {memoryData.memoryContent.question_text}
              </p>
            </motion.div>
          </Card>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / memoryData.duration) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          <p className="text-center text-sm text-gray-600 mt-4">
            The information will disappear in {timeLeft} second{timeLeft !== 1 ? 's' : ''}...
          </p>
        </Card>
      </div>
    );
  }

  // RECALL PHASE
  if (phase === 'recall') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card padding="xl" gradient>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <EyeOff className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Recall Question</h2>
            <p className="text-gray-600">Answer based on what you remembered</p>
          </div>

          {/* Question */}
          <Card className="mb-8 bg-yellow-50 border-yellow-200" padding="lg">
            <p className="text-lg font-semibold text-gray-800">
              {memoryData.recallQuestion.question_text}
            </p>
          </Card>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {memoryData.recallQuestion.options?.map((option) => {
              const isSelected = selectedOption === option.option_id;
              
              return (
                <motion.button
                  key={option.option_id}
                  type="button"
                  onClick={() => handleSelectOption(option.option_id)}
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 disabled:opacity-50
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50 shadow-lg' 
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
  }

  return null;
};

export default MemoryRecallTask;
