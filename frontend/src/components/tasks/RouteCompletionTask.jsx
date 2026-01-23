import React, { useState, useEffect } from "react";
import { Route, CheckCircle, MapPin, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { tasksAPI } from "../../api/tasks";
import Card from "../common/Card";
import Button from "../common/Button";
import Loading from "../common/Loading";

const RouteCompletionTask = ({ task, onComplete }) => {
  const [routeData, setRouteData] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [visitedCheckpoints, setVisitedCheckpoints] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoute();
  }, [task.id]);

  const loadRoute = async () => {
    try {
      const response = await tasksAPI.getQuiz(task.id);
      if (response.success && response.data.questions) {
        const question = response.data.questions[0];
        setCheckpoints(question.options || []);
        setRouteData(question);
      }
    } catch (error) {
      console.error('Error loading route:', error);
      alert('Failed to load route');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = (checkpointId) => {
    if (!visitedCheckpoints.includes(checkpointId)) {
      setVisitedCheckpoints([...visitedCheckpoints, checkpointId]);
    }
  };

  const handleSubmit = async () => {
    if (visitedCheckpoints.length !== checkpoints.length) {
      alert('Please visit all checkpoints');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost/backend/api/tasks/submit-route-completion.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          task_id: task.id,
          checkpoints_visited: visitedCheckpoints
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setTimeout(() => onComplete(data.data), 2500);
      } else {
        alert(data.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit route');
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card padding="xl" className={`text-center ${result.is_correct ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mb-6">
              {result.is_correct ? (
                <CheckCircle className="w-24 h-24 mx-auto text-green-600" />
              ) : (
                <XCircle className="w-24 h-24 mx-auto text-orange-600" />
              )}
            </motion.div>
            <h2 className={`text-3xl font-bold mb-4 ${result.is_correct ? 'text-green-800' : 'text-orange-800'}`}>
              {result.is_correct ? 'Route Completed!' : 'Incomplete Route'}
            </h2>
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
            <Route className="w-8 h-8 text-primary-600" />
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

        <div className="space-y-4 mb-8">
          {checkpoints.map((checkpoint, index) => {
            const isVisited = visitedCheckpoints.includes(checkpoint.option_id);
            return (
              <motion.div key={checkpoint.option_id} whileTap={{ scale: 0.98 }}>
                <Card padding="md" className={isVisited ? 'bg-green-50 border-green-300' : 'bg-white'}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isVisited ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <MapPin className="text-gray-400" size={24} />
                      )}
                      <div>
                        <p className="font-semibold">Checkpoint {index + 1}</p>
                        <p className="text-sm text-gray-600">{checkpoint.option_text}</p>
                      </div>
                    </div>
                    <Button variant="glass" size="sm" onClick={() => handleCheckIn(checkpoint.option_id)} disabled={isVisited}>
                      {isVisited ? 'Visited' : 'Check In'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="mb-6 bg-purple-50 border-purple-200" padding="md">
          <p className="text-center font-semibold text-purple-900">
            Progress: {visitedCheckpoints.length} / {checkpoints.length} checkpoints completed
          </p>
        </Card>

        <Button variant="glass" onClick={handleSubmit}
          disabled={visitedCheckpoints.length !== checkpoints.length || isSubmitting}
          isLoading={isSubmitting} className="w-full py-4 text-lg">
          {isSubmitting ? 'Submitting...' : 'Complete Route'}
        </Button>
      </Card>
    </div>
  );
};

export default RouteCompletionTask;
