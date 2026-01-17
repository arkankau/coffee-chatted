import { LearningState, InteractionType, NudgeOutcome } from '../types';

const STORAGE_KEY = 'followUpGuardrail_state';

export function loadLearningState(): LearningState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        suppressedThreads: new Set(parsed.suppressedThreads || []),
        nudgeRecords: parsed.nudgeRecords || [],
      };
    } catch {
      // Fall through to default
    }
  }
  
  return {
    userThreshold: 0.75,
    windowShifts: {},
    threadOverrides: {},
    nudgeHistory: [],
    suppressedThreads: new Set<string>(),
    nudgeRecords: [],
  };
}

export function saveLearningState(state: LearningState): void {
  const toStore = {
    ...state,
    suppressedThreads: Array.from(state.suppressedThreads),
    nudgeRecords: state.nudgeRecords || [],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

export function handleFeedback(
  threadId: string,
  feedbackType: 'followUp' | 'notNow' | 'tooEarly' | 'suppress' | 'stillRelevant' | 'dismiss',
  interactionType: InteractionType,
  currentState: LearningState,
  simulatedToday: Date,
  threadName?: string,
  confidenceScore?: number
): LearningState {
  const newState: LearningState = {
    ...currentState,
    threadOverrides: { ...currentState.threadOverrides },
    windowShifts: { ...currentState.windowShifts },
    nudgeRecords: [...(currentState.nudgeRecords || [])],
  };

  const threadOverride = newState.threadOverrides[threadId] || {};
  let outcome: NudgeOutcome | null = null;

  switch (feedbackType) {
    case 'followUp':
      threadOverride.followupAlreadySent = true;
      outcome = 'accepted';
      break;

    case 'notNow':
    case 'tooEarly':
      // Increase threshold (capped at 0.9) for notNow
      if (feedbackType === 'notNow') {
        newState.userThreshold = Math.min(0.9, newState.userThreshold + 0.05);
        // Add per-thread cooldown (7 days)
        const cooldownEnd = new Date(simulatedToday);
        cooldownEnd.setDate(cooldownEnd.getDate() + 7);
        threadOverride.threadCooldownEnd = cooldownEnd.toISOString();
        // Also record in global history
        newState.nudgeHistory.push({
          threadId,
          date: simulatedToday.toISOString(),
        });
      } else {
        // Shift window later by +1 day for tooEarly
        const currentShift = newState.windowShifts[interactionType] || 0;
        newState.windowShifts[interactionType] = currentShift + 1;
      }
      threadOverride.nudgedAlready = true;
      threadOverride.ignoredNudgesCount = (threadOverride.ignoredNudgesCount || 0) + 1;
      outcome = 'ignored';
      break;

    case 'dismiss':
      threadOverride.nudgedAlready = true;
      outcome = 'dismissed';
      break;

    case 'suppress':
      newState.suppressedThreads.add(threadId);
      threadOverride.suppressThread = true;
      outcome = 'dismissed';
      break;

    case 'stillRelevant':
      threadOverride.overrideFit = true;
      break;
  }

  // Record nudge outcome if applicable
  if (outcome !== null && threadName && confidenceScore !== undefined) {
    newState.nudgeRecords.unshift({
      threadId,
      threadName,
      date: simulatedToday.toISOString(),
      confidenceScore,
      outcome,
    });
    // Keep only last 100 records
    if (newState.nudgeRecords.length > 100) {
      newState.nudgeRecords = newState.nudgeRecords.slice(0, 100);
    }
  }

  newState.threadOverrides[threadId] = threadOverride;
  saveLearningState(newState);
  return newState;
}

export function resetDemo(): void {
  localStorage.removeItem(STORAGE_KEY);
}
