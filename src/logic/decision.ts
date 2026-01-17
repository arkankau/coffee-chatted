import { differenceInDays } from 'date-fns';
import { Thread, UserFocus, TimingState, NudgeType, Decision, InteractionType, LearningState } from '../types';
import { getOptimalWindow } from './norms';
import { computeFitScore } from './fit';
import { FitAIOutput } from '../ai/types';

export function computeTimingState(
  daysSince: number,
  interactionType: InteractionType,
  windowShift: number = 0
): TimingState {
  const [minDays, maxDays] = getOptimalWindow(interactionType, windowShift);
  
  if (daysSince < minDays) return 'TOO_EARLY';
  if (daysSince > maxDays) return 'LATE';
  return 'OPTIMAL';
}

export function computeConfidenceScore(
  thread: Thread,
  timingState: TimingState,
  fitScore: number,
  learningState: LearningState
): number {
  let base = 0;

  // Timing contribution
  if (timingState === 'OPTIMAL') {
    base += 0.55;
  } else if (timingState === 'LATE') {
    base += 0.15;
  }

  // Relationship quality
  if (thread.priorEngagement) {
    base += 0.10;
  }

  // Responsiveness
  if (thread.typicalResponseLatencyDays <= 4) {
    base += 0.10;
  }

  // Fit quality
  if (fitScore >= 0.75) {
    base += 0.10;
  }

  // Shared connection bonus
  if (thread.sharedConnection !== 'None') {
    base += 0.05;
  }

  // Negative factors
  const threadOverride = learningState.threadOverrides[thread.id] || {};
  const ignoredCount = threadOverride.ignoredNudgesCount ?? thread.ignoredNudgesCount;
  base -= 0.15 * ignoredCount;

  if (thread.followupAlreadySent || threadOverride.followupAlreadySent) {
    base -= 0.30; // Increased penalty
  }

  const nudgedAlready = thread.nudgedAlready || threadOverride.nudgedAlready || false;
  if (nudgedAlready) {
    base -= 0.20;
  }

  return Math.max(0, Math.min(1, base));
}

function getNudgesInLast7Days(
  nudgeHistory: Array<{ threadId: string; date: string }>,
  simulatedToday: Date
): number {
  const sevenDaysAgo = new Date(simulatedToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return nudgeHistory.filter(nudge => {
    const nudgeDate = new Date(nudge.date);
    return nudgeDate >= sevenDaysAgo && nudgeDate <= simulatedToday;
  }).length;
}

export function makeDecision(
  thread: Thread,
  userFocus: UserFocus,
  simulatedToday: Date,
  learningState: LearningState,
  aiFitOutput?: FitAIOutput | null
): Decision {
  // Apply thread overrides
  const threadOverride = learningState.threadOverrides[thread.id] || {};
  const effectiveThread: Thread = { ...thread, ...threadOverride };

  // Skip if suppressed
  if (effectiveThread.suppressThread || learningState.suppressedThreads.has(thread.id)) {
    return {
      shouldNudge: false,
      nudgeType: 'SILENT',
      reasons: ['This thread has been suppressed.'],
      inputsUsed: ['suppressThread'],
      confidenceScore: 0,
      fitScore: 0,
      timingState: 'TOO_EARLY',
      daysSince: 0,
    };
  }

  // Compute days since
  const lastInteraction = new Date(effectiveThread.lastInteractionDate);
  const daysSince = differenceInDays(simulatedToday, lastInteraction);

  // Compute timing state (with learned window shift)
  const windowShift = learningState.windowShifts[effectiveThread.interactionType] || 0;
  const timingState = computeTimingState(daysSince, effectiveThread.interactionType, windowShift);

  // Compute fit score (with override if applicable, or AI normalization)
  let fitScore = computeFitScore(effectiveThread, userFocus, aiFitOutput);
  if (effectiveThread.overrideFit) {
    fitScore = 0.8; // Boost to allow nudges
  }

  // Compute confidence score
  const confidenceScore = computeConfidenceScore(effectiveThread, timingState, fitScore, learningState);

  // Check global cooldown (max 1 nudge per 7 days)
  const nudgesInLast7Days = getNudgesInLast7Days(learningState.nudgeHistory, simulatedToday);
  const inGlobalCooldown = nudgesInLast7Days >= 1;

  // Check per-thread cooldown (if "Not now" was clicked, 7 days)
  const threadCooldownEnd = threadOverride.threadCooldownEnd ? new Date(threadOverride.threadCooldownEnd) : null;
  const inThreadCooldown = threadCooldownEnd ? simulatedToday < threadCooldownEnd : false;

  // Decision logic - ONLY nudge on OPTIMAL timing
  const shouldNudge =
    !inGlobalCooldown &&
    !inThreadCooldown &&
    !effectiveThread.nudgedAlready && // Max 1 nudge per thread
    confidenceScore >= learningState.userThreshold &&
    fitScore >= 0.75 &&
    !effectiveThread.followupAlreadySent &&
    timingState === 'OPTIMAL' && // Only OPTIMAL, not LATE
    !effectiveThread.suppressThread;

  // Determine nudge type
  let nudgeType: NudgeType = 'SILENT';
  const reasons: string[] = [];
  const inputsUsed: string[] = ['daysSince', 'timingState', 'fitScore', 'confidenceScore'];

  if (shouldNudge) {
    nudgeType = 'FOLLOW_UP';
    reasons.push('Timing is within the optimal window for this interaction type.');
    if (fitScore >= 0.75) {
      reasons.push('Strong fit with your recruiting focus.');
    }
    if (effectiveThread.priorEngagement) {
      reasons.push('You have prior engagement with this contact.');
    }
    if (timingState === 'OPTIMAL') {
      reasons.push('Now is within your usual follow-up window.');
    }
  } else {
    // Explain silence
    if (inGlobalCooldown) {
      reasons.push('You recently received a nudge (max 1 per 7 days).');
      inputsUsed.push('globalCooldown');
    }
    if (inThreadCooldown) {
      const daysRemaining = Math.ceil((threadCooldownEnd!.getTime() - simulatedToday.getTime()) / (1000 * 60 * 60 * 24));
      reasons.push(`This thread is in cooldown (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining).`);
      inputsUsed.push('threadCooldown');
    }
    if (timingState === 'TOO_EARLY') {
      nudgeType = 'DO_NOTHING_YET';
      reasons.push(`It's only been ${daysSince} days. The optimal window is ${getOptimalWindow(effectiveThread.interactionType, windowShift)[0]}-${getOptimalWindow(effectiveThread.interactionType, windowShift)[1]} days.`);
      inputsUsed.push('timingTooEarly');
    }
    if (timingState === 'LATE') {
      reasons.push(`It's been ${daysSince} days (optimal window ended).`);
      inputsUsed.push('timingLate');
    }
    if (fitScore < 0.75 && !effectiveThread.overrideFit) {
      reasons.push('Fit score is below threshold (0.75).');
      inputsUsed.push('lowFit');
    }
    if (effectiveThread.followupAlreadySent) {
      reasons.push('You have already followed up with this contact.');
      inputsUsed.push('alreadyFollowedUp');
    }
    if (effectiveThread.nudgedAlready) {
      reasons.push('A nudge was already shown for this thread (max 1 per thread).');
      inputsUsed.push('alreadyNudged');
    }
    if (confidenceScore < learningState.userThreshold) {
      reasons.push(`Confidence score (${confidenceScore.toFixed(2)}) is below your threshold (${learningState.userThreshold.toFixed(2)}).`);
      inputsUsed.push('lowConfidence');
    }
  }

  if (reasons.length === 0) {
    reasons.push('No specific action needed at this time.');
  }

  return {
    shouldNudge,
    nudgeType,
    reasons: reasons.slice(0, 4), // Max 4 reasons
    inputsUsed,
    confidenceScore,
    fitScore,
    timingState,
    daysSince,
  };
}
