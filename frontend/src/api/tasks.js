import api from "./index";

export const tasksAPI = {
  // Get task by ID
  getById: async (id) => {
    const response = await api.get(`/tasks/get-by-id.php?id=${id}`);
    return response.data;
  },

  // Get quiz questions
  getQuiz: async (taskId) => {
    const response = await api.get(`/tasks/get-quiz.php?task_id=${taskId}`);
    return response.data;
  },

  // Submit quiz answers
  submitQuiz: async (taskId, answers) => {
    const response = await api.post("/tasks/submit-quiz.php", {
      task_id: taskId,
      answers: answers,
    });
    return response.data;
  },

  // Submit check-in
  submitCheckin: async (taskId, payload = {}) => {
    const response = await api.post("/tasks/submit-checkin.php", {
      task_id: taskId,
      latitude: payload?.latitude ?? null,
      longitude: payload?.longitude ?? null,
      accuracy: payload?.accuracy ?? null,
      qr_code: payload?.qr_code ?? null,
    });
    return response.data;
  },

  // Check if user can access task (prerequisite check)
  checkPrerequisite: async (taskId) => {
    const response = await api.get(`/tasks/check-prerequisite.php?task_id=${taskId}`);
    return response.data;
  },

  // Check single answer
  checkAnswer: async (questionId, selectedOptionId) => {
    const response = await api.post("/tasks/check-answer.php", {
      question_id: questionId,
      selected_option_id: selectedOptionId,
    });
    return response.data;
  },

  // Submit count & confirm
  submitCountConfirm: async (taskId, count) => {
    const response = await api.post("/tasks/submit-count-confirm.php", {
      task_id: taskId,
      count: count,
    });
    return response.data;
  },

  // Submit direction
  submitDirection: async (taskId, selectedDirection) => {
    const response = await api.post("/tasks/submit-direction.php", {
      task_id: taskId,
      selected_direction: selectedDirection,
    });
    return response.data;
  },

  // Submit riddle
  submitRiddle: async (taskId, selectedOptionId) => {
    const response = await api.post("/tasks/submit-riddle.php", {
      task_id: taskId,
      selected_option_id: selectedOptionId,
    });
    return response.data;
  },

  // Submit memory recall
  submitMemoryRecall: async (taskId, selectedOptionId) => {
    const response = await api.post("/tasks/submit-memory-recall.php", {
      task_id: taskId,
      selected_option_id: selectedOptionId,
    });
    return response.data;
  },

  // Submit observation match (multiple choice with multiple correct answers)
  submitObservationMatch: async (taskId, selectedAnswers) => {
    const response = await api.post("/tasks/submit-observation-match.php", {
      task_id: taskId,
      selected_answers: selectedAnswers,
    });
    return response.data;
  },

  // Submit route completion
  submitRouteCompletion: async (taskId, checkpointsVisited) => {
    const response = await api.post("/tasks/submit-route-completion.php", {
      task_id: taskId,
      checkpoints_visited: checkpointsVisited,
    });
    return response.data;
  },

  // Submit time-based
  submitTimeBased: async (taskId) => {
    const response = await api.post("/tasks/submit-time-based.php", {
      task_id: taskId,
    });
    return response.data;
  },
};
