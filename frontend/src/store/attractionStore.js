import { create } from "zustand";

export const useAttractionStore = create((set, get) => ({
  // State
  attractions: [],
  selectedAttraction: null,
  tasks: [],
  isLoading: false,
  error: null,
  // Actions
  setAttractions: (attractions) => set({ attractions }),
  setSelectedAttraction: (attraction) =>
    set({ selectedAttraction: attraction }),
  setTasks: (tasks) => set({ tasks }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get attraction by ID
  getAttractionById: (id) => {
    const attractions = get().attractions;
    return attractions.find((attr) => attr.id === parseInt(id));
  },

  // Update single attraction in list
  updateAttraction: (id, updates) => {
    const attractions = get().attractions;

    const updatedAttractions = attractions.map((attr) =>
      attr.id === id
        ? {
            ...attr,
            ...updates,
          }
        : attr
    );
    set({
      attractions: updatedAttractions,
    });
  },
  // Update task completion updateTaskCompletion: (taskId,
  updateTaskCompletion: (taskId, isCompleted) => {
    const tasks = get().tasks;

    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            is_completed: isCompleted,
          }
        : task
    );
    set({
      tasks: updatedTasks,
    });
  },
}));
