import React, { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle, Check, MapPin, Info, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";
import Loading from "../common/Loading";

const ObservationMatchTask = ({ task, onComplete }) => {
  const [allQuestions, setAllQuestions] = useState([]); // All observation questions
  const [currentQuestion, setCurrentQuestion] = useState(0); // Current question index
  const [selectedAnswers, setSelectedAnswers] = useState({}); // User's selected answers per question
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
        // Store all questions - each question is an observable item
        setAllQuestions(response.data.questions);
      } else {
        console.warn('Failed to load observation match task - no valid data returned');
      }
    } catch (error) {
      console.error('Error loading observation match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, optionId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId,
    });
  };

  const playSound = (isCorrect) => {
    try {
      const sound = new Audio(isCorrect ? '/sounds/correct.mp3' : '/sounds/wrong.mp3');
      sound.volume = 0.5;
      sound.play().catch(err => console.log('Sound play failed:', err));
    } catch (error) {
      console.log('Sound not available:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestion < allQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = allQuestions.filter(
      (q) => !selectedAnswers[q.question_id]
    );

    if (unansweredQuestions.length > 0) {
      alert(`Please answer all items (${unansweredQuestions.length} remaining)`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert selectedAnswers object to array format for API
      const answersArray = Object.values(selectedAnswers);
      const response = await tasksAPI.submitObservationMatch(task.id, answersArray);

      if (response.success) {
        setResult(response.data);
        
        // Play sound based on result
        playSound(response.data.is_correct);

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

  if (!allQuestions || allQuestions.length === 0) {
    return (
      <Card className="text-center" padding="lg">
        <p className="text-gray-600">No observation items available for this task.</p>
      </Card>
    );
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

  // Get current question data
  const question = allQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / allQuestions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <Card className="mb-6" padding="md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Eye className="text-primary-600" size={24} />
            <span className="font-semibold text-gray-900">
              Item {currentQuestion + 1} of {allQuestions.length}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

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

        {/* Question Text */}
        {question && question.question_text && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 text-center">
              {question.question_text}
            </h3>
          </div>
        )}

        {/* Multiple Choice Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswers[question.question_id] === option.option_id;

            return (
              <motion.div
                key={option.option_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'bg-primary-50 border-primary-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
                onClick={() => handleSelectAnswer(question.question_id, option.option_id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-gray-300 bg-white'}`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <p className={`font-medium flex-1 ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                    {option.option_text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            {Object.keys(selectedAnswers).length} / {allQuestions.length} items answered
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-center">
          <Button
            variant="glass"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>

          {currentQuestion === allQuestions.length - 1 ? (
            <Button
              variant="glass"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Submit All
            </Button>
          ) : (
            <Button
              variant="glass"
              onClick={handleNext}
              className="w-full sm:w-auto"
            >
              Next
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ObservationMatchTask;
