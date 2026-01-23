import { useState, useCallback } from 'react';

interface TierUnlock {
  tier: 'bronze' | 'silver' | 'gold';
  category: string;
  epEarned: number;
  completionPercentage: number;
}

interface CategoryProgress {
  category: string;
  completion_percentage: number;
  bronze_unlocked: boolean;
  silver_unlocked: boolean;
  gold_unlocked: boolean;
}

/**
 * Hook to detect tier unlocks from task submission responses
 * Compares previous and current category progress to identify newly unlocked tiers
 */
export const useTierUnlockDetection = () => {
  const [previousProgress, setPreviousProgress] = useState<Record<string, CategoryProgress>>({});
  const [currentTierUnlock, setCurrentTierUnlock] = useState<TierUnlock | null>(null);

  /**
   * Check if a tier was newly unlocked
   * @param category - Category name
   * @param currentProgress - Current category progress from API
   * @param epEarned - EP earned in this session
   * @returns TierUnlock object if a tier was unlocked, null otherwise
   */
  const detectTierUnlock = useCallback((
    category: string,
    currentProgress: CategoryProgress,
    epEarned: number
  ): TierUnlock | null => {
    const prev = previousProgress[category];
    
    console.log('[TierUnlock] Detecting for category:', category);
    console.log('[TierUnlock] Previous:', prev);
    console.log('[TierUnlock] Current:', currentProgress);
    
    if (!prev) {
      // First time seeing this category - store it but don't show notification
      console.log('[TierUnlock] First time seeing this category, storing...');
      setPreviousProgress(prevState => ({
        ...prevState,
        [category]: currentProgress
      }));
      return null;
    }

    // Check which tier was newly unlocked
    let unlockedTier: 'bronze' | 'silver' | 'gold' | null = null;

    if (currentProgress.gold_unlocked && !prev.gold_unlocked) {
      console.log('[TierUnlock] Gold tier newly unlocked!');
      unlockedTier = 'gold';
    } else if (currentProgress.silver_unlocked && !prev.silver_unlocked) {
      console.log('[TierUnlock] Silver tier newly unlocked!');
      unlockedTier = 'silver';
    } else if (currentProgress.bronze_unlocked && !prev.bronze_unlocked) {
      console.log('[TierUnlock] Bronze tier newly unlocked!');
      unlockedTier = 'bronze';
    } else {
      console.log('[TierUnlock] No new tier unlocked');
    }

    // Update previous progress
    setPreviousProgress(prevState => ({
      ...prevState,
      [category]: currentProgress
    }));

    if (unlockedTier) {
      return {
        tier: unlockedTier,
        category,
        epEarned,
        completionPercentage: parseFloat(currentProgress.completion_percentage as any) || 0
      };
    }

    return null;
  }, [previousProgress]);

  /**
   * Process task submission response and check for tier unlocks
   * @param response - Task submission API response
   */
  const checkForTierUnlock = useCallback((response: any) => {
    console.log('[TierUnlock] Checking response:', response);
    
    if (!response?.rewards?.category_progress) {
      console.log('[TierUnlock] No category_progress in response');
      return;
    }

    const categoryProgress = response.rewards.category_progress;
    const epEarned = response.rewards.ep_earned || 0;
    const category = categoryProgress.category;

    console.log('[TierUnlock] Category progress:', categoryProgress);
    console.log('[TierUnlock] Previous progress:', previousProgress);

    if (!category) {
      console.log('[TierUnlock] No category found');
      return;
    }

    const tierUnlock = detectTierUnlock(category, categoryProgress, epEarned);
    
    console.log('[TierUnlock] Detected tier unlock:', tierUnlock);
    
    if (tierUnlock) {
      setCurrentTierUnlock(tierUnlock);
    }
  }, [detectTierUnlock, previousProgress]);

  /**
   * Clear the current tier unlock (close modal)
   */
  const clearTierUnlock = useCallback(() => {
    setCurrentTierUnlock(null);
  }, []);

  /**
   * Initialize previous progress from user stats (on page load)
   * This prevents showing notifications for already-unlocked tiers
   */
  const initializePreviousProgress = useCallback((categories: CategoryProgress[]) => {
    const progressMap: Record<string, CategoryProgress> = {};
    categories.forEach(cat => {
      progressMap[cat.category] = cat;
    });
    setPreviousProgress(progressMap);
  }, []);

  return {
    currentTierUnlock,
    checkForTierUnlock,
    clearTierUnlock,
    initializePreviousProgress
  };
};
