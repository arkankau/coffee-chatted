import { Thread, UserFocus } from '../types';
import { FitAIOutput } from '../ai/types';

interface FitComputationResult {
  score: number;
  aiUsed: boolean;
  aiOutput: FitAIOutput | null;
}

/**
 * Compute fit score with optional AI normalization
 * @param thread - Thread to score
 * @param userFocus - User's recruiting focus
 * @param aiFitOutput - Optional AI-normalized fit output
 * @returns Fit score (0-1)
 */
function computeFitScoreWithAI(thread: Thread, userFocus: UserFocus, aiFitOutput: FitAIOutput | null): FitComputationResult {
  let score = 0;
  let aiUsed = false;

  if (aiFitOutput && aiFitOutput.confidence >= 0.75) {
    // Use AI-normalized signals
    aiUsed = true;

    // Industry match: 0 or 0.4 (unknown treated as 0)
    if (aiFitOutput.industry_match === 1) {
      score += 0.4;
    }

    // Role match: 0 or 0.3 (unknown treated as 0)
    if (aiFitOutput.role_match === 1) {
      score += 0.3;
    }

    // Seniority usefulness based on bucket
    if (aiFitOutput.seniority_bucket === 'student' || aiFitOutput.seniority_bucket === 'analyst' || aiFitOutput.seniority_bucket === 'associate') {
      score += 0.2;
    } else {
      score += 0.1; // manager_plus or unknown
    }
  } else {
    // Fallback to rule-based fit
    // Industry match: 0 or 0.4
    if (thread.industry.toLowerCase() === userFocus.targetIndustry.toLowerCase()) {
      score += 0.4;
    }

    // Role match keyword overlap: 0 or 0.3
    const roleKeywords = userFocus.targetRole.toLowerCase().split(/\s+/);
    const threadRole = thread.roleTitle.toLowerCase();
    const hasKeywordMatch = roleKeywords.some(keyword => 
      threadRole.includes(keyword) || keyword.includes(threadRole)
    );
    if (hasKeywordMatch) {
      score += 0.3;
    }

    // Seniority usefulness: 0.2 for student/analyst/associate, 0.1 otherwise
    const roleLower = thread.roleTitle.toLowerCase();
    if (roleLower.includes('student') || roleLower.includes('analyst') || roleLower.includes('associate')) {
      score += 0.2;
    } else {
      score += 0.1; // manager/director/VP or unknown
    }
  }

  // Relationship evidence: +0.1 if priorEngagement (always rule-based)
  if (thread.priorEngagement) {
    score += 0.1;
  }

  // Shared connection bonus (always rule-based)
  if (thread.sharedConnection === 'Same school' || thread.sharedConnection === 'Same hometown/country') {
    score += 0.05;
  } else if (
    thread.sharedConnection === 'Same student org' ||
    thread.sharedConnection === 'Friend-of-friend intro' ||
    thread.sharedConnection === 'Same previous company'
  ) {
    score += 0.08;
  }
  // "None" adds 0.00

  return {
    score: Math.min(score, 1.0),
    aiUsed,
    aiOutput: aiUsed ? aiFitOutput : null,
  };
}

export function computeFitScore(thread: Thread, userFocus: UserFocus, aiFitOutput?: FitAIOutput | null): number {
  const result = computeFitScoreWithAI(thread, userFocus, aiFitOutput || null);
  return result.score;
}

export function computeFitScoreDetailed(thread: Thread, userFocus: UserFocus, aiFitOutput?: FitAIOutput | null): FitComputationResult {
  return computeFitScoreWithAI(thread, userFocus, aiFitOutput || null);
}

// Legacy export for backward compatibility
export function computeFitScoreOld(thread: Thread, userFocus: UserFocus): number {
  let score = 0;

  // Industry match: 0 or 0.4
  if (thread.industry.toLowerCase() === userFocus.targetIndustry.toLowerCase()) {
    score += 0.4;
  }

  // Role match keyword overlap: 0 or 0.3
  const roleKeywords = userFocus.targetRole.toLowerCase().split(/\s+/);
  const threadRole = thread.roleTitle.toLowerCase();
  const hasKeywordMatch = roleKeywords.some(keyword => 
    threadRole.includes(keyword) || keyword.includes(threadRole)
  );
  if (hasKeywordMatch) {
    score += 0.3;
  }

  // Seniority usefulness: 0.2 for student/analyst/associate, 0.1 otherwise
  const roleLower = thread.roleTitle.toLowerCase();
  if (roleLower.includes('student') || roleLower.includes('analyst') || roleLower.includes('associate')) {
    score += 0.2;
  } else {
    score += 0.1; // manager/director/VP or unknown
  }

  // Relationship evidence: +0.1 if priorEngagement
  if (thread.priorEngagement) {
    score += 0.1;
  }

  // Shared connection bonus
  if (thread.sharedConnection === 'Same school' || thread.sharedConnection === 'Same hometown/country') {
    score += 0.05;
  } else if (
    thread.sharedConnection === 'Same student org' ||
    thread.sharedConnection === 'Friend-of-friend intro' ||
    thread.sharedConnection === 'Same previous company'
  ) {
    score += 0.08;
  }
  // "None" adds 0.00

  return Math.min(score, 1.0);
}

export function getFitBucket(fitScore: number): 'High' | 'Med' | 'Low' {
  if (fitScore >= 0.75) return 'High';
  if (fitScore >= 0.5) return 'Med';
  return 'Low';
}
