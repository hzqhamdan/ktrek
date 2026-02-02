import React, { useState, useEffect } from "react";
import { Brain, XCircle, Award, Clock, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";
import Loading from "../common/Loading";
import { useToast } from "../ui/toast-1";

const QuizTask = ({ task, onComplete }) => {
  const { showToast } = useToast();
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [currentQuestionFeedback, setCurrentQuestionFeedback] = useState(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    fetchQuiz();
  }, []);

  useEffect(() => {
    if (!showResults) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showResults]);

  const fetchQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await tasksAPI.getQuiz(task.id);
      if (response.success) {
        setQuizData(response.data);
      } else {
        showToast("Failed to load quiz", "error");
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      showToast("Failed to load quiz questions", "error");
    } finally {
      setIsLoading(false);
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

  const handleNext = async () => {
    // Show feedback for current answer before moving to next
    const question = quizData.questions[currentQuestion];
    const selectedOptionId = selectedAnswers[question.question_id];
    
    setShowingFeedback(true);
    
    try {
      // Check answer with backend
      const response = await tasksAPI.checkAnswer(question.question_id, selectedOptionId);
      
      if (response.success) {
        const feedbackData = {
          isCorrect: response.data.is_correct,
          selectedOptionId: response.data.selected_option_id,
          correctOptionId: response.data.correct_option_id
        };
        
        setCurrentQuestionFeedback(feedbackData);
        
        // Play sound effect
        playSound(feedbackData.isCorrect);
        
        // Start countdown
        setCountdown(3);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Wait for animation then move to next question
        setTimeout(() => {
          setShowingFeedback(false);
          setCurrentQuestionFeedback(null);
          setCountdown(3);
          if (currentQuestion < quizData.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
          }
        }, 3000); // 3 seconds for feedback animation
      } else {
        showToast("Failed to check answer", "error");
        setShowingFeedback(false);
      }
    } catch (error) {
      console.error("Error checking answer:", error);
      showToast("Failed to check answer", "error");
      setShowingFeedback(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = quizData.questions.filter(
      (q) => !selectedAnswers[q.question_id]
    );

    if (unansweredQuestions.length > 0) {
      showToast(
        `Please answer all questions (${unansweredQuestions.length} remaining)`,
        "error"
      );
      return;
    }

    // Show feedback for last question before submitting
    const question = quizData.questions[currentQuestion];
    const selectedOptionId = selectedAnswers[question.question_id];
    
    setShowingFeedback(true);
    
    try {
      // Check answer with backend
      const response = await tasksAPI.checkAnswer(question.question_id, selectedOptionId);
      
      if (response.success) {
        const feedbackData = {
          isCorrect: response.data.is_correct,
          selectedOptionId: response.data.selected_option_id,
          correctOptionId: response.data.correct_option_id
        };
        
        setCurrentQuestionFeedback(feedbackData);
        
        // Play sound effect
        playSound(feedbackData.isCorrect);
        
        // Start countdown
        setCountdown(3);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Wait for feedback animation then submit
        setTimeout(async () => {
          setShowingFeedback(false);
          setCurrentQuestionFeedback(null);
          setCountdown(3);
          setIsSubmitting(true);
          
          try {
            // Format answers for API
            const answers = quizData.questions.map((question) => ({
              question_id: question.question_id,
              selected_option_id: selectedAnswers[question.question_id],
            }));

            const response = await tasksAPI.submitQuiz(task.id, answers);

            if (response.success) {
              // Store both the results data and the full response for rewards
              setResults({ ...response.data, rewards: response.data.rewards });
              setShowResults(true);
              showToast("Quiz submitted successfully!", "success");
            } else {
              console.error("Quiz submission failed:", response);
              showToast(response.message || "Failed to submit quiz", "error");
            }
          } catch (error) {
            console.error("Error submitting quiz:", error);
            console.error("Error details:", error.response?.data);
            console.error("Error status:", error.response?.status);
            showToast(error.response?.data?.message || "Failed to submit quiz", "error");
          } finally {
            setIsSubmitting(false);
          }
        }, 3000); // Wait 3 seconds for feedback animation
      } else {
        showToast("Failed to check answer", "error");
        setShowingFeedback(false);
      }
    } catch (error) {
      console.error("Error checking answer:", error);
      showToast("Failed to check answer", "error");
      setShowingFeedback(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return <Loading message="Loading quiz questions..." />;
  }

  if (!quizData) {
    return (
      <Card className="text-center" padding="lg">
        <p className="text-red-600">Failed to load quiz</p>
      </Card>
    );
  }

  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <Card className="text-center" padding="lg">
        <p className="text-gray-600">
          No quiz questions available for this task.
        </p>
      </Card>
    );
  }

  // Results View
  if (showResults && results) {
    const percentage = results.score;
    const isPerfect = results.is_perfect;
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center" padding="lg">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
              isPerfect
                ? "bg-green-100"
                : percentage >= 70
                  ? "bg-yellow-100"
                  : "bg-red-100"
            }`}
          >
            {isPerfect ? (
              <Award className="text-green-600" size={48} />
            ) : (
              <Brain className="text-gray-600" size={48} />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-16">
            {isPerfect
              ? "Perfect Score!"
              : percentage >= 70
                ? "Good Job!"
                : "Keep Trying!"}
          </h2>
          <div className="text-5xl font-bold text-[#120c07] mb-20">
            {percentage}%
          </div>
          <div className="flex flex-col gap-4 mb-12">
            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-between">
              <p className="text-base text-gray-600">Correct</p>
              <p className="text-3xl font-bold text-green-600">
                {results.correct_answers}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-between">
              <p className="text-base text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900">
                {results.total_questions}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-between">
              <p className="text-base text-gray-600">Time Taken</p>
              <p className="text-3xl font-bold text-primary-600">
                {formatTime(timeElapsed)}
              </p>
            </div>
          </div>
          {isPerfect && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <p className="text-green-800 font-medium">
                Amazing! You got all questions correct! Your progress has
                been updated.
              </p>
            </div>
          )}
          <Button
            variant="glass"
            size="lg"
            onClick={() => onComplete(results)}
          >
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  // Quiz View
  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Header */}
      <Card className="mb-6" padding="md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="text-[#120c07]" size={24} />
            <span className="font-semibold text-gray-900">
              Question {currentQuestion + 1} of {quizData.questions.length}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Question Card */}
      <Card padding="lg" className="mb-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {question.question_text}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-5">
          {question.options.map((option, index) => {
            const isSelected =
              selectedAnswers[question.question_id] === option.option_id;
            const isSelectedOption = isSelected;
            const showFeedback = showingFeedback && currentQuestionFeedback;
            
            // Check if this option is the correct one based on backend response
            const isCorrectOption = showFeedback && option.option_id === currentQuestionFeedback.correctOptionId;
            
            // Determine feedback state
            let feedbackState = null;
            if (showFeedback) {
              if (isSelectedOption && currentQuestionFeedback.isCorrect) {
                feedbackState = 'correct';
              } else if (isSelectedOption && !currentQuestionFeedback.isCorrect) {
                feedbackState = 'wrong';
              } else if (isCorrectOption && !currentQuestionFeedback.isCorrect) {
                feedbackState = 'correct-answer';
              }
            }
            
            return (
              <motion.div
                key={option.option_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    !showingFeedback && handleSelectAnswer(question.question_id, option.option_id)
                  }
                  disabled={showingFeedback}
                  className={`w-full text-left p-5 rounded-lg border-2 transition-all duration-300 relative overflow-hidden
                    ${feedbackState === 'correct' ? 'border-green-500 bg-green-50 animate-correct-answer' : ''}
                    ${feedbackState === 'wrong' ? 'border-red-500 bg-red-50 animate-wrong-answer' : ''}
                    ${feedbackState === 'correct-answer' ? 'border-green-400 bg-green-50 animate-correct-answer' : ''}
                    ${!showFeedback && isSelected ? 'border-primary-500 bg-orange-50 scale-105 shadow-lg' : ''}
                    ${!showFeedback && !isSelected ? 'border-gray-200 hover:border-primary-300 bg-white hover:shadow-md' : ''}
                    ${showingFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-medium block flex-1 ${
                        feedbackState === 'correct' ? 'text-green-700' :
                        feedbackState === 'wrong' ? 'text-red-700' :
                        feedbackState === 'correct-answer' ? 'text-green-700' :
                        isSelected ? 'text-[#120c07]' : 'text-gray-700'
                      }`}
                    >
                      {option.option_text}
                    </span>
                    
                    {/* Feedback Icons */}
                    <AnimatePresence>
                      {feedbackState === 'correct' && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", duration: 0.5 }}
                          className="ml-3"
                        >
                          <CheckCircle className="text-green-600 animate-check-mark" size={28} />
                        </motion.div>
                      )}
                      {feedbackState === 'wrong' && (
                        <motion.div
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ scale: 1, rotate: 180 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", duration: 0.4 }}
                          className="ml-3"
                        >
                          <XCircle className="text-red-600 animate-x-mark" size={28} />
                        </motion.div>
                      )}
                      {feedbackState === 'correct-answer' && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ delay: 0.3, type: "spring", duration: 0.5 }}
                          className="ml-3 flex items-center gap-2"
                        >
                          <span className="text-sm text-green-700 font-semibold">Correct Answer</span>
                          <CheckCircle className="text-green-600" size={24} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Feedback Message */}
      {showingFeedback && currentQuestionFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card 
            className={`${currentQuestionFeedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`} 
            padding="md"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                {currentQuestionFeedback.isCorrect ? (
                  <>
                    <CheckCircle className="text-green-600" size={24} />
                    <p className="text-green-800 font-medium">
                      Correct! Great job! 🎉
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-600" size={24} />
                    <p className="text-red-800 font-medium">
                      Incorrect. The correct answer is highlighted above.
                    </p>
                  </>
                )}
              </div>
              
              {/* Countdown Timer */}
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12">
                  {/* Background circle */}
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className={currentQuestionFeedback.isCorrect ? 'text-green-200' : 'text-red-200'}
                    />
                    {/* Progress circle */}
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - countdown / 3)}`}
                      className={currentQuestionFeedback.isCorrect ? 'text-green-600' : 'text-red-600'}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  {/* Countdown number */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${currentQuestionFeedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {countdown}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <div className="text-sm text-gray-600 text-center">
          {Object.keys(selectedAnswers).length} / {quizData.questions.length}{" "}
          answered
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-center">
          <Button
            variant="glass"
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || showingFeedback}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>

          {currentQuestion === quizData.questions.length - 1 ? (
            <Button
              variant="glass"
              onClick={handleSubmit}
              isLoading={isSubmitting || showingFeedback}
              disabled={isSubmitting || showingFeedback}
              className="w-full sm:w-auto"
            >
              {showingFeedback ? "Checking..." : "Submit Quiz"}
            </Button>
          ) : (
            <Button
              variant="glass"
              onClick={handleNext}
              disabled={!selectedAnswers[question.question_id] || showingFeedback}
              className="w-full sm:w-auto"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTask;
