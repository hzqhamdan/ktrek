import { create } from "zustand";

export const useProgressStore = create((set, get) => ({
  // State
  progress: [],
  statistics: null,
  isLoading: false,
  error: null,

  // Actions
  setProgress: (progress) => set({ progress }),
  setStatistics: (statistics) => set({ statistics }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get progress for specific attraction
  getAttractionProgress: (attractionId) => {
    const progress = get().progress;
    return progress.find((p) => p.attraction_id === parseInt(attractionId));
  },

  // Update progress for an attraction
  updateAttractionProgress: (attractionId, updates) => {
    const progress = get().progress;
    const existingProgress = progress.find(
      (p) => p.attraction_id === attractionId
    );

    if (existingProgress) {
      const updatedProgress = progress.map((p) =>
        p.attraction_id === attractionId ? { ...p, ...updates } : p
      );
      set({ progress: updatedProgress });
    } else {
      set({
        progress: [...progress, { attraction_id: attractionId, ...updates }],
      });
    }
  },

  // Calculate overall completion percentage
  getOverallCompletion: () => {
    const progress = get().progress;
    if (progress.length === 0) return 0;

    const totalPercentage = progress.reduce(
      (sum, p) => sum + (p.progress_percentage || 0),
      0
    );
    return Math.round(totalPercentage / progress.length);
  },
}));
