import React, { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle, Check, MapPin, Info, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";
import Loading from "../common/Loading";

const ObservationMatchTask = ({ task, onComplete }) => {
  const [matchData, setMatchData] = useState(null);
  const [options, setOptions] = useState([]); // All answer options
  const [correctAnswerIds, setCorrectAnswerIds] = useState([]); // IDs of correct answers
  const [selectedAnswers, setSelectedAnswers] = useState([]); // User's selected answer IDs
  const [minSelections, setMinSelections] = useState(1); // Minimum required selections
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatchTask();
  }, [task.id]);

  const loadMatchTask = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getQuiz(task.id);

      if (response.success && response.data.questions?.length) {
        const question = response.data.questions[0];
        const optionsList = question.options || [];

        if (!optionsList.length) {
          console.warn('No options found for this task. Please check task configuration.');
          return;
        }

        // Parse options and identify correct answers
        const parsedOptions = [];
        const correctIds = [];

        optionsList.forEach(opt => {
          const metadata = opt.option_metadata ? (typeof opt.option_metadata === 'string' ? JSON.parse(opt.option_metadata) : opt.option_metadata) : {};
          const isCorrect = metadata.is_correct ?? opt.is_correct ?? false;

          parsedOptions.push({
            id: opt.option_id,
            text: opt.option_text,
            is_correct: isCorrect
          });

          if (isCorrect) {
            correctIds.push(opt.option_id);
          }
        });

        // Shuffle options array for randomness
        const shuffledOptions = [...parsedOptions].sort(() => Math.random() - 0.5);

        setOptions(shuffledOptions);
        setCorrectAnswerIds(correctIds);
        setMinSelections(correctIds.length); // User must select same number as correct answers
        setMatchData(question);
      } else {
        console.warn('Failed to load observation match task - no valid data returned');
      }
    } catch (error) {
      console.error('Error loading observation match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (optionId) => {
    setSelectedAnswers(prev => {
      if (prev.includes(optionId)) {
        // Deselect if already selected
        return prev.filter(id => id !== optionId);
      } else {
        // Add to selection
        return [...prev, optionId];
      }
    });
  };

  const handleSubmit = async () => {
    // Check if user has selected enough answers
    if (selectedAnswers.length < minSelections) {
      alert(`Please select at least ${minSelections} answer${minSelections > 1 ? 's' : ''}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await tasksAPI.submitObservationMatch(task.id, selectedAnswers);

      if (response.success) {
        setResult(response.data);

        // Wait 2.5 seconds then call onComplete
        setTimeout(() => {
          onComplete(response.data);
        }, 2500);
      } else {
        alert(response.message || 'Failed to submit answers');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting answers:', error);
      alert('Failed to submit answers. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

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
              {result.is_correct ? 'Perfect Match!' : 'Good Try!'}
            </h2>

            <div className="space-y-3 mb-6">
              <p className="text-lg text-gray-700">
                {result.message}
              </p>

              <div className="mt-4 p-4 bg-white rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Score:</p>
                <p className="text-3xl font-bold text-primary-600">{result.score}%</p>
                <p className="text-sm text-gray-600 mt-1">
                  {result.correct_count} out of {result.total_correct_answers || result.total_pairs} correct
                </p>
              </div>

              {result.rewards && result.is_correct && (
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Eye className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{task.name}</h2>
          <p className="text-gray-600">{task.description}</p>
        </div>

        {/* Physical Observation Reminder */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 border-2" padding="md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Observe Your Surroundings
                </h3>
                <p className="text-sm text-amber-800">
                  Look around the attraction carefully and select all the correct answers based on what you observe.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Guide */}
        {task.guide && (
          <Card className="mb-6 bg-blue-50 border-blue-200" padding="md">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" /> Guide
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              {task.guide.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mb-6 bg-purple-50 border-purple-200" padding="md">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <p className="text-purple-900 font-medium">
              Select all correct answers (choose {minSelections} option{minSelections > 1 ? 's' : ''})
            </p>
          </div>
        </Card>

        {/* Question Text */}
        {matchData && matchData.question_text && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              {matchData.question_text}
            </h3>
          </div>
        )}

        {/* Multiple Choice Options */}
        <div className="space-y-3 mb-8">
          {options.map((option) => {
            const isSelected = selectedAnswers.includes(option.id);

            return (
              <motion.div
                key={option.id}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'bg-primary-50 border-primary-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
                onClick={() => handleOptionClick(option.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-gray-300 bg-white'}`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`font-medium flex-1 ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                    {option.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Selected: <span className={`font-bold ${selectedAnswers.length >= minSelections ? 'text-green-600' : 'text-primary-600'}`}>
              {selectedAnswers.length}
            </span> / {minSelections} required
          </p>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            variant="glass"
            onClick={handleSubmit}
            disabled={selectedAnswers.length < minSelections || isSubmitting}
            isLoading={isSubmitting}
            className="w-full sm:w-auto px-12 py-4 text-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </Button>

          {selectedAnswers.length < minSelections && (
            <p className="mt-3 text-sm text-gray-500">
              Select {minSelections - selectedAnswers.length} more answer{minSelections - selectedAnswers.length > 1 ? 's' : ''} to submit
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ObservationMatchTask;
